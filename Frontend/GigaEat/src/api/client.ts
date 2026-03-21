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
} from "../contracts";
import {
  MOCK_STORES,
  MOCK_RESTAURANTS,
  MOCK_FEED,
  MOCK_MEAL_PLAN,
} from "../mocks";

const USE_MOCK = true;
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const http = axios.create({ baseURL: BASE_URL, timeout: 10_000 });


const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));


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
