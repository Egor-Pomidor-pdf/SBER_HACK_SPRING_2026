# CONTEXT — hudeem-backend

> Этот файл содержит все принятые решения по проекту. Читай перед началом работы.

---

## Что делает фича «Что поесть» (v2)

**Основная цель:** Пользователь нажимает кнопку в приложении «Худеем на здоровье».
**Процесс:**
1. Система берёт остаток КБЖУ пользователя на сегодня, включая **уже съеденные блюда**
2. Генерирует рацион (завтрак/обед/ужин + список ингредиентов) через GigaChat
3. Находит 5 ближайших магазинов Купера
4. **Для каждого магазина** ищет каждый ингредиент
5. **Два типа магазинов:** Доставка и Пешком
6. Показывает пользователю списки с сортировкой (match_percent, delivery_time/distance)
7. Пользователь выбирает магазин
8. Формируется корзина
9. **КБЖУ рациона списываются из профиля** после создания корзины
10. Редирект в Купер для оплаты

**Key innovations:**
- Consumed meals tracking — GigaChat знает что пользователь уже съел
- Flexible meal count — может предложить 1, 2 или 3 блюда
- Dual store types — Delivery vs Walk with different sorting
- Strict allergy handling — allergens explicitly forbidden in prompt
- Profile completeness check — detects missing fields (allergies, preferences, dietary_restrictions)

---

## Стек

| Компонент | Решение |
|---|---|
| Язык | Go 1.25 |
| HTTP фреймворк | gin |
| БД | PostgreSQL 15 |
| Драйвер БД | pgx v5 |
| Доп. драйвер БД | mattn/go-sqlite3 v1.14.22 (для Mock Купера) |
| Миграции | docker-entrypoint-initdb.d (алфавитный порядок) |
| LLM | GigaChat API (реальный) |
| Доставка | Купер API (mock с SQLite) |
| Логирование | стандартный `log` пакет |

---

## Что мокаем, что реальное

| | Статус | Детали |
|---|---|---|
| GigaChat API | **РЕАЛЬНЫЙ** | Есть доступ. POST /v1/chat/completions |
| Купер /stores/nearby | **МОК** | Нет доступа. Хардкод 5 магазинов Москвы |
| Купер /search | **МОК** | SQLite база, поиск по названию, возвращает 1 результат |
| Купер /cart | **МОК** | Возвращает тестовый checkout_url |
| PostgreSQL | **РЕАЛЬНЫЙ** | Полноценная БД |
| Профиль пользователя | **SEED** | Хардкод тестового пользователя для демо |
| Mock Купера | **SQLite** | Использует SQLite вместо PostgreSQL placeholders |

Mock Купера — отдельный Go HTTP-сервер, запускается из `cmd/mock-kuper/main.go` на порту 8081. Использует **SQLite** для данных. Основной сервис обращается к нему через `KUPER_BASE_URL` из конфига.

---

## Пайплайн данных (GigaEat v2)

```
1. POST /api/v1/ration  {user_id, lat, lng, consumed_meals[]}
        ↓
2. [параллельно]
   a. READ user_profiles → остаток КБЖУ, цель, ограничения, вес
   b. CHECK profile completeness (allergies, preferences, dietary_restrictions)
   c. GET Купер /stores/nearby → 5 ближайших магазинов
        ↓
3. PromptBuilder собирает system + user промпт с:
   - Ужасно съеденными блюдами из consumed_meals
   - Оставшимся КБЖУ
   - Строгой обработкой аллергий
        ↓
4. POST GigaChat API → JSON: {meals[], shopping_list[]}
   Теперь meals включают: protein_g, fat_g, carbs_g
        ↓
5. Convert ShoppingList → RationIngredient
        ↓
6. [параллельно] GET Купер /search для каждого ингредиента × каждого магазина
        ↓
7. Сортировка магазинов:
   - Delivery: match_percent DESC, delivery_time_mins ASC
   - Walk: match_percent DESC, distance_m ASC
        ↓
8. INSERT daily_rations, ration_meals, ration_ingredients, kuper_stores
   Meals сохраняются с protein_g, fat_g, carbs_g
        ↓
9. Ответ фронту:
   - profile_incomplete: bool
   - missing_fields: []string
   - meals с макросами
   - ingredients
   - stores_delivery
   - stores_walk
        ↓
10. POST /api/v1/ration/:id/cart  {store_id}
        ↓
11. [параллельно, семафор 10]
    - GET Купер /search × N ингредиентов
    - POST Купер /cart с найденными товарами
        ↓
12. INSERT kuper_carts, kuper_cart_items
    Суммируем КБЖУ всех блюд рациона
        ↓
13. DeductKBZHU(userID, totalKcal, totalProtein, totalFat, totalCarbs)
    Запись в БД: remaining_kcal, remaining_protein_g, remaining_fat_g, remaining_carbs_g
        ↓
14. UPDATE daily_rations SET status='consumed'
        ↓
15. Ответ фронту: товары с ценами + checkout_url
```

---

## Схема БД (обновлена)

### user_profiles
Профиль питания пользователя. Одна строка на пользователя.
```sql
id                  uuid PK
user_id             uuid UNIQUE  -- ID из системы Сбера, без FK constraint
daily_kcal          int          -- суточная норма
remaining_kcal      int          -- остаток на сегодня → в промпт GigaChat
remaining_protein_g int
remaining_fat_g     int
remaining_carbs_g   int
goal                varchar      -- ENUM: lose / maintain / gain
dietary_restrictions text        -- "без глютена, аллергия на орехи" → в промпт
allergies           text[]       -- массив аллергенов для строгой обработки
preferences         text[]       -- массив предпочтений
lat                 float
lng                 float
weight_kg           float        -- для расчёта калорий при ходьбе
updated_at          timestamp
```

### daily_rations
Одна строка на каждое нажатие «Что поесть» или «Обновить».
```sql
id              uuid PK
user_id         uuid             -- → user_profiles.user_id
ration_date     date             -- INDEX: (user_id, ration_date DESC)
total_kcal      int
status          varchar          -- ENUM: generated / consumed (было 'ordered')
gigachat_raw    jsonb            -- полный ответ GigaChat, для дебага
created_at      timestamp
```

### ration_meals
Приёмы пищи внутри рациона. 1-3 строки на рацион (гибкий счёт).
```sql
id          uuid PK
ration_id   uuid FK → daily_rations.id
meal_type   varchar   -- ENUM: breakfast / lunch / dinner / snack
name        varchar   -- "Овсянка с бананом"
kcal        int
protein_g   int       -- НОВОЕ: белки в граммах
fat_g       int       -- НОВОЕ: жиры в граммах
carbs_g     int       -- НОВОЕ: углеводы в граммах
sort_order  int
```

### ration_ingredients
Список продуктов для покупки. 10–15 строк на рацион.
```sql
id          uuid PK
ration_id   uuid FK → daily_rations.id
name        varchar   -- "куриное филе" → идёт в поиск Купера
quantity    varchar   -- "500"
unit        varchar   -- "г" / "шт" / "мл"
sort_order  int
```

### kuper_stores
5 ближайших магазинов. Заполняется при генерации рациона.
```sql
id          uuid PK
ration_id   uuid FK → daily_rations.id
store_id    varchar   -- ID магазина в системе Купера
store_name  varchar   -- "Купер на Тверской"
distance_m  int
store_address TEXT     -- НОВОЕ: адрес магазина
delivery_time_mins INT  -- НОВОЕ: время доставки
```

### kuper_carts
Итоговая корзина. 0 или 1 строка на рацион. Создаётся после выбора магазина.
```sql
id              uuid PK
ration_id       uuid FK → daily_rations.id
store_id        uuid FK → kuper_stores.id
total_price_rub int
found_count     int    -- сколько товаров нашли
total_count     int    -- сколько всего искали
checkout_url    varchar -- ссылка для редиректа в Купер
created_at      timestamp
```

### kuper_cart_items
Товары корзины. 1 строка на каждый ингредиент.
```sql
id                  uuid PK
cart_id             uuid FK → kuper_carts.id
ingredient_id       uuid FK → ration_ingredients.id
kuper_product_id    varchar   -- null если не нашли
kuper_product_name  varchar   -- "Гречка Мистраль 800г"
price_rub           int
found               bool      -- false = не найдено в этом магазине
```

### user_meal_consumptions
История потребления блюд (добавлена в миграции).
```sql
id         uuid PK
user_id    uuid NOT NULL
meal_type  varchar
meal_name  varchar
meal_kcal  int
consumed_at timestamp
created_at timestamp
```

### ready_meals
Готовые блюда для каждого рациона (добавлены для будущего).
```sql
id             uuid PK
ration_id      uuid FK → daily_rations.id
meal_type      varchar
giga_chat_name varchar
kcal           int
total_price_rub int
store_id       varchar
store_name     varchar
store_address  text
distance_m     int
delivery_time_mins int
created_at     timestamp
```

---

## API эндпоинты (v2)

| Метод | Путь | Описание |
|---|---|---|
| POST | /api/v1/ration | Генерация рациона + список магазинов |
| GET | /api/v1/ration/:id | Получить рацион по ID |
| GET | /api/v1/ration/history | История рационов пользователя |
| POST | /api/v1/ration/:id/cart | Выбрать магазин, сформировать корзину |
| GET | /api/v1/profile | Получить профиль пользователя |
| PUT | /api/v1/profile | Обновить профиль и КБЖУ |

### POST /api/v1/ration — request (v2)
```json
{
  "user_id": "uuid",
  "lat": 55.7512,
  "lng": 37.6184,
  "consumed_meals": [
    {
      "meal_type": "breakfast",
      "name": "Овсянка с бананом",
      "kcal_eaten": 380,
      "protein_g": 12,
      "fat_g": 8,
      "carbs_g": 65
    }
  ]
}
```

### POST /api/v1/ration — response 200 (v2)
```json
{
  "ration_id": "uuid",
  "profile_incomplete": true,
  "missing_fields": ["allergies", "preferences"],
  "meals": [
    {
      "id": "uuid",
      "ration_id": "uuid",
      "meal_type": "lunch",
      "name": "Гречка с курицей",
      "kcal": 520,
      "protein_g": 35,
      "fat_g": 12,
      "carbs_g": 58,
      "sort_order": 0
    }
  ],
  "ingredients": [
    {
      "id": "uuid",
      "ration_id": "uuid",
      "name": "мясо",
      "quantity": "200",
      "unit": "г",
      "sort_order": 0
    }
  ],
  "stores_delivery": [
    {
      "id": "uuid",
      "store_id": "S1",
      "store_name": "Купер Тверская",
      "address": "ул. Тверская, 15",
      "distance_m": 320,
      "delivery_time_mins": 25,
      "total_price_rub": 450,
      "found_count": 5,
      "total_count": 5,
      "match_percent": 100
    }
  ],
  "stores_walk": [
    {
      "id": "uuid",
      "store_id": "S1",
      "store_name": "Купер Тверская",
      "address": "ул. Тверская, 15",
      "distance_m": 320,
      "walking_time_mins": 43,
      "calories_burned": 196,
      "total_price_rub": 450,
      "found_count": 5,
      "total_count": 5,
      "match_percent": 100
    }
  ]
}
```

### POST /api/v1/ration/:id/cart — request
```json
{ "store_id": "uuid" }
```

### POST /api/v1/ration/:id/cart — response 200 (v2)
```json
{
  "cart_id": "uuid",
  "total_price_rub": 1840,
  "found_count": 8,
  "total_count": 10,
  "checkout_url": "https://kuper.ru/checkout?cart_id=abc123",
  "items": [
    { "ingredient_name": "овсянка",  "product_name": "Геркулес Увелка 500г", "price_rub": 89,  "found": true  },
    { "ingredient_name": "петрушка", "product_name": null,                   "price_rub": 0,   "found": false }
  ]
}
```

### GET /api/v1/profile — response
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "daily_kcal": 2200,
  "remaining_kcal": 1200,
  "remaining_protein_g": 60,
  "remaining_fat_g": 60,
  "remaining_carbs_g": 300,
  "goal": "lose",
  "dietary_restrictions": "без глютена",
  "allergies": ["орехи", "молоко"],
  "preferences": ["больше белка"],
  "lat": 55.7512,
  "lng": 37.6184,
  "weight_kg": 70.0,
  "updated_at": "2026-03-21T12:00:00Z"
}
```

---

## Промпт GigaChat (v2)

### System prompt (актуальный)
```
Ты — персональный нутрициолог AI.
Цель пользователя: {goal} (lose=похудеть, maintain=держать, gain=набрать).
Диетические ограничения: {dietary_restrictions}.
ЖЁСТКО ЗАПРЕЩЁННЫЕ ингредиенты, не использовать ни в каком виде: {allergies}
Предпочтения: {preferences}

📋 ПРАВИЛА:
1. Рацион должен укладываться в ОСТАТКИ КБЖУ:
   - Калории: {remaining_kcal} ккал
   - Белки: {remaining_protein_g} г
   - Жиры: {remaining_fat_g} г
   - Углеводы: {remaining_carbs_g} г

2. Не повторяй уже съеденные блюда из списка потребления.

3. Если пользователь уже съел завтрак и обед — предложи только ужин и, возможно, перекус.

4. Для каждого блюда укажи:
   - Название блюда
   - Калорийность
   - Белки в граммах
   - Жиры в граммах
   - Углеводы в граммах
   - Список продуктов с дозировками (format: "мясо (500 г)").

5. Продукты должны быть обычными продуктами из магазина.

6. Только валидный JSON.

📊 ФОРМАТ ОТВЕТА (строго совпадать с model.MealPlan):
{
  "meals": [
    {
      "meal_type": "lunch",
      "name": "Название блюда",
      "kcal": 300,
      "protein_g": 30,
      "fat_g": 10,
      "carbs_g": 40
    }
  ],
  "shopping_list": [
    {
      "name": "продукт",
      "quantity": "100",
      "unit": "г"
    }
  ]
}
```

### User prompt
```
Уже съедено сегодня:
- breakfast: Овсянка с бананом, 380 ккал (12 белка, 10 жира, 65 углевод)

Остаток КБЖУ на сегодня:
- Калории: 1200 ккал
- Белки: 60 г
- Жиры: 60 г
- Углеводы: 300 г

Составь рацион на оставшуюся часть дня.
```

### Обработка ошибок GigaChat
- Если ответ не JSON → 1 автоматический retry
- Если снова не JSON → вернуть 503, не пытаться парсить текст
- Всегда сохранять `gigachat_raw` в БД до парсинга
- **Логирование**: добавлено логирование raw response в `internal/service/gigachat/service.go:32`

---

## Архитектура слоёв

```
Handler       HTTP только: принять запрос, отдать ответ
    ↓
Orchestrator  Знает весь пайплайн, вызывает сервисы в нужном порядке
    ↓
Service       Один сервис — одна задача (GigaChat / Kuper / Profile)
    ↓
Client        HTTP клиент внешнего API (GigaChat, Купер)
Repository    SQL запросы к PostgreSQL
```

Каждый слой зависит только от **интерфейса** слоя ниже, не от конкретной реализации.

---

## Файловая структура (v2)

```
hudeem-backend/
├── cmd/
│   ├── api/main.go                          # точка входа основного сервера
│   └── mock-kuper/main.go                   # точка входа mock Купера (порт 8081)
├── internal/
│   ├── config/config.go                     # загрузка .env
│   ├── logger/logger.go                     # инициализация логгера
│   ├── middleware/
│   │   ├── auth.go
│   │   └── logger.go
│   ├── handler/
│   │   ├── router.go                        # регистрация роутов gin
│   │   ├── ration.go                        # POST /ration, GET /ration/:id, cart
│   │   └── profile.go                       # GET|PUT /profile
│   ├── orchestrator/
│   │   └── ration.go                        # главный пайплайн v2
│   ├── service/
│   │   ├── gigachat/{interface.go,service.go}
│   │   ├── kuper/{interface.go,service.go}
│   │   └── profile/{interface.go,service.go}
│   ├── prompt/builder.go                    # сборка промпта v2
│   ├── client/
│   │   ├── gigachat/{interface.go,client.go}
│   │   └── kuper/{interface.go,client.go}
│   ├── repository/
│   │   ├── ration/{interface.go,repository.go}
│   │   ├── profile/{interface.go,repository.go}
│   │   └── kuper/{interface.go,repository.go}
│   ├── model/
│   │   ├── ration.go                        # DailyRation, RationMeal (с макросами), RationIngredient
│   │   ├── profile.go                       # UserProfile (с weight_kg)
│   │   ├── kuper.go                         # KuperStore (с address/delivery_time), KuperCart, KuperCartItem
│   │   ├── gigachat.go                      # GigaChatRequest/Response, MealPlan (с макросами)
│   │   ├── ready_meal.go                    # ReadyMeal, ReadyMealIngredient
│   │   ├── meal_consumption.go              # UserMealConsumption
│   │   └── gigaeat_response.go              # GigaeatReadyResponse, GigaeatCartResponse
│   ├── calc/
│   │   └── walk.go                          # WalkingCaloriesAndTime
│   └── mock/kuper/
│       ├── handler.go                       # /stores/nearby, /search (возвращает 1), /cart
│       └── data.go                          # SQLite база, 30+ продуктов с КБЖУ
├── migrations/
│   ├── init/
│   │   ├── 000001_create_user_profiles.up.sql
│   │   ├── 000002_create_daily_rations.up.sql
│   │   ├── 000003_create_ration_meals.up.sql (с protein_g, fat_g, carbs_g)
│   │   ├── 000004_create_ration_ingredients.up.sql
│   │   ├── 000005_create_kuper_stores.up.sql (с address/delivery_time_mins)
│   │   ├── 000006_create_kuper_carts.up.sql
│   │   ├── 000007_create_kuper_cart_items.up.sql
│   │   ├── 000008_update_for_gigaeat_v2.up.sql
│   │   ├── 000009_add_gigaeat_tables.up.sql
│   │   └── 000010_add_macros_to_ration_meals.up.sql
│   ├── 000001_create_user_profiles.down.sql
│   ├── 000002_create_daily_rations.down.sql
│   ├── 000003_create_ration_meals.down.sql
│   ├── 000004_create_ration_ingredients.down.sql
│   ├── 000005_create_kuper_stores.down.sql
│   ├── 000006_create_kuper_carts.down.sql
│   ├── 000007_create_kuper_cart_items.down.sql
│   ├── 000008_update_for_gigaeat_v2.down.sql
│   ├── 000009_add_gigaeat_tables.down.sql
│   └── 000010_add_macros_to_ration_meals.down.sql
└── pkg/apperr/errors.go
```

---

## Конфигурация

### .env файл
```
GIGACHAT_TOKEN=<токен от GigaChat>
GIGACHAT_URL=https://gigachat.devices.sberbank.ru/api/v1
DSN=postgres://postgres:postgres@localhost:5432/hudeem?sslmode=disable
KUPER_BASE_URL=http://mock-kuper:8081
PORT=8080
```

### Docker Compose
- **postgres**: PostgreSQL 15, порт 5432, volume: `./migrations/init:/docker-entrypoint-initdb.d`
- **api**: основной сервис, порт 8080, environment:
  - DSN
  - KUPER_BASE_URL
  - GIGACHAT_TOKEN (обязательный)
  - GIGACHAT_URL (опционально, дефолт: https://gigachat.devices.sberbank.ru/api/v1)
- **mock-kuper**: mock сервер Купера, порт 8081, использует SQLite

Миграции применяются автоматически при старте контейнера postgres (алфавитный порядок из init directory).

---

## Команда (фактическое распределение)

| Участник | Зона |
|---|---|
| Егор | Backend Lead: Handler, Orchestrator, DI, code review |
| Николай | Repository, миграции, Docker, деплой, GigaEat v2 архитектура |
| Илья А. | GigaChatService, GigaChatClient, PromptBuilder v2 |
| Илья С. | KuperService v2, KuperClient, Mock Купера (SQLite) |
| Никита | Фронт |
| Леонид | (новый участник) - Data layer (модели, миграции, репозитории, profile service) |

---

## Критические решения (не менять)

1. **Купер всегда через интерфейс** — реализация меняется URL в конфиге, не код
2. **gigachat_raw сохранять всегда** — до парсинга, на случай ошибки
3. **Шаги 2a + 2b + 2c параллельно** — errgroup.WithContext
4. **Поиск ингредиентов параллельно** — errgroup + семафор на 10 горутин
5. **Запись в БД после ответа пользователю** — не блокирует latency (было async, теперь sync для KBZHU deduction)
6. **found=false вместо удаления** — показываем «не найдено» в UI
7. **user_id без FK constraint** — не создаём зависимость от схемы Сбера
8. **Логирование GigaChat response** — добавлено в service.go для дебага
9. **System prompt улучшен** — добавлен строгий формат с примером JSON
10. **KBZHU deduction sync** — после создания корзины списываем КБЖУ (не асинхронно)
11. **Статус "consumed" вместо "ordered"** — более правильное название
12. **Два типа магазинов** — Delivery vs Walk с разными сортировками
13. **Profile completeness check** — обнаруживаем недостающие поля
14. **Walking calories calculation** — MET=3.5, speed=4.5 km/h
15. **Mock Купера использует SQLite** — placeholders → ?
16. **Search возвращает 1 результат** — клиент ожидает объект, не массив

---

## Статус GigaEat v2 (протестировано 21.03.2026)

### Полный флоу работает:
- POST /api/v1/ration → GigaChat генерирует рацион с макросами, возвращает 5 магазинов ✅
- POST /api/v1/ration/:id/cart → формирует корзину, списывает КБЖУ, статус → consumed ✅
- Поиск в mock Купере возвращает первый результат ✅
- Два типа магазинов (Delivery/Walk) с правильной сортировкой ✅

### Тестовый пользователь для демо:
- user_id: 550e8400-e29b-41d4-a716-446655440000
- остаток: 1200 ккал, цель: lose, координаты: Москва 55.7512, 37.6184
- вес: 70.0 кг (по умолчанию)

### Критические баги (исправлены 21.03.2026):
1. ✅ Удалены дублирующиеся типы из ready_meal.go
2. ✅ Добавлен uuid import в meal_consumption.go
3. ✅ Исправлен type mismatch в orchestrator (ShoppingList → RationIngredient)
4. ✅ Добавлен mattn/go-sqlite3 в go.mod
5. ✅ Убран неверный FK в migration
6. ✅ Переименованы миграции, создан migrations/init/
7. ✅ PostgreSQL placeholders → SQLite (?) в mock файлах
8. ✅ /search возвращает объект, не массив
9. ✅ Убран фильтр store_id из поиска (products: "store_001", магазины: S1-S5)
10. ✅ Добавлены GIGACHAT_TOKEN и GIGACHAT_URL в docker-compose.yml

---

## Известные проблемы

- Баги, перечисленные выше, исправлены ✅
- Разные ветки не смержены — feature/macros-business-logic и feature/macros-data-layer ждут мержа

---

## Быстрый старт (v2)

1. Создать .env в папке Backend/ с GIGACHAT_TOKEN
2. В docker-compose секция api → environment добавить:
   - GIGACHAT_TOKEN
   - GIGACHAT_URL
   - KUPER_BASE_URL
3. docker-compose up --build
4. curl http://localhost:8080/health → {"status":"ok"}
5. curl -X POST http://localhost:8080/api/v1/ration \
  -H "Content-Type: application/json" \
  -d '{"user_id":"550e8400-e29b-41d4-a716-446655440000","lat":55.7512,"lng":37.6184,"consumed_meals":[]}' \
  | jq '.meals[0].protein_g' → ожидаем число
6. Создать корзину и проверить что КБЖУ списалось из профиля

---

## API Эндпоинты — Детали

### POST /api/v1/ration
**Детали реализации:**
- Проверяет полноту профиля (allergies, preferences, dietary_restrictions)
- Рассчитывает оставшийся КБЖУ от consumed_meals
- Генерирует 1-3 блюда (не обязательно все три)
- Для каждого блюда запрашивает macros (protein_g, fat_g, carbs_g)
- Сортирует магазины: Delivery по match_percent DESC, delivery_time ASC; Walk по match_percent DESC, distance ASC
- Возвращает два отдельных списка магазинов

### POST /api/v1/ration/:id/cart
**Детали реализации:**
- Получает рацион и все его блюда
- Суммирует КБЖУ всех блюд
- Создаёт корзину только с найденными товарами (не пустую)
- Вызывает DeductKBZHU с суммарным КБЖУ
- Обновляет статус на "consumed"
- Логирует ошибку DeductKBZHU если не удастся, но не блокирует ответ

### GET /api/v1/profile
**Детали реализации:**
- Возвращает текущий оставшийся КБЖУ
- Возвращает массивы allergies и preferences (для completeness check)
- Возвращает weight_kg (по умолчанию 70.0)
