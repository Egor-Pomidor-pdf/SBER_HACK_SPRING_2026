package kuper

import (
	"context"
	"fmt"
	"sort"
	"sync"

	kuperclient "hudeem-backend/internal/client/kuper"
	"hudeem-backend/internal/model"
	"golang.org/x/sync/errgroup"
)

type ServiceImpl struct {
	client kuperclient.Client
}

func NewService(client kuperclient.Client) *ServiceImpl {
	return &ServiceImpl{client: client}
}

func (s *ServiceImpl) GetNearbyStores(ctx context.Context, lat, lng float64) ([]model.KuperStore, error) {
	nearby, err := s.client.GetNearbyStores(ctx, lat, lng, 5)
	if err != nil {
		return nil, err
	}
	stores := make([]model.KuperStore, 0, len(nearby))
	for _, n := range nearby {
		stores = append(stores, model.KuperStore{
			StoreID:         n.StoreID,
			StoreName:       n.StoreName,
			DistanceM:       n.DistanceM,
			StoreAddress:    n.Address,
			DeliveryTimeMins: n.DeliveryTimeMins,
		})
	}
	return stores, nil
}

func (s *ServiceImpl) SearchProduct(ctx context.Context, storeID, query string) (*model.KuperCartItem, error) {
	result, err := s.client.SearchProduct(ctx, query, storeID)
	if err != nil {
		return nil, err
	}
	if !result.Found {
		return &model.KuperCartItem{Found: false}, nil
	}
	return &model.KuperCartItem{
		KuperProductID:   result.ProductID,
		KuperProductName: result.ProductName,
		PriceRub:         result.PriceRub,
		Found:            true,
	}, nil
}

func (s *ServiceImpl) CreateCart(ctx context.Context, storeID string, items []model.KuperCartItem) (string, string, error) {
	productIDs := make([]string, 0, len(items))
	for _, item := range items {
		if item.Found {
			productIDs = append(productIDs, item.KuperProductID)
		}
	}
	resp, err := s.client.CreateCart(ctx, storeID, productIDs)
	if err != nil {
		return "", "", err
	}
	return resp.CartID, resp.CheckoutURL, nil
}

func (s *ServiceImpl) BuildCart(ctx context.Context, storeID string, ingredients []model.RationIngredient) (*BuildCartResult, error) {
	items := make([]CartItemDetail, len(ingredients))
	sem := make(chan struct{}, 10)
	var mu sync.Mutex

	g, gctx := errgroup.WithContext(ctx)

	for i, ing := range ingredients {
		i, ing := i, ing
		g.Go(func() error {
			sem <- struct{}{}
			defer func() { <-sem }()

			sr, err := s.client.SearchProduct(gctx, ing.Name, storeID)
			if err != nil {
				return fmt.Errorf("search %q: %w", ing.Name, err)
			}

			detail := CartItemDetail{
				IngredientID:   ing.ID.String(),
				IngredientName: ing.Name,
				Found:          sr.Found,
			}
			if sr.Found {
				detail.ProductID = sr.ProductID
				detail.ProductName = sr.ProductName
				detail.PriceRub = sr.PriceRub
			}

			mu.Lock()
			items[i] = detail
			mu.Unlock()
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	productIDs := make([]string, 0, len(items))
	for _, it := range items {
		if it.Found {
			productIDs = append(productIDs, it.ProductID)
		}
	}

	cartResp, err := s.client.CreateCart(ctx, storeID, productIDs)
	if err != nil {
		return nil, fmt.Errorf("create cart: %w", err)
	}

	foundCount := len(productIDs)
	totalPrice := 0
	for _, it := range items {
		if it.Found {
			totalPrice += it.PriceRub
		}
	}

	return &BuildCartResult{
		CartID:        cartResp.CartID,
		CheckoutURL:   cartResp.CheckoutURL,
		TotalPriceRub: totalPrice,
		FoundCount:    foundCount,
		TotalCount:    len(ingredients),
		Items:         items,
	}, nil
}

// SearchReadyMeal ищет продукт по названию блюда (для готовых блюд)
func (s *ServiceImpl) SearchReadyMeal(ctx context.Context, storeID, recipeName string) (*model.ReadyMeal, error) {
	// Простая эвристика: ищем похожий продукт
	searchResult, err := s.client.SearchProduct(ctx, recipeName, storeID)
	if err != nil {
		return nil, err
	}

	if !searchResult.Found {
		return nil, fmt.Errorf("product not found: %s", recipeName)
	}

	// Упрощенный вариант: берем любой найденный продукт как "готовое блюдо"
	return &model.ReadyMeal{
		MealType:        "dinner", // по умолчанию ужин
		GigaChatName:    searchResult.ProductName,
		Kcal:            searchResult.Kcal,
		TotalPriceRub:   searchResult.PriceRub,
		StoreID:         storeID,
		StoreName:       "Купер", // TODO: нужно получить название магазина
		StoreAddress:    "",      // TODO: нужно получить адрес
		DistanceM:       0,       // TODO: нужно получить расстояние
		DeliveryTimeMins: 30,     // TODO: нужно получить время доставки
	}, nil
}

// GetStoresForRation возвращает магазины в двух форматах одновременно.
// ingredients — список ингредиентов из рациона для поиска наличия товаров.
// weightKg — вес пользователя для расчёта калорий при ходьбе.
func (s *ServiceImpl) GetStoresForRation(
	ctx context.Context,
	lat, lng float64,
	ingredients []model.RationIngredient,
	weightKg float64,
) ([]model.StoreDelivery, []model.StoreWalk, error) {
	// Получаем 5 магазинов
	nearbyStores, err := s.client.GetNearbyStores(ctx, lat, lng, 5)
	if err != nil {
		return nil, nil, err
	}

	// Сортируем магазины по distance_m (ближайшие первые)
	sort.Slice(nearbyStores, func(i, j int) bool {
		return nearbyStores[i].DistanceM < nearbyStores[j].DistanceM
	})

	// Подготовка данных для параллельного поиска
	// Для каждого магазина и каждого ингредиента - создаем задачу поиска
	nearbyStoresCount := len(nearbyStores)
	ingredientsCount := len(ingredients)

	// Инициализируем структуры для доставки и ходьбы
	deliveryStores := make([]model.StoreDelivery, 0, nearbyStoresCount)
	walkStores := make([]model.StoreWalk, 0, nearbyStoresCount)

	// Для каждого магазина считаем наличие и цены
	for _, store := range nearbyStores {
		// Инициализируем структуру для доставки
		delivery := model.StoreDelivery{
			ID:              uuid.New(),
			RationID:        "", // TODO: передать ration_id
			StoreID:         store.StoreID,
			StoreName:       store.StoreName,
			StoreAddress:    store.Address,
			DistanceM:       store.DistanceM,
			DeliveryTimeMins: store.DeliveryTimeMins,
			FoundCount:      0,
			TotalCount:      ingredientsCount,
			MatchPercent:    0,
			TotalPriceRub:   0,
		}

		// Инициализируем структуру для ходьбы
		walk := model.StoreWalk{
			ID:              uuid.New(),
			RationID:        "", // TODO: передать ration_id
			StoreID:         store.StoreID,
			StoreName:       store.StoreName,
			StoreAddress:    store.Address,
			DistanceM:       store.DistanceM,
			WalkingTimeMins: 0,
			CaloriesBurned:  0,
			FoundCount:      0,
			TotalCount:      ingredientsCount,
			MatchPercent:    0,
			TotalPriceRub:   0,
		}

		// Параллельный поиск всех ингредиентов в этом магазине
		sem := make(chan struct{}, 10)
		var mu sync.Mutex

		foundCount := 0
		totalPrice := 0

		g, gctx := errgroup.WithContext(ctx)

		for _, ing := range ingredients {
			i, ing := i, ing
			g.Go(func() error {
				sem <- struct{}{}
				defer func() { <-sem }()

				sr, err := s.client.SearchProduct(gctx, ing.Name, store.StoreID)
				if err != nil {
					return err
				}

				mu.Lock()
				if sr.Found {
					foundCount++
					totalPrice += sr.PriceRub
				}
				mu.Unlock()
				return nil
			})
		}

		if err := g.Wait(); err != nil {
			return nil, nil, err
		}

		// Рассчитываем проценты
		matchPercent := 0
		if ingredientsCount > 0 {
			matchPercent = (foundCount * 100) / ingredientsCount
		}

		// Заполняем delivery
		delivery.FoundCount = foundCount
		delivery.TotalPriceRub = totalPrice
		delivery.MatchPercent = matchPercent
		deliveryStores = append(deliveryStores, delivery)

		// Рассчитываем калории и время ходьбы
		caloriesBurned, walkingTimeMins := calc.WalkingCaloriesAndTime(store.DistanceM, weightKg)

		// Заполняем walk
		walk.FoundCount = foundCount
		walk.TotalPriceRub = totalPrice
		walk.MatchPercent = matchPercent
		walk.WalkingTimeMins = walkingTimeMins
		walk.CaloriesBurned = caloriesBurned
		walkStores = append(walkStores, walk)
	}

	// Сортировка магазинов

	// Delivery: MatchPercent DESC, при равенстве DeliveryTimeMins ASC
	sort.Slice(deliveryStores, func(i, j int) bool {
		if deliveryStores[i].MatchPercent != deliveryStores[j].MatchPercent {
			return deliveryStores[i].MatchPercent > deliveryStores[j].MatchPercent
		}
		return deliveryStores[i].DeliveryTimeMins < deliveryStores[j].DeliveryTimeMins
	})

	// Walk: MatchPercent DESC, при равенстве DistanceM ASC
	sort.Slice(walkStores, func(i, j int) bool {
		if walkStores[i].MatchPercent != walkStores[j].MatchPercent {
			return walkStores[i].MatchPercent > walkStores[j].MatchPercent
		}
		return walkStores[i].DistanceM < walkStores[j].DistanceM
	})

	// Возвращаем первые 5 магазинов (если их больше)
	return deliveryStores, walkStores, nil
}
