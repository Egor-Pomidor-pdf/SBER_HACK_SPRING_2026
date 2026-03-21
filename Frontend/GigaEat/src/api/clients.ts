/// <reference types="vite/client" />
import axios from "axios";
import type {
  PlanRequest,
  MealPlan,
  StoreResult,
  Restaurant,
  CartRequest,
  CartResponse,
  FeedPost,
  OrderHistoryItem,
  CartData,
  RationRequest,
  RationResponse,
} from "../contracts";
import {
  MOCK_STORES,
  MOCK_RESTAURANTS,
  MOCK_FEED,
  MOCK_MEAL_PLAN,
  MOCK_ORDER_HISTORY,
  MOCK_CART,
} from "../mocks";

const USE_MOCK = false; // flip to false when backend is up
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const http = axios.create({ baseURL: BASE_URL, timeout: 10_000 });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── GigaEat (legacy mock flow) ─────────────────────────────────────────────

export async function getPlan(
  req: PlanRequest,
): Promise<{
  plan: MealPlan;
  stores: StoreResult[];
  restaurants: Restaurant[];
}> {
  if (USE_MOCK) {
    await delay(1800);
    return {
      plan: MOCK_MEAL_PLAN,
      stores: MOCK_STORES,
      restaurants: MOCK_RESTAURANTS,
    };
  }
  const { data } = await http.post("/gigaeat/plan", req);
  return data;
}

export async function createCart(req: CartRequest): Promise<CartResponse> {
  if (USE_MOCK) {
    await delay(600);
    return { cart_url: "https://kuper.ru/cart/mock-123" };
  }
  const { data } = await http.post("/gigaeat/cart", req);
  return data;
}

// ─── Backend-aligned endpoints (CONTEXT.md) ──────────────────────────────────

/** POST /api/v1/ration — generate ration via GigaChat */
export async function generateRation(req: RationRequest): Promise<RationResponse> {
  if (USE_MOCK) {
    await delay(1800);
    return {
      ration_id: "mock-ration-001",
      profile_incomplete: false,
      missing_fields: [],
      meals: MOCK_MEAL_PLAN.meals.map((m, i) => ({
        id: `meal-${i}`,
        meal_type: m.meal_type,
        name: m.dish,
        kcal: m.kcal,
      })),
      ingredients: MOCK_MEAL_PLAN.shopping_list.map((s, i) => ({
        id: `ing-${i}`,
        name: s.product,
        quantity: String(s.qty),
        unit: s.unit,
      })),
      stores_delivery: MOCK_STORES.map((st) => ({
        id: st.store_id,
        store_id: st.store_id,
        store_name: st.name,
        address: "",
        distance_m: st.distance_m,
        delivery_time_mins: st.delivery_min,
        total_price_rub: st.total_price,
        found_count: st.available.length,
        total_count: st.available.length + st.missing.length,
      })),
      stores_walk: [],
    };
  }
  const { data } = await http.post("/api/v1/ration", req);
  return data;
}

/** POST /api/v1/ration/:id/cart — create cart for a store */
export async function createRationCart(rationId: string, storeId: string): Promise<CartData> {
  if (USE_MOCK) {
    await delay(600);
    return MOCK_CART;
  }
  const { data } = await http.post(`/api/v1/ration/${rationId}/cart`, { store_id: storeId });
  return data;
}

/** GET /api/v1/ration/history?user_id=UUID — order history */
export async function getOrderHistory(userId: string): Promise<OrderHistoryItem[]> {
  if (USE_MOCK) {
    await delay(400);
    return MOCK_ORDER_HISTORY;
  }
  const { data } = await http.get("/api/v1/ration/history", { params: { user_id: userId } });
  return data.rations ?? data;
}

/** GET /api/v1/ration/:id — get ration by ID */
export async function getRation(rationId: string): Promise<RationResponse> {
  if (USE_MOCK) {
    await delay(300);
    return {
      ration_id: rationId,
      profile_incomplete: false,
      missing_fields: [],
      meals: MOCK_MEAL_PLAN.meals.map((m, i) => ({
        id: `meal-${i}`,
        meal_type: m.meal_type,
        name: m.dish,
        kcal: m.kcal,
      })),
      ingredients: MOCK_MEAL_PLAN.shopping_list.map((s, i) => ({
        id: `ing-${i}`,
        name: s.product,
        quantity: String(s.qty),
        unit: s.unit,
      })),
      stores_delivery: [],
      stores_walk: [],
    };
  }
  const { data } = await http.get(`/api/v1/ration/${rationId}`);
  return data;
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function getFeed(type?: string): Promise<FeedPost[]> {
  if (USE_MOCK) {
    await delay(400);
    return type
      ? MOCK_FEED.filter((p: FeedPost) => p.type === type)
      : MOCK_FEED;
  }
  const { data } = await http.get("/feed", { params: { type } });
  return data;
}

export async function likePost(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay(150);
    return;
  }
  await http.post(`/feed/${id}/like`);
}
