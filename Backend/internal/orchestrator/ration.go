package orchestrator

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"
)

// --- Интерфейсы для других участников ---

// ProfileService — реализует Николай (repository/profile)
type ProfileService interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error)
}

// GigaChatService — реализует Илья С. (service/gigachat)
// Возвращает: план питания, сырой JSON ответа, ошибку
type GigaChatService interface {
	GenerateMealPlan(ctx context.Context, profile *model.UserProfile) (*model.MealPlan, string, error)
}

// KuperService — реализует Илья А. (service/kuper)
type KuperService interface {
	GetNearbyStores(ctx context.Context, lat, lng float64) ([]model.KuperStore, error)
	SearchProduct(ctx context.Context, storeID, query string) (*model.KuperCartItem, error)
	CreateCart(ctx context.Context, storeID string, items []model.KuperCartItem) (cartID string, checkoutURL string, err error)
}

// RationRepository — реализует Николай (repository/ration)
type RationRepository interface {
	CreateRation(ctx context.Context, r *model.DailyRation) error
	CreateMeals(ctx context.Context, meals []model.RationMeal) error
	CreateIngredients(ctx context.Context, ingredients []model.RationIngredient) error
	SaveStores(ctx context.Context, stores []model.KuperStore) error
	GetRationByID(ctx context.Context, id uuid.UUID) (*model.DailyRation, error)
	GetIngredientsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationIngredient, error)
	GetStoreByID(ctx context.Context, id uuid.UUID) (*model.KuperStore, error)
	SaveCart(ctx context.Context, cart *model.KuperCart, items []model.KuperCartItem) error
	UpdateRationStatus(ctx context.Context, rationID uuid.UUID, status string) error
}

// --- Orchestrator ---

type Orchestrator struct {
	profileSvc ProfileService
	gigaSvc    GigaChatService
	kuperSvc   KuperService
	rationRepo RationRepository
}

func New(
	profileSvc ProfileService,
	gigaSvc GigaChatService,
	kuperSvc KuperService,
	rationRepo RationRepository,
) *Orchestrator {
	return &Orchestrator{
		profileSvc: profileSvc,
		gigaSvc:    gigaSvc,
		kuperSvc:   kuperSvc,
		rationRepo: rationRepo,
	}
}

// GenerateRation — шаги 1–6 пайплайна
func (o *Orchestrator) GenerateRation(ctx context.Context, userID uuid.UUID, lat, lng float64) (*model.RationResponse, error) {
	// Шаг 2: параллельно получаем профиль и ближайшие магазины
	var profile *model.UserProfile
	var stores []model.KuperStore

	eg, egCtx := errgroup.WithContext(ctx)

	eg.Go(func() error {
		var err error
		profile, err = o.profileSvc.GetByUserID(egCtx, userID)
		if err != nil {
			return fmt.Errorf("get profile: %w", err)
		}
		return nil
	})

	eg.Go(func() error {
		var err error
		stores, err = o.kuperSvc.GetNearbyStores(egCtx, lat, lng)
		if err != nil {
			return fmt.Errorf("get stores: %w", err)
		}
		return nil
	})

	if err := eg.Wait(); err != nil {
		return nil, err
	}

	// Шаг 3–4: генерируем рацион через GigaChat
	plan, rawJSON, err := o.gigaSvc.GenerateMealPlan(ctx, profile)
	if err != nil {
		return nil, fmt.Errorf("generate meal plan: %w", err)
	}

	// Шаг 5: сохраняем в БД
	rationID := uuid.New()
	ration := &model.DailyRation{
		ID:          rationID,
		UserID:      userID,
		RationDate:  time.Now(),
		Status:      "generated",
		GigachatRaw: rawJSON,
	}

	meals := make([]model.RationMeal, 0, len(plan.Meals))
	totalKcal := 0
	for i, m := range plan.Meals {
		totalKcal += m.Kcal
		meals = append(meals, model.RationMeal{
			ID:        uuid.New(),
			RationID:  rationID,
			MealType:  m.MealType,
			Name:      m.Name,
			Kcal:      m.Kcal,
			SortOrder: i,
		})
	}
	ration.TotalKcal = totalKcal

	ingredients := make([]model.RationIngredient, 0, len(plan.ShoppingList))
	for i, s := range plan.ShoppingList {
		ingredients = append(ingredients, model.RationIngredient{
			ID:        uuid.New(),
			RationID:  rationID,
			Name:      s.Name,
			Quantity:  s.Quantity,
			Unit:      s.Unit,
			SortOrder: i,
		})
	}

	for i := range stores {
		stores[i].ID = uuid.New()
		stores[i].RationID = rationID
	}

	// Сохраняем асинхронно — не блокируем ответ пользователю
	go func() {
		saveCtx := context.Background()
		if err := o.rationRepo.CreateRation(saveCtx, ration); err != nil {
			log.Printf("save ration: %v", err)
			return
		}
		if err := o.rationRepo.CreateMeals(saveCtx, meals); err != nil {
			log.Printf("save meals: %v", err)
		}
		if err := o.rationRepo.CreateIngredients(saveCtx, ingredients); err != nil {
			log.Printf("save ingredients: %v", err)
		}
		if err := o.rationRepo.SaveStores(saveCtx, stores); err != nil {
			log.Printf("save stores: %v", err)
		}
	}()

	// Шаг 6: ответ фронту
	return &model.RationResponse{
		RationID:    rationID,
		Meals:       meals,
		Ingredients: ingredients,
		Stores:      stores,
	}, nil
}

// CreateCart — шаги 7–9 пайплайна
func (o *Orchestrator) CreateCart(ctx context.Context, rationID, storeID uuid.UUID) (*model.CartResponse, error) {
	// Получаем рацион и ингредиенты
	ration, err := o.rationRepo.GetRationByID(ctx, rationID)
	if err != nil {
		return nil, fmt.Errorf("get ration: %w", err)
	}

	ingredients, err := o.rationRepo.GetIngredientsByRationID(ctx, rationID)
	if err != nil {
		return nil, fmt.Errorf("get ingredients: %w", err)
	}

	// Находим store_id строкой для Купера
	store, err := o.rationRepo.GetStoreByID(ctx, storeID)
	if err != nil {
		return nil, fmt.Errorf("get store: %w", err)
	}

	// Шаг 8: параллельный поиск ингредиентов + создание корзины
	const maxConcurrent = 10
	sem := make(chan struct{}, maxConcurrent)

	cartItems := make([]model.KuperCartItem, len(ingredients))
	var mu sync.Mutex

	eg, egCtx := errgroup.WithContext(ctx)

	for i, ing := range ingredients {
		i, ing := i, ing // capture
		eg.Go(func() error {
			sem <- struct{}{}
			defer func() { <-sem }()

			item, err := o.kuperSvc.SearchProduct(egCtx, store.StoreID, ing.Name)
			mu.Lock()
			defer mu.Unlock()
			if err != nil || item == nil {
				cartItems[i] = model.KuperCartItem{
					ID:             uuid.New(),
					IngredientID:   ing.ID,
					IngredientName: ing.Name,
					Found:          false,
				}
				return nil
			}
			item.ID = uuid.New()
			item.IngredientID = ing.ID
			item.IngredientName = ing.Name
			cartItems[i] = *item
			return nil
		})
	}

	// Параллельно создаём корзину в Купере
	var kuperCartID, checkoutURL string
	eg.Go(func() error {
		var foundItems []model.KuperCartItem
		// Ждём пока поиск завершится — создаём корзину с тем что нашли
		// Для МВП: создаём корзину сразу с пустым списком, Купер вернёт URL
		id, url, err := o.kuperSvc.CreateCart(egCtx, store.StoreID, nil)
		if err != nil {
			return fmt.Errorf("create kuper cart: %w", err)
		}
		_ = foundItems
		kuperCartID = id
		checkoutURL = url
		return nil
	})

	if err := eg.Wait(); err != nil {
		return nil, err
	}

	// Считаем итоги
	totalPrice := 0
	foundCount := 0
	for _, item := range cartItems {
		if item.Found {
			totalPrice += item.PriceRub
			foundCount++
		}
	}

	cart := &model.KuperCart{
		ID:            uuid.New(),
		RationID:      rationID,
		StoreID:       storeID,
		TotalPriceRub: totalPrice,
		FoundCount:    foundCount,
		TotalCount:    len(ingredients),
		CheckoutURL:   checkoutURL,
	}
	for i := range cartItems {
		cartItems[i].CartID = cart.ID
	}

	// Шаг 9: сохраняем
	go func() {
		saveCtx := context.Background()
		if err := o.rationRepo.SaveCart(saveCtx, cart, cartItems); err != nil {
			log.Printf("save cart: %v", err)
		}
		if err := o.rationRepo.UpdateRationStatus(saveCtx, rationID, "ordered"); err != nil {
			log.Printf("update ration status: %v", err)
		}
	}()

	_ = ration
	_ = kuperCartID

	return &model.CartResponse{
		CartID:        cart.ID,
		TotalPriceRub: totalPrice,
		FoundCount:    foundCount,
		TotalCount:    len(ingredients),
		CheckoutURL:   checkoutURL,
		Items:         cartItems,
	}, nil
}
