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
	DeductKBZHU(ctx context.Context, userID uuid.UUID, kcal, proteinG, fatG, carbsG int) error
}

// GigaChatService — реализует Илья С. (service/gigachat)
// Возвращает: план питания, сырой JSON ответа, ошибку
type GigaChatService interface {
	GenerateMealPlan(ctx context.Context, profile *model.UserProfile, consumed []model.ConsumedMealDTO) (*model.MealPlan, string, error)
}

// KuperService — реализует Илья А. (service/kuper)
type KuperService interface {
	GetNearbyStores(ctx context.Context, lat, lng float64) ([]model.KuperStore, error)
	SearchProduct(ctx context.Context, storeID, query string) (*model.KuperCartItem, error)
	CreateCart(ctx context.Context, storeID string, items []model.KuperCartItem) (cartID string, checkoutURL string, err error)
	GetStoresForRation(ctx context.Context, lat, lng float64, ingredients []model.RationIngredient, weightKg float64) ([]model.StoreDelivery, []model.StoreWalk, error)
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
	GetMealsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationMeal, error)
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

// GenerateRation — основной пайплайн для создания рациона
func (o *Orchestrator) GenerateRation(ctx context.Context, userID uuid.UUID, lat, lng float64, consumed []model.ConsumedMealDTO) (*model.RationResponse, error) {
	// Шаг 1: получаем профиль
	profile, err := o.profileSvc.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get profile: %w", err)
	}

	// Шаг 2: проверяем полноту профиля
	missingFields := o.checkProfileCompleteness(profile)
	profileIncomplete := len(missingFields) > 0

	// Шаг 3: генерируем рацион через GigaChat
	plan, rawJSON, err := o.gigaSvc.GenerateMealPlan(ctx, profile, consumed)
	if err != nil {
		return nil, fmt.Errorf("generate meal plan: %w", err)
	}

	// Шаг 4: получаем магазины для доставки и пешком
	deliveryStores, walkStores, err := o.kuperSvc.GetStoresForRation(
		ctx, lat, lng, plan.ShoppingList, profile.WeightKg)
	if err != nil {
		return nil, fmt.Errorf("get stores: %w", err)
	}

	// Шаг 5: сохраняем в БД синхронно
	rationID := uuid.New()
	ration := &model.DailyRation{
		ID:          rationID,
		UserID:      userID,
		RationDate:  time.Now(),
		Status:      "generated",
		GigachatRaw: rawJSON,
	}

	// Сохраняем meals
	meals := make([]model.RationMeal, 0, len(plan.Meals))
	totalKcal := 0
	totalProtein := 0
	totalFat := 0
	totalCarbs := 0
	for i, m := range plan.Meals {
		totalKcal    += m.Kcal
		totalProtein += m.ProteinG
		totalFat     += m.FatG
		totalCarbs   += m.CarbsG
		meals = append(meals, model.RationMeal{
			ID:        uuid.New(),
			RationID:  rationID,
			MealType:  m.MealType,
			Name:      m.Name,
			Kcal:      m.Kcal,
			ProteinG:  m.ProteinG,
			FatG:      m.FatG,
			CarbsG:    m.CarbsG,
			SortOrder: i,
		})
	}
	ration.TotalKcal = totalKcal

	// Сохраняем ingredients
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

	// Сохраняем магазины (для совместимости храним как KuperStore)
	for i := range deliveryStores {
		deliveryStores[i].ID = uuid.New()
		deliveryStores[i].RationID = rationID
	}
	for i := range walkStores {
		walkStores[i].ID = uuid.New()
		walkStores[i].RationID = rationID
	}

	// Синхронное сохранение
	if err := o.rationRepo.CreateRation(ctx, ration); err != nil {
		return nil, fmt.Errorf("save ration: %w", err)
	}
	if err := o.rationRepo.CreateMeals(ctx, meals); err != nil {
		return nil, fmt.Errorf("save meals: %w", err)
	}
	if err := o.rationRepo.CreateIngredients(ctx, ingredients); err != nil {
		return nil, fmt.Errorf("save ingredients: %w", err)
	}

	// Сохраняем магазины - объединяем delivery и walk
	allStores := make([]model.KuperStore, 0, len(deliveryStores)+len(walkStores))
	for _, s := range deliveryStores {
		allStores = append(allStores, model.KuperStore{
			ID:              s.ID,
			RationID:        s.RationID,
			StoreID:         s.StoreID,
			StoreName:       s.StoreName,
			DistanceM:       s.DistanceM,
			StoreAddress:    s.StoreAddress,
			DeliveryTimeMins: s.DeliveryTimeMins,
		})
	}
	for _, s := range walkStores {
		allStores = append(allStores, model.KuperStore{
			ID:              s.ID,
			RationID:        s.RationID,
			StoreID:         s.StoreID,
			StoreName:       s.StoreName,
			DistanceM:       s.DistanceM,
			StoreAddress:    s.StoreAddress,
			DeliveryTimeMins: 0, // для walk магазинов время доставки не актуально
		})
	}

	if err := o.rationRepo.SaveStores(ctx, allStores); err != nil {
		return nil, fmt.Errorf("save stores: %w", err)
	}

	// Шаг 6: формируем ответ
	return &model.RationResponse{
		RationID:        rationID,
		ProfileIncomplete: profileIncomplete,
		MissingFields:    missingFields,
		Meals:            meals,
		Ingredients:      ingredients,
		StoresDelivery:   deliveryStores,
		StoresWalk:       walkStores,
	}, nil
}

// checkProfileCompleteness проверяет, все ли необходимые поля заполнены
func (o *Orchestrator) checkProfileCompleteness(profile *model.UserProfile) []string {
	var missing []string

	if profile.DietaryRestrictions == "" {
		missing = append(missing, "dietary_restrictions")
	}
	if len(profile.Allergies) == 0 {
		missing = append(missing, "allergies")
	}
	if len(profile.Preferences) == 0 {
		missing = append(missing, "preferences")
	}

	return missing
}

// CreateCart — шаги 7–9 пайплайна
func (o *Orchestrator) CreateCart(ctx context.Context, rationID, storeID uuid.UUID) (*model.CartResponse, error) {
	// 1. Получить рацион
	ration, err := o.rationRepo.GetRationByID(ctx, rationID)
	if err != nil {
		return nil, fmt.Errorf("get ration: %w", err)
	}

	// 2. Получить ингредиенты
	ingredients, err := o.rationRepo.GetIngredientsByRationID(ctx, rationID)
	if err != nil {
		return nil, fmt.Errorf("get ingredients: %w", err)
	}

	// 3. Получить магазин
	store, err := o.rationRepo.GetStoreByID(ctx, storeID)
	if err != nil {
		return nil, fmt.Errorf("get store: %w", err)
	}

	// 4. Получить блюда рациона (нужны для суммирования КБЖУ)
	meals, err := o.rationRepo.GetMealsByRationID(ctx, rationID)
	if err != nil {
		return nil, fmt.Errorf("get meals: %w", err)
	}

	// 5. Параллельный поиск всех ингредиентов (семафор 10)
	const maxConcurrent = 10
	sem := make(chan struct{}, maxConcurrent)
	cartItems := make([]model.KuperCartItem, len(ingredients))
	var mu sync.Mutex

	eg, egCtx := errgroup.WithContext(ctx)

	for i, ing := range ingredients {
		i, ing := i, ing
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

	// 6. Дождаться поиска
	if err := eg.Wait(); err != nil {
		return nil, err
	}

	// 7. Создать корзину с реальными найденными товарами
	foundItems := make([]model.KuperCartItem, 0, len(cartItems))
	for _, item := range cartItems {
		if item.Found {
			foundItems = append(foundItems, item)
		}
	}
	kuperCartID, checkoutURL, err := o.kuperSvc.CreateCart(ctx, store.StoreID, foundItems)
	if err != nil {
		return nil, fmt.Errorf("create kuper cart: %w", err)
	}

	// 8. Посчитать итоги
	totalPrice := 0
	foundCount := 0
	for _, item := range cartItems {
		if item.Found {
			totalPrice += item.PriceRub
			foundCount++
		}
	}

	// 9. Суммировать КБЖУ всех блюд рациона
	totalKcal, totalProtein, totalFat, totalCarbs := 0, 0, 0, 0
	for _, m := range meals {
		totalKcal    += m.Kcal
		totalProtein += m.ProteinG
		totalFat     += m.FatG
		totalCarbs   += m.CarbsG
	}

	// 10. Сохранить корзину в БД синхронно
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
	if err := o.rationRepo.SaveCart(ctx, cart, cartItems); err != nil {
		return nil, fmt.Errorf("save cart: %w", err)
	}

	// 11. Списать КБЖУ из профиля
	if err := o.profileSvc.DeductKBZHU(ctx, ration.UserID, totalKcal, totalProtein, totalFat, totalCarbs); err != nil {
		// Не блокируем ответ — логируем и продолжаем
		log.Printf("deduct kbzhu: %v", err)
	}

	// 12. Обновить статус рациона → consumed
	if err := o.rationRepo.UpdateRationStatus(ctx, rationID, "consumed"); err != nil {
		log.Printf("update ration status: %v", err)
	}

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
