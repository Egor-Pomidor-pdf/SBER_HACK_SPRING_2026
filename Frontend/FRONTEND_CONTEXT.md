# FRONTEND CONTEXT — GigaEat React App

**Хакатон Сбер Spring 2026 — актуально на 21.03.2026**

Этот файл — полный контекст фронтенд-реализации приложения GigaEat. Читай целиком перед тем как что-то менять.

---

## 1. Что такое проект

GigaEat — мобильное веб-приложение (PWA-ready) для экосистемы «Худеем на здоровье». Пользователь отслеживает КБЖУ, генерирует рацион через GigaChat, подбирает магазин Купер для покупки ингредиентов и ведёт историю питания с календарём.

**Ключевой сценарий пользователя:**
1. Открывает дашборд → видит текущие КБЖУ, приёмы пищи, воду, активность
2. Нажимает «Составить рацион на день»
3. Видит интро-экран → нажимает «Заполнить анкету» (или пропускает)
4. Заполняет аллергии / непереносимости / нелюбимые продукты
5. Получает рацион с тремя вариантами (Классика / Что-то новое / Микс)
6. Может заменить или удалить отдельные блюда
7. Нажимает «Подобрать магазин» → видит список магазинов и ресторанов
8. Выбирает магазин → открывается корзина с возможностью редактирования
9. Оформляет заказ в Купере

---

## 2. Стек технологий

| Компонент | Решение |
|---|---|
| Фреймворк | React 19.2.4 |
| Язык | TypeScript 5.9.3 |
| Сборщик | Vite 8.0.1 |
| HTTP-клиент | Axios 1.13.6 |
| Стилизация | CSS-in-JS (inline styles, объекты `React.CSSProperties`) |
| Роутинг | Нет (SPA с модальными окнами, состояние через `useState`) |
| State management | React hooks (`useState`, `useEffect`) |
| Шрифт | Manrope (400, 500, 600, 700, 800) через Google Fonts |
| Макет | Mobile-first, max-width 430px |

**Нет зависимостей**: react-router, redux, zustand, styled-components, tailwind, CSS modules.

---

## 3. Файловая структура

```
Frontend/
└── GigaEat/
    ├── index.html                          # Точка входа HTML
    ├── package.json                        # Зависимости: react, react-dom, axios
    ├── vite.config.ts                      # Vite + React plugin, порт 5173
    ├── tsconfig.json                       # Ссылки на tsconfig.app.json и tsconfig.node.json
    ├── tsconfig.app.json                   # Target: ES2020, JSX: react-jsx
    ├── tsconfig.node.json                  # Для Vite конфига
    ├── eslint.config.js                    # ESLint 9 flat config
    ├── public/                             # Статика
    └── src/
        ├── main.tsx                        # ReactDOM.createRoot, StrictMode, импорт index.css
        ├── App.tsx                         # Обёртка: @keyframes spin + <GigaEatScreen />
        ├── App.css                         # Не используется (артефакт Vite шаблона)
        ├── index.css                       # CSS переменные, reset, скрытие скроллбаров
        ├── contracts.ts                    # Все TypeScript интерфейсы (204 строки)
        ├── mocks.ts                        # Моковые данные для всех экранов (854 строки)
        ├── api/
        │   └── client.ts                   # Axios клиент + моковые endpoint'ы (171 строка)
        ├── components/
        │   ├── GigaEatScreen.tsx            # Главный дашборд (1503 строки)
        │   ├── PreferencesModal.tsx          # Анкета пользователя: интро + форма (572 строки)
        │   ├── RationPreviewModal.tsx        # Превью рациона с рекомендациями (602 строки)
        │   ├── GigaEatModal.tsx             # Выбор магазина/ресторана (1041 строка)
        │   ├── CartEditModal.tsx            # Редактирование корзины (396 строк)
        │   ├── OrderHistoryModal.tsx         # История заказов + календарь (615 строк)
        │   ├── SwipeCardDeck.tsx            # Tinder-стиль выбор (324 строки)
        │   └── TabBar.tsx                  # Нижняя навигация (229 строк)
        └── screens/
            └── FeedScreen.tsx              # Заглушка ленты (12 строк)
```

**Итого: ~5 793 строки исходного кода (TS/TSX/CSS).**

---

## 4. Дизайн-система

### 4.1 CSS-переменные (index.css)

```css
:root {
  --green: #21A038;           /* Основной зелёный (бренд Сбера) */
  --green-light: #E8F7EC;     /* Светло-зелёный фон */
  --green-mid: #4DBD67;       /* Средний зелёный */
  --bg: #F4F6F5;              /* Фон приложения */
  --surface: #FFFFFF;         /* Поверхность карточек */
  --text-primary: #0D0D0D;   /* Основной текст */
  --text-secondary: #7A8A85; /* Вторичный текст */
  --text-muted: #B0BDB8;     /* Приглушённый текст */
  --border: #E8EEEB;         /* Границы */
  --shadow: 0 2px 12px rgba(33, 160, 56, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
  --radius: 16px;
  --radius-sm: 10px;
  --radius-xs: 6px;
  --tab-height: 64px;
  --header-height: 56px;
}
```

### 4.2 Дополнительные цвета (в компонентах)

| Цвет | Hex | Назначение |
|---|---|---|
| Orange / Accent | `#E06030`, `#E8763A` | Калории, предупреждения, вторичные действия |
| Orange light bg | `#FDEEE6`, `#FFF5EE` | Фон бейджей с оранжевым текстом |
| Gold / Achievements | `#F5C842`, `#E8A020`, `#B07A10` | XP, уровни, достижения |
| Red / Danger | `#E05A2B` | Ошибки, не найденные товары, удаление |
| Blue / History | `#4A90D9`, `#89BFF5`, `#EEF6FF` | Кнопка истории заказов |
| Blue / Water | `#42AAEA`, `#1F89DC` | Виджет воды |
| Ice / Freeze | `#C8E8F5` | Заморозка стрика |
| Neutral warm | `#EDEAE4`, `#F7F5F1`, `#F0EDE8` | Карточки дашборда, фоны |
| Dark text | `#1A1A2E` | Заголовки, важные числа |

### 4.3 Типографика

- **Шрифт**: Manrope (Google Fonts)
- **Fallback**: `-apple-system, BlinkMacSystemFont, sans-serif`
- **Размеры**: 9–26px (мобильный контекст)
- **Вес**: 400 (обычный), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Letter-spacing**: `-0.01em` до `-0.03em` для заголовков

### 4.4 Компонентные паттерны

**Карточки:**
- `borderRadius: 18px` для основных, `14px` для вложенных, `12px` для мелких
- `background: #fff` с `boxShadow: 0 2px 12px rgba(0,0,0,0.06)` для заполненных
- `background: #F7F5F1` с `border: 1.5px dashed #D4D0C8` для пустых

**Модальные окна (Bottom Sheet):**
- `position: fixed; bottom: 0; borderRadius: 24px 24px 0 0`
- Handle bar сверху: `width: 36px, height: 4px, background: #E8EEEB`
- `maxWidth: 430px`, центрируется через `left: 50%; transform: translateX(-50%)`
- Overlay: `background: rgba(0,0,0,0.45); zIndex: 100`
- Sheet: `zIndex: 101`
- Вложенные модалы: `zIndex: 200/201`

**Кнопки:**
- Primary (зелёный): `background: linear-gradient(135deg, #1D9034, #2BBE4E)`, `boxShadow: 0 6px 20px rgba(33,160,56,0.30)`
- Secondary: `background: var(--bg)`, `border: 1.5px solid var(--border)`
- Круглая close: `width: 32px, borderRadius: 50%, background: #F0EDE8`
- Toggle active: `background: #fff, boxShadow: 0 1px 6px rgba(0,0,0,0.10)`

**Анимации:**
- `transition: all 0.15s` для кнопок
- `transition: transform 0.22s` для chevron
- `transition: all 0.2s` для toggle
- `transition: transform 0.3s ease, opacity 0.3s ease` для swipe-карт
- `@keyframes spin { to { transform: rotate(360deg) } }` для спиннера (0.7s linear infinite)

---

## 5. Архитектура приложения

### 5.1 Точка входа

```
main.tsx → App.tsx → GigaEatScreen.tsx
```

`App.tsx` — минимальная обёртка: глобальный `@keyframes spin` + рендер `GigaEatScreen`.

Роутинга нет. Навигация реализована через состояние `appState` и boolean-флаги для модалов.

### 5.2 Состояние главного экрана (GigaEatScreen)

```typescript
type AppState = "idle" | "prefs" | "loading" | "ration" | "stores" | "error";

// Состояния:
const [appState, setAppState] = useState<AppState>("idle");
const [stores, setStores] = useState<StoreResult[]>([]);
const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
const [plan, setPlan] = useState<MealPlan | null>(null);
const [showAch, setShowAch] = useState(false);      // Модал достижений
const [showCal, setShowCal] = useState(false);       // Модал календаря (стрик)
const [showHistory, setShowHistory] = useState(false); // Модал истории заказов
const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 21));
```

**Переходы appState:**
```
idle → (кнопка "Составить рацион") → prefs
prefs → (заполнение анкеты) → loading
loading → (ответ GigaChat OK) → ration
loading → (ошибка) → error
ration → (кнопка "Подобрать магазин") → stores
stores | ration | prefs | error → (закрытие модала) → idle
```

### 5.3 Данные по дням (Day Data)

Дашборд полностью реактивен к выбранной дате. Данные хранятся в словаре `DAYS_DATA`:

```typescript
interface MealEntry {
  name: string;
  kbju: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface DayMeal {
  icon: string;
  label: string;     // "Завтрак" | "Обед" | "Ужин" | "Перекус"
  time?: string;
  items: MealEntry[];
}

interface DayData {
  meals: DayMeal[];
  water: number;      // литры выпито
  waterGoal: number;
  activity: number;    // ккал сожжено
}
```

При переключении дня пересчитываются:
- Кольцо калорий (eatenKcal, kcalPct)
- Остаток КБЖУ (remainKcal, и передаваемые в RationPreviewModal)
- Прогресс-бары макросов (eatenProtein/eatenFat/eatenCarbs vs USER goals)
- Карточки приёмов пищи (заполненные + пустые слоты)
- Виджет воды (цифра + капли)
- Виджет активности (ккал + прогресс-бар)

**Данные есть для дат:** 21, 20, 19, 18, 17, 16 марта 2026. Для остальных дат — пустой день.

### 5.4 Пользователь (захардкожен)

```typescript
const USER = {
  name: "Никита",
  daily_kcal: 2200,
  protein: 60,        // г/день цель
  fat: 60,
  carbs: 300,
  lat: 55.741,        // Москва
  lon: 37.565,
};
```

---

## 6. Компоненты — детальное описание

### 6.1 GigaEatScreen.tsx (1503 строки)

**Главный экран-дашборд.** Содержит всю логику и вложенные компоненты.

**Секции сверху вниз:**

1. **Handle** — индикатор свайпа
2. **Header** — «Дашборд» + кнопка закрытия
3. **Date Nav** — `‹` / дата / `›`, клик по дате открывает CalendarModal. Кнопка `›` заблокирована на сегодня
4. **Calories Ring** — SVG-кольцо прогресса (strokeDasharray), eaten/remain/goal
5. **Macros Grid** (2 колонки) — Углеводы (оранжевый), Белки (зелёный), Жиры (золотой)
6. **Achievements Button** — gradient карточка, уровень/XP/стрик
7. **History Button** — голубая карточка «История заказов»
8. **Water + Activity** (2 колонки) — вода (голубой gradient) + активность (белая)
9. **Meals Section** — динамические MealCard'ы (заполненные + пустые слоты)
10. **GigaEat CTA** — зелёная кнопка «Составить рацион на день» с лоадером
11. **Modals** — PreferencesModal, RationPreviewModal, GigaEatModal, AchievementsModal, CalendarModal, OrderHistoryModal

**Вложенные компоненты (в том же файле):**

- `MealCard` — раскрываемая карточка приёма пищи (filled/unfilled, chevron анимация)
- `CalendarModal` — календарь стрика (done/frozen/empty/future/today), стата стрика, progress bar к достижению
- `AchievementsModal` — 4 категории (Питание, Стрики, Покупки, Цели), 3 состояния (done/progress/locked), XP, прогресс-бары
- `Spinner` — CSS-спиннер для загрузки

### 6.2 PreferencesModal.tsx (572 строки)

**Двухэкранный модал анкеты пользователя.**

**Экран 1 — Интро:**
- Эмодзи-иллюстрация: центральный 🍽️ в зелёном круге + 6 орбитальных эмодзи (🥗🥩🥛🍎🥚🥑)
- Заголовок «Персональный рацион от GigaChat»
- 3 фичи с иконками: ИИ, безопасность, точность КБЖУ
- CTA: «Заполнить анкету» (зелёный gradient) + «Пропустить» (text button)

**Экран 2 — Форма:**
- Back-кнопка → возврат к интро
- Progress bar (0/3 → 3/3)
- 3 блока-карточки с иконками:
  - 🛡️ Аллергии (Да → красный, Нет → зелёный)
  - ⚠️ Непереносимость (Да → оранжевый, Нет → зелёный)
  - 👎 Нелюбимые продукты (текстовое поле)
- Submit → вызывает `onConfirm(prefs)` → переход к загрузке рациона

### 6.3 RationPreviewModal.tsx (602 строки)

**Превью сгенерированного рациона с системой рекомендаций.**

**Система рекомендаций (Toggle):**
- 3 кнопки: 🏠 Классика / ✨ Что-то новое / 🎲 Микс
- Каждый вариант — отдельный `MealPlan` из моков
- Описание под toggle'ами

**КБЖУ баннер:** зелёный фон, 4 колонки (калории, белки, жиры, углеводы)

**Карточки блюд (редактируемые):**
- Клик → карточка подсвечивается зелёной рамкой, иконка ✎ → ▲
- Раскрывается горизонтальная лента альтернатив (4 варианта, scroll)
- Каждая альтернатива: название, ккал badge, макросы
- Клик по альтернативе → замена блюда, пересчёт итогов
- Кнопка «Убрать из рациона» (красный текст) — удаление блюда
- Badge «Рацион изменён вами» при любых изменениях

**Список продуктов:** автоматически обновляется при смене рекомендации

**Итого:** зелёная gradient-карточка с суммой ккал/Б/Ж/У

**Footer:** кнопка «Подобрать магазин» → переход к `appState: "stores"`

### 6.4 GigaEatModal.tsx (1041 строка)

**Выбор магазина или ресторана.**

**Header:** Close + Toggle (Заказать / Перекусить) + DeckIcon

**Tab «Заказать» (OrderList):**
- Список магазинов (Пятёрочка, Перекрёсток, ВкусВилл, Магнит)
- Каждый: имя, доставка (~мин), расстояние, ссылка «пешком →», цена
- Раскрытие: горизонтальная полоса товаров с эмодзи, КБЖУ, ценой
- Кнопка «Выбрать магазин» → открывает CartEditModal с моковой корзиной
- Ссылка «пешком» → WalkModal

**Tab «Перекусить» (SnackList):**
- Список ресторанов (Теремок, Dodo Пицца, Якитория, Prime Beef)
- Каждый: имя, расстояние, 🔥 калории пешком
- Раскрытие: блюда с КБЖУ и ценами
- Кнопка «Построить маршрут»

**WalkModal:**
- Адрес, расстояние, время пешком, калории сожжёшь
- SVG-карта: нарисованные дороги, дом 🏠 → магазин 🏪 пунктиром
- Кнопки: «🚶 Пойду пешком» / «🚗 Закажу доставку»
- Celebration screen: 🎉 статы ходьбы, мотивационный текст

**SwipeCardDeck** — вызывается из deckBtn:
- Tinder-стиль: главная карта + 2 тени за ней
- Left swipe / Right swipe с rotation-анимацией
- Карточки магазинов: эмодзи, название, расстояние, цена, доставка, топ-3 товара
- Карточки ресторанов: название, расстояние, ккал пешком, всё меню
- Done-экран с «Начать заново»
- Кнопки Skip (красный X) и Like (зелёная галочка) + счётчик

### 6.5 CartEditModal.tsx (396 строк)

**Редактирование корзины перед оформлением.**

**Summary баннер:** зелёный фон, найдено товаров / итого ₽ / не найдено

**Список товаров:**
- Найденные: название ингредиента, название товара Купера, цена, кнопки +/−
- Не найденные: оранжевая рамка dashed, подпись «Не найдено в магазине»
- Удалённые: зачёркнутый текст + кнопка «Вернуть»
- Кнопка × для удаления каждого товара

**Количество:** кнопки − / число / + в rounded контейнере. Пересчёт цены (price × qty)

**Footer:** Итого ₽ + кнопка «Оформить в Купере» (gradient зелёный, boxShadow). Открывает checkout_url в новой вкладке.

Badge «Корзина изменена» при любых изменениях.

### 6.6 OrderHistoryModal.tsx (615 строк)

**История заказов с интерактивным календарём.**

**Загрузка:** spinner + текст «Загрузка истории...», данные из `getOrderHistory(userId)`

**Календарь:**
- Навигация по месяцам (‹ Март 2026 ›)
- Сетка 7×6: Пн–Вс, дни с зелёным фоном = есть заказ
- Зелёная точка-индикатор под датой
- Клик по дате → выбор (зелёный круг с тенью), повторный клик → сброс
- Сегодня: outline `2px solid #E06030`
- Будущие даты: серый цвет, не кликабельны
- Легенда: зелёный = заказ, жёлтый = составлено, серый = нет данных

**Детали дня (при выбранной дате):**
- Пустой день: 🍽️ + «В этот день заказов не было»
- Карточка заказа: общий ккал, статус-бейдж (🛒 Заказано / 📝 Составлено)
- Список блюд: иконка приёма + тип + название + ккал
- Магазин: 🏪 название + цена (зелёный фон)

**Последние заказы (без выбранной даты):**
- Список из 7 последних заказов
- Дата + эмодзи приёмов пищи + ккал + статус
- Клик → выбирает дату + переключает календарь на нужный месяц

**Статистика за месяц:** зелёная gradient-карточка, 3 колонки: рационов / ккал/день / заказов

### 6.7 TabBar.tsx (229 строк)

**Нижняя навигация с 5 табами.**

| Tab | Label | Иконка |
|---|---|---|
| profile | Профиль | SVG: голова + плечи |
| diary | Дневник | SVG: блокнот с линиями |
| gigaeat | GigaEat | SVG: лампочка (центральный FAB) |
| progress | Прогресс | SVG: график тренда |
| feed | Лента | SVG: 4 квадрата (grid) |

- GigaEat-таб: зелёный круг 48px, `boxShadow: 0 4px 16px rgba(33,160,56,0.40)`, белая иконка
- Остальные: иконка + подпись 10px, active = `--green`, inactive = `--text-muted`
- `position: fixed; bottom: 0`, `paddingBottom: env(safe-area-inset-bottom)`

### 6.8 FeedScreen.tsx (12 строк)

Заглушка: `<h2>Лента</h2>` + текст «Здесь будут посты пользователей».

---

## 7. Типы данных (contracts.ts)

### 7.1 Meal Plan

```typescript
interface MealItem {
  day: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  dish: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface ShoppingItem {
  product: string;
  qty: number;
  unit: string;       // "г" | "шт" | "мл"
}

interface MealPlan {
  meals: MealItem[];
  shopping_list: ShoppingItem[];
}
```

### 7.2 User Preferences

```typescript
interface UserPreferences {
  allergies: string;     // '' если нет
  intolerances: string;  // '' если нет
  disliked: string;      // '' если нет
}
```

### 7.3 Stores & Products

```typescript
interface Product {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  weight_g: number;
  price_rub: number;
}

interface StoreResult {
  store_id: string;
  name: string;
  distance_m: number;
  total_price: number;
  delivery_min: number;
  available: Product[];
  missing: string[];
}
```

### 7.4 Restaurants

```typescript
interface Dish {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  price_rub: number;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance_m: number;
  walk_kcal: number;
  dishes: Dish[];
}
```

### 7.5 Order History

```typescript
interface OrderHistoryItem {
  ration_id: string;
  date: string;                        // "2026-03-21"
  total_kcal: number;
  status: "generated" | "ordered";
  meals: { meal_type: string; name: string; kcal: number }[];
  store_name?: string;
  total_price_rub?: number;
}
```

### 7.6 Cart

```typescript
interface CartItem {
  ingredient_name: string;
  product_name: string | null;         // null = не найдено
  price_rub: number;
  found: boolean;
  quantity?: number;
}

interface CartData {
  cart_id: string;
  total_price_rub: number;
  found_count: number;
  total_count: number;
  checkout_url: string;
  items: CartItem[];
}
```

### 7.7 Backend-aligned Types (из CONTEXT.md)

```typescript
interface RationRequest {
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

interface RationResponse {
  ration_id: string;
  profile_incomplete: boolean;
  missing_fields: string[];
  meals: { id: string; meal_type: string; name: string; kcal: number }[];
  ingredients: { id: string; name: string; quantity: string; unit: string }[];
  stores_delivery: StoreDelivery[];
  stores_walk: StoreWalk[];
}

interface StoreDelivery {
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

interface StoreWalk {
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
```

### 7.8 Feed

```typescript
type PostType = "dish" | "recipe" | "achievement";

interface FeedPost {
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
```

### 7.9 Legacy API Types

```typescript
interface PlanRequest {
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

interface CartRequest {
  store_id: string;
  items: ShoppingItem[];
}

interface CartResponse {
  cart_url: string;
}
```

---

## 8. API-клиент (api/client.ts)

### 8.1 Конфигурация

```typescript
const USE_MOCK = true;    // Переключатель мок/реальный бэкенд
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const http = axios.create({ baseURL: BASE_URL, timeout: 10_000 });
```

### 8.2 Endpoints

| Функция | Mock delay | Backend endpoint | Описание |
|---|---|---|---|
| `getPlan(req)` | 1800ms | `POST /gigaeat/plan` | Legacy: генерация рациона + магазины + рестораны |
| `createCart(req)` | 600ms | `POST /gigaeat/cart` | Legacy: создание корзины |
| `generateRation(req)` | 1800ms | `POST /api/v1/ration` | Генерация рациона через GigaChat |
| `createRationCart(rationId, storeId)` | 600ms | `POST /api/v1/ration/:id/cart` | Формирование корзины для магазина |
| `getOrderHistory(userId)` | 400ms | `GET /api/v1/ration/history?user_id=` | История рационов |
| `getRation(rationId)` | 300ms | `GET /api/v1/ration/:id` | Получение рациона по ID |
| `getFeed(type?)` | 400ms | `GET /feed` | Лента постов |
| `likePost(id)` | 150ms | `POST /feed/:id/like` | Лайк поста |

### 8.3 Mock-режим

Когда `USE_MOCK = true`, все функции возвращают данные из `mocks.ts` с искусственной задержкой (имитация сетевого латенси). Для переключения на реальный бэкенд достаточно выставить `USE_MOCK = false`.

---

## 9. Моковые данные (mocks.ts)

### 9.1 Магазины (MOCK_STORES) — 4 шт

| ID | Название | Расстояние | Цена | Доставка | Товаров | Нет в наличии |
|---|---|---|---|---|---|---|
| s1 | Пятёрочка | 280м | 1 240₽ | 30 мин | 7 | — |
| s2 | Перекрёсток | 650м | 1 410₽ | 45 мин | 6 | Творог 5% |
| s3 | ВкусВилл | 920м | 1 680₽ | 55 мин | 7 | — |
| s4 | Магнит | 1 100м | 1 180₽ | 60 мин | 6 | Творог 5%, Овсяные хлопья |

### 9.2 Рестораны (MOCK_RESTAURANTS) — 4 шт

| ID | Название | Расстояние | Ккал пешком | Блюд |
|---|---|---|---|---|
| r1 | Теремок | 320м | 22 | 7 |
| r2 | Dodo Пицца | 480м | 34 | 6 |
| r3 | Якитория | 600м | 42 | 7 |
| r4 | Prime Beef | 850м | 60 | 6 |

### 9.3 Рационы — 3 варианта

| Вариант | Ккал | Блюда |
|---|---|---|
| MOCK_MEAL_PLAN (Классика) | ~1320 | Овсянка, Грудка с гречкой, Йогурт, Лосось с овощами |
| MOCK_MEAL_PLAN_NEW (Новое) | ~1290 | Смузи-боул, Поке с тунцом, Хумус, Том Ям с креветками |
| MOCK_MEAL_PLAN_MIX (Микс) | ~1320 | Сырники, Боул с киноа, Творог с мёдом, Индейка с овощами |

### 9.4 Альтернативы (MOCK_ALTERNATIVES) — по 5 вариантов на каждый приём

- **breakfast:** Овсянка / Сырники / Смузи-боул / Омлет с овощами / Тосты с авокадо
- **lunch:** Грудка с гречкой / Поке / Боул с киноа / Паста с песто / Борщ
- **snack:** Йогурт / Хумус / Творог с мёдом / Протеиновый батончик / Фруктовый салат
- **dinner:** Лосось / Том Ям / Индейка / Стейк с салатом / Куриный суп

### 9.5 История заказов (MOCK_ORDER_HISTORY) — 11 записей

Даты: 10–21 марта 2026. Статусы: 8 ordered, 3 generated.

### 9.6 Корзина (MOCK_CART) — 7 товаров

6 найдено (Куриная грудка, Йогурт, Овсянка, Творог, Лосось, Брокколи) + 1 не найдено (Петрушка).

---

## 10. Согласование с бэкендом

### 10.1 Маппинг Frontend ↔ Backend

| Frontend функция | Backend endpoint | Статус |
|---|---|---|
| `getPlan()` | Нет прямого аналога | Используется в mock-режиме, объединяет ration + stores |
| `generateRation()` | `POST /api/v1/ration` | Готово (mock) |
| `createRationCart()` | `POST /api/v1/ration/:id/cart` | Готово (mock) |
| `getOrderHistory()` | `GET /api/v1/ration/history` | Готово (mock) |
| `getRation()` | `GET /api/v1/ration/:id` | Готово (mock) |

### 10.2 Тестовый пользователь

```
user_id: 550e8400-e29b-41d4-a716-446655440000
```

Используется в OrderHistoryModal при запросе истории.

### 10.3 Переключение на реальный бэкенд

1. В `api/client.ts` поставить `USE_MOCK = false`
2. Задать `VITE_API_URL` в `.env` (или по умолчанию `http://localhost:8080`)
3. Убедиться что бэкенд запущен (`docker-compose up` в Backend/)

---

## 11. Gamification-система

### 11.1 Уровни и XP

```typescript
const LEVELS = [0, 50, 150, 350, 600, 1000, 1500, 2500];
const LEVEL_NAMES = [
  "", "Новичок", "Осознанный", "Практикующий",
  "Дисциплинированный", "Опытный", "Мастер ЗОЖ", "Гуру здоровья", "Легенда",
];
```

Текущий пользователь: **Уровень 2 «Осознанный»**, 85/150 XP.

### 11.2 Достижения (4 категории)

**🥗 Питание:**
- ✅ Первый шаг (+10 XP)
- ✅ Неделя осознанности (+25 XP)
- 🔄 Месяц дисциплины (11/30, +100 XP)
- 🔒 Мастер питания (100 рационов, +500 XP)

**🔥 Стрики:**
- ✅ Разгон — 3 дня (+15 XP)
- 🔄 Неделя силы (3/7, +50 XP)
- 🔒 Железная воля — 30 дней (+300 XP)

**🛒 Покупки:**
- ✅ Шопоголик ЗОЖ — первая корзина (+15 XP)
- 🔄 Постоянный покупатель (2/5, +50 XP)

**🎯 Цели:**
- ✅ Цель поставлена (+5 XP)
- 🔒 Первый результат — изменение веса (+100 XP)

### 11.3 Стрик-система

- Текущий стрик: 3 дня
- Лучший стрик: 14 дней
- Заморозок: 1
- Цель: «Неделя силы» (3/7 дней)

---

## 12. Известные ограничения и TODO

### 12.1 Что НЕ реализовано

- [ ] Роутинг (SPA без react-router)
- [ ] Аутентификация / авторизация
- [ ] Реальная интеграция с бэкендом (все данные mock)
- [ ] Профиль пользователя (экран)
- [ ] Дневник питания (экран)
- [ ] Прогресс / аналитика (экран)
- [ ] Лента постов (экран, только заглушка)
- [ ] TabBar навигация между экранами (компонент есть, но не подключён)
- [ ] Drag-to-dismiss для bottom sheets
- [ ] Push-уведомления
- [ ] PWA manifest / service worker
- [ ] Offline mode
- [ ] Анимации входа/выхода модалов (появляются мгновенно)
- [ ] Реальное сохранение данных воды и активности
- [ ] Реальный пересчёт XP и достижений
- [ ] Фото блюд

### 12.2 Что работает полностью (mock)

- [x] Дашборд с КБЖУ, кольцом калорий, макросами
- [x] Листание по дням с пересчётом всех виджетов
- [x] Анкета предпочтений (интро + форма с прогрессом)
- [x] Генерация рациона с 3 вариантами рекомендаций
- [x] Редактирование рациона (замена/удаление блюд)
- [x] Выбор магазина/ресторана (список + Tinder-стиль)
- [x] Расчёт калорий ходьбы + SVG карта
- [x] Редактирование корзины (+/−, удаление, восстановление)
- [x] Оформление заказа (ссылка на Купер)
- [x] История заказов с интерактивным календарём
- [x] Календарь стрика
- [x] Система достижений
- [x] Swipe-карточки для выбора магазинов/ресторанов

---

## 13. Быстрый старт

```bash
cd Frontend/GigaEat
npm install
npm run dev        # http://localhost:5173
```

### Сборка

```bash
npm run build      # → dist/
npm run preview    # Preview production build
```

### Lint

```bash
npm run lint
```

### Переменные окружения

```env
VITE_API_URL=http://localhost:8080   # URL бэкенда (опционально)
```

---

## 14. Команда

| Участник | Зона |
|---|---|
| Никита | Весь Frontend (GigaEat React app) |

---

*Последнее обновление: 21.03.2026*
