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
}


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


export interface GigaEatCard {
  type: "store" | "restaurant";
  entity: StoreResult | Restaurant;
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
}

export interface CartRequest {
  store_id: string;
  items: ShoppingItem[];
}

export interface CartResponse {
  cart_url: string;
}
