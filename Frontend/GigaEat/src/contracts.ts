// ─── Meal Plan ────────────────────────────────────────────────────────────────

export interface MealItem {
  day: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  dish: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface ShoppingItem {
  product: string;
  qty: number;
  unit: string;
}

export interface MealPlan {
  meals: MealItem[];
  shopping_list: ShoppingItem[];
}

// ─── User Preferences ────────────────────────────────────────────────────────

export interface UserPreferences {
  allergies: string; // '' if none
  intolerances: string; // '' if none
  disliked: string; // '' if none
}

// ─── Kuper / Store ────────────────────────────────────────────────────────────

export interface Product {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  weight_g: number;
  price_rub: number;
}

export interface StoreResult {
  store_id: string;
  name: string;
  distance_m: number;
  total_price: number;
  delivery_min: number;
  available: Product[];
  missing: string[];
  /** "darkstore" — собственная доставка (Лавка, Самокат), "supermarket" — нужен агрегатор */
  type?: "supermarket" | "darkstore";
}

// ─── Restaurant / 2GIS ───────────────────────────────────────────────────────

export interface Dish {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  price_rub: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance_m: number;
  walk_kcal: number;
  dishes: Dish[];
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export type PostType = "dish" | "recipe" | "achievement";

export interface FeedPost {
  id: string;
  user_id: string;
  user_name: string;
  type: PostType;
  dish_name: string;
  body: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  photo_url?: string;
  place_name?: string;
  place_lat?: number;
  place_lon?: number;
  distance_m?: number;
  walk_kcal?: number;
  likes_count: number;
  created_at: string;
}

// ─── Order History ───────────────────────────────────────────────────────────

export interface OrderHistoryItem {
  ration_id: string;
  date: string; // ISO date string "2026-03-21"
  total_kcal: number;
  status: "generated" | "ordered";
  meals: {
    meal_type: string;
    name: string;
    kcal: number;
  }[];
  store_name?: string;
  total_price_rub?: number;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  ingredient_name: string;
  product_name: string | null;
  price_rub: number;
  found: boolean;
  quantity?: number;
}

export interface CartData {
  cart_id: string;
  total_price_rub: number;
  found_count: number;
  total_count: number;
  checkout_url: string;
  items: CartItem[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface RationRequest {
  user_id: string;
  lat: number;
  lng: number;
  consumed_meals?: {
    meal_type: string;
    name: string;
    kcal_eaten: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  }[];
}

export interface RationResponse {
  ration_id: string;
  profile_incomplete: boolean;
  missing_fields: string[];
  meals: { id: string; meal_type: string; name: string; kcal: number }[];
  ingredients: { id: string; name: string; quantity: string; unit: string }[];
  stores_delivery: StoreDelivery[];
  stores_walk: StoreWalk[];
}

export interface StoreDelivery {
  id: string;
  store_id: string;
  store_name: string;
  address: string;
  distance_m: number;
  delivery_time_mins: number;
  total_price_rub: number;
  found_count: number;
  total_count: number;
}

export interface StoreWalk {
  id: string;
  store_id: string;
  store_name: string;
  address: string;
  distance_m: number;
  walking_time_mins: number;
  calories_burned: number;
  total_price_rub: number;
  found_count: number;
  total_count: number;
}

export interface PlanRequest {
  days: 1 | 3 | 7;
  daily_kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  already_eaten_today: number;
  lat: number;
  lon: number;
  preferences?: UserPreferences;
}

export interface CartRequest {
  store_id: string;
  items: ShoppingItem[];
}

export interface CartResponse {
  cart_url: string;
}
