package orchestrator

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/loks1k192/ration-service/internal/model"
	"github.com/loks1k192/ration-service/internal/repository"
	"github.com/loks1k192/ration-service/internal/service"
	"golang.org/x/sync/errgroup"
)

type RationOrchestrator struct {
	profileRepo *repository.ProfileRepository
	rationRepo  *repository.RationRepository
	kuperRepo   *repository.KuperRepository
	gigachat    service.GigaChatService
	kuper       service.KuperService
}

func NewRationOrchestrator(
	profileRepo *repository.ProfileRepository,
	rationRepo *repository.RationRepository,
	kuperRepo *repository.KuperRepository,
	gigachat service.GigaChatService,
	kuper service.KuperService,
) *RationOrchestrator {
	return &RationOrchestrator{
		profileRepo: profileRepo,
		rationRepo:  rationRepo,
		kuperRepo:   kuperRepo,
		gigachat:    gigachat,
		kuper:       kuper,
	}
}

// GenerateRation orchestrates the full ration generation pipeline:
// 1. Fetch profile + nearby stores in parallel
// 2. Call GigaChat to generate meal plan
// 3. Save everything in a single transaction
func (o *RationOrchestrator) GenerateRation(ctx context.Context, userID uuid.UUID, lat, lng float64) (*model.GenerateRationResponse, error) {
	// Update user location
	if err := o.profileRepo.UpdateLocation(ctx, userID, lat, lng); err != nil {
		log.Printf("warn: failed to update location: %v", err)
	}

	// Step 1: parallel fetch of profile and stores
	var profile *model.UserProfile
	var stores []model.KuperNearbyStore

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		var err error
		profile, err = o.profileRepo.GetByUserID(gCtx, userID)
		if err != nil {
			return fmt.Errorf("fetch profile: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		var err error
		stores, err = o.kuper.GetNearbyStores(gCtx, lat, lng, 5)
		if err != nil {
			return fmt.Errorf("fetch stores: %w", err)
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	// Step 2: generate ration via GigaChat
	gigaResp, rawJSON, err := o.gigachat.GenerateRation(ctx, profile)
	if err != nil {
		return nil, fmt.Errorf("gigachat generate: %w", err)
	}

	// Calculate total kcal
	totalKcal := 0
	for _, m := range gigaResp.Meals {
		totalKcal += m.Kcal
	}

	// Step 3: save everything in one transaction
	ration, savedMeals, savedIngredients, savedStores, err := o.rationRepo.SaveRation(
		ctx, userID, totalKcal, json.RawMessage(rawJSON),
		gigaResp.Meals, gigaResp.ShoppingList, stores,
	)
	if err != nil {
		return nil, fmt.Errorf("save ration: %w", err)
	}

	// Build response
	resp := &model.GenerateRationResponse{
		RationID: ration.ID,
	}
	for _, m := range savedMeals {
		resp.Meals = append(resp.Meals, model.MealResponse{
			MealType: m.MealType,
			Name:     m.Name,
			Kcal:     m.Kcal,
		})
	}
	for _, ing := range savedIngredients {
		resp.Ingredients = append(resp.Ingredients, model.IngredientResponse{
			ID:       ing.ID,
			Name:     ing.Name,
			Quantity: ing.Quantity,
			Unit:     ing.Unit,
		})
	}
	for _, s := range savedStores {
		resp.Stores = append(resp.Stores, model.StoreResponse{
			ID:        s.ID,
			StoreID:   s.StoreID,
			StoreName: s.StoreName,
			DistanceM: s.DistanceM,
		})
	}

	return resp, nil
}

// CreateCart orchestrates cart creation:
// 1. Select store
// 2. Search each ingredient in parallel
// 3. Create cart via Kuper
// 4. Save everything to DB
func (o *RationOrchestrator) CreateCart(ctx context.Context, rationID, storeID uuid.UUID) (*model.CreateCartResponse, error) {
	// Select the store
	if err := o.kuperRepo.SelectStore(ctx, rationID, storeID); err != nil {
		return nil, fmt.Errorf("select store: %w", err)
	}

	store, err := o.kuperRepo.GetStoreByID(ctx, storeID)
	if err != nil {
		return nil, fmt.Errorf("get store: %w", err)
	}

	// Get ingredients for this ration
	ingredients, err := o.rationRepo.GetIngredientsByRationID(ctx, rationID)
	if err != nil {
		return nil, fmt.Errorf("get ingredients: %w", err)
	}

	// Search each ingredient in parallel
	type searchResult struct {
		ingredient model.RationIngredient
		result     *model.KuperSearchResult
	}

	results := make([]searchResult, len(ingredients))
	g, gCtx := errgroup.WithContext(ctx)

	for i, ing := range ingredients {
		i, ing := i, ing
		g.Go(func() error {
			res, err := o.kuper.SearchProduct(gCtx, ing.Name, store.StoreID)
			if err != nil {
				log.Printf("warn: search failed for %q: %v", ing.Name, err)
				results[i] = searchResult{ingredient: ing, result: &model.KuperSearchResult{Found: false}}
				return nil
			}
			results[i] = searchResult{ingredient: ing, result: res}
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("search ingredients: %w", err)
	}

	// Collect found product IDs for cart creation
	var productIDs []string
	for _, r := range results {
		if r.result.Found {
			productIDs = append(productIDs, r.result.ProductID)
		}
	}

	// Create cart in Kuper
	kuperCart, err := o.kuper.CreateCart(ctx, store.StoreID, productIDs)
	if err != nil {
		return nil, fmt.Errorf("create kuper cart: %w", err)
	}

	// Build cart items for DB
	totalPrice := 0
	foundCount := 0
	cartItems := make([]model.KuperCartItem, 0, len(results))
	cartItemResponses := make([]model.CartItemResponse, 0, len(results))

	for _, r := range results {
		item := model.KuperCartItem{
			IngredientID: r.ingredient.ID,
			PriceRub:     r.result.PriceRub,
			Found:        r.result.Found,
		}
		respItem := model.CartItemResponse{
			IngredientName: r.ingredient.Name,
			PriceRub:       r.result.PriceRub,
			Found:          r.result.Found,
		}

		if r.result.Found {
			item.KuperProductID = &r.result.ProductID
			item.KuperProductName = &r.result.ProductName
			respItem.ProductName = &r.result.ProductName
			totalPrice += r.result.PriceRub
			foundCount++
		}

		cartItems = append(cartItems, item)
		cartItemResponses = append(cartItemResponses, respItem)
	}

	// Save to DB
	savedCart, _, err := o.kuperRepo.SaveCart(
		ctx, rationID, storeID, totalPrice, foundCount, len(ingredients), kuperCart.CheckoutURL, cartItems,
	)
	if err != nil {
		return nil, fmt.Errorf("save cart: %w", err)
	}

	return &model.CreateCartResponse{
		CartID:        savedCart.ID,
		TotalPriceRub: totalPrice,
		FoundCount:    foundCount,
		TotalCount:    len(ingredients),
		CheckoutURL:   kuperCart.CheckoutURL,
		Items:         cartItemResponses,
	}, nil
}
