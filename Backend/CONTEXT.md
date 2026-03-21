# CONTEXT — hudeem-backend

> Этот файл содержит все принятые решения по проекту. Читай перед началом работы.

---

## Что делает фича «Что поесть»

Пользователь нажимает кнопку в приложении «Худеем на здоровье».
Система берёт остаток КБЖУ пользователя на сегодня, генерирует рацион (завтрак/обед/ужин + список ингредиентов) через GigaChat, находит 5 ближайших магазинов Купера, ищет каждый ингредиент в каждом магазине, показывает пользователю список магазинов с ценами → пользователь выбирает магазин → формируется корзина → редирект в Купер для оплаты.

---

## Стек

| Компонент | Решение |
|---|---|
| Язык | Go 1.25 |
| HTTP фреймворк | gin |
| БД | PostgreSQL 15 |
| Драйвер БД | pgx v5 |
| Миграции | golang-migrate |
| Конфиг | .env + godotenv |
| Логирование | стандартный `log` пакет (пока) |
| LLM | GigaChat API (реальный) |
| Доставка | Купер API (mock) |

---

## Что мокаем, что реальное

| | Статус | Детали |
|---|---|---|
| GigaChat API | **РЕАЛЬНЫЙ** | Есть доступ. POST /v1/chat/completions |
| Купер /stores/nearby | **МОК** | Нет доступа. Хардкод 5 магазинов |
| Купер /search | **МОК** | Поиск по названию из seed-данных |
| Купер /cart | **МОК** | Возвращает тестовый checkout_url |
| PostgreSQL | **РЕАЛЬНЫЙ** | Полноценная БД |
| Профиль пользователя | **SEED** | Хардкод тестового пользователя для демо |

Mock Купера — отдельный Go HTTP-сервер, запускается из `cmd/mock-kuper/main.go` на порту 8081. Основной сервис обращается к нему через `KUPER_BASE_URL` из конфига. Когда появится реальный API — меняем только URL, код не трогаем.

---

## Пайплайн данных (9 шагов)

```
1. POST /api/v1/ration  {user_id, lat, lng}
        ↓
2. [параллельно]
   a. READ user_profiles → остаток КБЖУ, цель, ограничения
   b. GET Купер /stores/nearby → 5 ближайших магазинов
        ↓
3. PromptBuilder собирает system + user промпт из данных профиля
        ↓
4. POST GigaChat API → JSON: {meals[], shopping_list[]}
        ↓
5. INSERT daily_rations, ration_meals, ration_ingredients, kuper_stores
        ↓
6. Ответ фронту: рацион + список магазинов
        ↓
7. POST /api/v1/ration/:id/cart  {store_id}
        ↓
8. [параллельно, семафор 10]
   GET Купер /search?q={ingredient}&store_id={id}  × N ингредиентов
   POST Купер /cart {store_id, items[]}  → cart_id, checkout_url
        ↓
9. INSERT kuper_carts, kuper_cart_items
   UPDATE daily_rations SET status='ordered'
   Ответ фронту: товары с ценами + checkout_url
```

---

## Схема БД

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
lat                 float
lng                 float
updated_at          timestamp
```

### daily_rations
Одна строка на каждое нажатие «Что поесть» или «Обновить».
```sql
id              uuid PK
user_id         uuid             -- → user_profiles.user_id
ration_date     date             -- INDEX: (user_id, ration_date DESC)
total_kcal      int
status          varchar          -- ENUM: generated / ordered
gigachat_raw    jsonb            -- полный ответ GigaChat, для дебага
created_at      timestamp
```

### ration_meals
Приёмы пищи внутри рациона. 3–4 строки на рацион.
```sql
id          uuid PK
ration_id   uuid FK → daily_rations.id
meal_type   varchar   -- ENUM: breakfast / lunch / dinner / snack
name        varchar   -- "Овсянка с бананом"
kcal        int
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
is_selected bool      -- true после выбора пользователем
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

---

## API эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| POST | /api/v1/ration | Генерация рациона + список магазинов |
| GET | /api/v1/ration/:id | Получить рацион по ID |
| GET | /api/v1/ration/history | История рационов пользователя |
| POST | /api/v1/ration/:id/cart | Выбрать магазин, сформировать корзину |
| GET | /api/v1/profile | Получить профиль пользователя |
| PUT | /api/v1/profile | Обновить остаток КБЖУ |

### POST /api/v1/ration — request
```json
{
  "user_id": "uuid",
  "lat": 55.7512,
  "lng": 37.6184
}
```

### POST /api/v1/ration — response 200
```json
{
  "ration_id": "uuid",
  "meals": [
    { "meal_type": "breakfast", "name": "Овсянка с бананом", "kcal": 380 },
    { "meal_type": "lunch",     "name": "Гречка с курицей",  "kcal": 520 },
    { "meal_type": "dinner",    "name": "Греческий салат",   "kcal": 310 }
  ],
  "ingredients": [
    { "id": "uuid", "name": "овсянка",       "quantity": "100", "unit": "г" },
    { "id": "uuid", "name": "куриное филе",  "quantity": "500", "unit": "г" }
  ],
  "stores": [
    { "id": "uuid", "store_id": "S1", "store_name": "Купер на Тверской", "distance_m": 320 }
  ]
}
```

### POST /api/v1/ration/:id/cart — request
```json
{ "store_id": "uuid" }
```

### POST /api/v1/ration/:id/cart — response 200
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

### Коды ошибок
```json
422  { "error": "user_profile_not_found", "message": "Заполните профиль питания" }
503  { "error": "ai_unavailable",         "message": "Попробуйте через несколько секунд" }
```

---

## Промпт GigaChat

### System prompt (актуальный)
```
Ты — персональный нутрициолог. Составь рацион питания на день.
Цель пользователя: {goal} (lose=похудеть, maintain=держать, gain=набрать).
Диетические ограничения: {dietary_restrictions}.

Правила:
1. Рацион укладывается в остаток КБЖУ пользователя.
2. Раздели на приёмы: завтрак, обед, ужин (перекус если нужно).
3. Составь список ингредиентов для всех блюд.
4. Только обычные продукты из магазина.
5. Отвечай ТОЛЬКО валидным JSON. Никакого текста до или после.

Строго используй этот формат ответа:
{
  "meals": [
    {"meal_type": "breakfast", "name": "Название блюда", "kcal": 300}
  ],
  "shopping_list": [
    {"name": "продукт", "quantity": "100", "unit": "г"}
  ]
}
```

### User prompt
```
Остаток КБЖУ на сегодня:

Калории: {remaining_kcal} ккал
Белки:   {remaining_protein_g} г
Жиры:    {remaining_fat_g} г
Углеводы:{remaining_carbs_g} г

Составь рацион на оставшуюся часть дня.
```

### Ожидаемый JSON от GigaChat
```json
{
  "meals": [
    { "meal_type": "breakfast", "name": "Овсянка с бананом", "kcal": 380 }
  ],
  "shopping_list": [
    { "name": "овсянка", "quantity": "100", "unit": "г" }
  ]
}
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

## Файловая структура

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
│   │   ├── ration.go                        # POST /ration
│   │   ├── cart.go                          # POST /ration/:id/cart
│   │   └── profile.go                       # GET|PUT /profile
│   ├── orchestrator/
│   │   └── ration.go                        # главный пайплайн
│   ├── service/
│   │   ├── gigachat/{interface.go,service.go}
│   │   ├── kuper/{interface.go,service.go}
│   │   └── profile/{interface.go,service.go}
│   ├── prompt/builder.go                    # сборка промпта
│   ├── client/
│   │   ├── gigachat/{interface.go,client.go}
│   │   └── kuper/{interface.go,client.go}
│   ├── repository/
│   │   ├── ration/{interface.go,repository.go}
│   │   ├── profile/{interface.go,repository.go}
│   │   └── kuper/{interface.go,repository.go}
│   ├── model/
│   │   ├── ration.go                        # DailyRation, RationMeal, RationIngredient
│   │   ├── profile.go                       # UserProfile
│   │   ├── kuper.go                         # KuperStore, KuperCart, KuperCartItem
│   │   └── gigachat.go                      # GigaChatRequest/Response, MealPlan
│   └── mock/kuper/
│       ├── handler.go                       # /stores/nearby, /search, /cart
│       └── data.go                          # захардкоженные магазины и товары
├── migrations/
│   ├── 000001_create_user_profiles.{up,down}.sql
│   ├── 000002_create_daily_rations.{up,down}.sql
│   ├── 000003_create_ration_meals.{up,down}.sql
│   ├── 000004_create_ration_ingredients.{up,down}.sql
│   ├── 000005_create_kuper_stores.{up,down}.sql
│   ├── 000006_create_kuper_carts.{up,down}.sql
│   └── 000007_create_kuper_cart_items.{up,down}.sql
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
- **postgres**: PostgreSQL 15, порт 5432
- **api**: основной сервис, порт 8080
- **mock-kuper**: mock сервер Купера, порт 8081

Миграции применяются автоматически при старте контейнера postgres.

---

## Команда

| Участник | Зона |
|---|---|
| Егор | Backend Lead: Handler, Orchestrator, DI, code review |
| Николай | Repository, миграции, Docker, деплой |
| Илья С. | KuperService, KuperClient, Mock Купера |
| Илья А. | GigaChatService, GigaChatClient, PromptBuilder |
| Никита | Весь фронт (отдельный репо) |

---

## Критические решения (не менять)

1. **Купер всегда через интерфейс** — реализация меняется URL в конфиге, не код
2. **gigachat_raw сохранять всегда** — до парсинга, на случай ошибки
3. **Шаги 2a + 2b параллельно** — errgroup.WithContext
4. **Поиск ингредиентов параллельно** — errgroup + семафор на 10 горутин
5. **Запись в БД после ответа пользователю** — не блокирует latency
6. **found=false вместо удаления** — показываем «не найдено» в UI
7. **user_id без FK constraint** — не создаём зависимость от схемы Сбера
8. **Логирование GigaChat response** — добавлено в service.go для дебага
9. **System prompt улучшен** — добавлен строгий формат с примером JSON

---

## Статус МВП (протестировано 21.03.2026)

Полный флоу работает:
- POST /api/v1/ration → GigaChat генерирует рацион, возвращает 5 магазинов ✅
- POST /api/v1/ration/:id/cart → формирует корзину, возвращает checkout_url ✅

Тестовый пользователь для демо:
- user_id: 550e8400-e29b-41d4-a716-446655440000
- остаток: 1200 ккал, цель: lose, координаты: Москва 55.7512, 37.6184

---

## Известные проблемы

- result.Choices[0] паникует если GigaChat вернул пустой массив — нужна проверка len > 0
- mock/kuper/data.go — каталог не содержит все продукты которые генерирует GigaChat (минтай, сметана, зелёный лук, капуста) — found=false для них
- docker-compose не передаёт GIGACHAT_TOKEN и GIGACHAT_URL через env по умолчанию — нужно добавить вручную
- Ветки не смержены — feature/gigachat-integration ждёт мержа в main

---

## Быстрый старт

1. Создать .env в папке Backend/ с GIGACHAT_TOKEN
2. Добавить в docker-compose секцию api → environment: GIGACHAT_TOKEN, GIGACHAT_URL, KUPER_MOCK_URL
3. docker-compose up --build
4. curl http://localhost:8080/health → {"status":"ok"}

---

## Команда (фактическое распределение)

| Участник | Зона |
|---|---|
| Егор | Backend Lead: Handler, Orchestrator, DI, code review |
| Николай | Repository, миграции, Docker, деплой |
| Илья А. | GigaChatService, GigaChatClient, PromptBuilder |
| Илья С. | KuperService, KuperClient, Mock Купера |
| Никита | Фронт |
