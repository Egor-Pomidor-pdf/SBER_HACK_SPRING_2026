package kuper

import (
	"context"
	"fmt"
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

func (s *ServiceImpl) GetNearbyStores(ctx context.Context, lat, lng float64) ([]model.KuperNearbyStore, error) {
	return s.client.GetNearbyStores(ctx, lat, lng, 5)
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
