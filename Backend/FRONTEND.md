# Frontend API Documentation

> Документация для интеграции фронтенда с бэкендом.
> Создано на основе бэкенда `hudeem-backend`.

---

## Базовая конфигурация

### Базовый URL
```
http://localhost:8080
```

### Протокол
```
HTTP/1.1
```

### Content-Type
```
application/json
```

---

## Эндпоинты

### 1. Health Check

**Путь:** `GET /health`

**Описание:** Проверка доступности бэкенда

**Ответ 200:**
```json
{
  "status": "ok"
}
```

---

### 2. Получить профиль пользователя

**Путь:** `GET /api/v1/profile`

**Описание:** Получение информации о пользователе (КБЖУ, цели, ограничения)

**Авторизация:** Не требуется (текущая реализация использует хардкод)

**Ответ 200:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "daily_kcal": 2500,
  "remaining_kcal": 1200,
  "remaining_protein_g": 95,
  "remaining_fat_g": 40,
  "remaining_carbs_g": 120,
  "goal": "lose",
  "dietary_restrictions": "без глютена, аллергия на орехи",
  "lat": 55.7512,
  "lng": 37.6184
}
```

**Поля ответа:**
| Поля | Тип | Описание |
|---|---|---|
| user_id | string (UUID) | ID пользователя |
| daily_kcal | number | Суточная норма калорий |
| remaining_kcal | number | Остаток калорий на сегодня |
| remaining_protein_g | number | Остаток белков (г) |
| remaining_fat_g | number | Остаток жиров (г) |
| remaining_carbs_g | number | Остаток углеводов (г) |
| goal | string | Цель: "lose", "maintain", "gain" |
| dietary_restrictions | string | Диетические ограничения |
| lat | number | Широта |
| lng | number | Долгота |

---

### 3. Сгенерировать рацион

**Путь:** `POST /api/v1/ration`

**Описание:** Генерация рациона питания на основе остатка КБЖУ

**Авторизация:** Не требуется

**Тело запроса:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "lat": 55.7512,
  "lng": 37.6184
}
```

**Поля запроса:**
| Поля | Тип | Обязательное | Описание |
|---|---|---|---|
| user_id | string (UUID) | Да | ID пользователя |
| lat | number | Да | Широта координат |
| lng | number | Да | Долгота координат |

**Ответ 200:**
```json
{
  "ration_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "meals": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c9",
      "meal_type": "breakfast",
      "name": "Овсянка с бананом",
      "kcal": 380
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430ca",
      "meal_type": "lunch",
      "name": "Гречка с курицей",
      "kcal": 520
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430cb",
      "meal_type": "dinner",
      "name": "Греческий салат",
      "kcal": 310
    }
  ],
  "ingredients": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430cc",
      "name": "овсянка",
      "quantity": "100",
      "unit": "г"
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430cd",
      "name": "куриное филе",
      "quantity": "500",
      "unit": "г"
    }
  ],
  "stores": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430ce",
      "store_id": "S1",
      "store_name": "Купер на Тверской",
      "distance_m": 320
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430cf",
      "store_id": "S2",
      "store_name": "Купер на Цветочном",
      "distance_m": 450
    }
  ]
}
```

**Поля ответа:**
| Поля | Тип | Описание |
|---|---|---|
| ration_id | string (UUID) | ID сгенерированного рациона |
| meals | array | Список приёмов пищи |
| meals[].id | string (UUID) | ID приёма пищи |
| meals[].meal_type | string | Тип: "breakfast", "lunch", "dinner", "snack" |
| meals[].name | string | Название блюда |
| meals[].kcal | number | Калорийность |
| ingredients | array | Список ингредиентов для покупки |
| ingredients[].id | string (UUID) | ID ингредиента |
| ingredients[].name | string | Название продукта |
| ingredients[].quantity | string | Количество |
| ingredients[].unit | string | Единица измерения |
| stores | array | Список ближайших магазинов |
| stores[].id | string (UUID) | ID магазина |
| stores[].store_id | string | ID магазина в Купере |
| stores[].store_name | string | Название магазина |
| stores[].distance_m | number | Расстояние в метрах |

---

### 4. Получить корзину

**Путь:** `POST /api/v1/ration/:id/cart`

**Описание:** Выбор магазина и формирование корзины

**Авторизация:** Не требуется

**Параметры пути:**
| Параметр | Тип | Описание |
|---|---|---|
| id | string (UUID) | ID рациона |

**Тело запроса:**
```json
{
  "store_id": "6ba7b810-9dad-11d1-80b4-00c04fd430ce"
}
```

**Поля запроса:**
| Поля | Тип | Обязательное | Описание |
|---|---|---|---|
| store_id | string (UUID) | Да | ID магазина из списка рациона |

**Ответ 200:**
```json
{
  "cart_id": "6ba7b810-9dad-11d1-80b4-00c04fd430d0",
  "total_price_rub": 1840,
  "found_count": 8,
  "total_count": 10,
  "checkout_url": "https://kuper.ru/checkout?cart_id=abc123",
  "items": [
    {
      "ingredient_name": "овсянка",
      "product_name": "Геркулес Увелка 500г",
      "price_rub": 89,
      "found": true
    },
    {
      "ingredient_name": "куриное филе",
      "product_name": "Куриное филе О'Кей 500г",
      "price_rub": 249,
      "found": true
    },
    {
      "ingredient_name": "ананас",
      "product_name": null,
      "price_rub": 0,
      "found": false
    }
  ]
}
```

**Поля ответа:**
| Поля | Тип | Описание |
|---|---|---|
| cart_id | string (UUID) | ID корзины |
| total_price_rub | number | Общая сумма в рублях |
| found_count | number | Количество найденных товаров |
| total_count | number | Всего ингредиентов для поиска |
| checkout_url | string | Ссылка для оплаты в Купере |
| items | array | Список товаров в корзине |
| items[].ingredient_name | string | Название ингредиента |
| items[].product_name | string/null | Название найденного продукта или null |
| items[].price_rub | number | Цена в рублях (0 если не найдено) |
| items[].found | boolean | Найден ли товар в этом магазине |

---

### 5. Получить рацион по ID

**Путь:** `GET /api/v1/ration/:id`

**Описание:** Получение детальной информации о рационе

**Авторизация:** Не требуется

**Параметры пути:**
| Параметр | Тип | Описание |
|---|---|---|
| id | string (UUID) | ID рациона |

**Ответ 200:**
```json
{
  "id": "6ba7b810-9dad-11d1-80b4-00c04fd430d0",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "ration_date": "2026-03-21T10:30:00Z",
  "total_kcal": 1210,
  "status": "generated",
  "gigachat_raw": "{\"meals\":[{\"meal_type\":\"breakfast\",\"name\":\"Овсянка с бананом\",\"kcal\":380}],\"shopping_list\":[{\"name\":\"овсянка\",\"quantity\":\"100\",\"unit\":\"г\"}]}",
  "meals": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430d1",
      "ration_id": "6ba7b810-9dad-11d1-80b4-00c04fd430d0",
      "meal_type": "breakfast",
      "name": "Овсянка с бананом",
      "kcal": 380,
      "sort_order": 0
    }
  ],
  "ingredients": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430d2",
      "ration_id": "6ba7b810-9dad-11d1-80b4-00c04fd430d0",
      "name": "овсянка",
      "quantity": "100",
      "unit": "г",
      "sort_order": 0
    }
  ]
}
```

**Поля ответа:**
| Поля | Тип | Описание |
|---|---|---|
| id | string (UUID) | ID рациона |
| user_id | string (UUID) | ID пользователя |
| ration_date | string (ISO) | Дата создания рациона |
| total_kcal | number | Общая калорийность |
| status | string | Статус: "generated", "ordered" |
| gigachat_raw | string | Сырой JSON от GigaChat |
| meals | array | Приёмы пищи |
| meals[].id | string (UUID) | ID приёма пищи |
| meals[].ration_id | string (UUID) | ID рациона |
| meals[].meal_type | string | Тип приёма пищи |
| meals[].name | string | Название блюда |
| meals[].kcal | number | Калорийность |
| meals[].sort_order | number | Порядок сортировки |
| ingredients | array | Ингредиенты |
| ingredients[].id | string (UUID) | ID ингредиента |
| ingredients[].ration_id | string (UUID) | ID рациона |
| ingredients[].name | string | Название продукта |
| ingredients[].quantity | string | Количество |
| ingredients[].unit | string | Единица измерения |
| ingredients[].sort_order | number | Порядок сортировки |

---

### 6. История рационов

**Путь:** `GET /api/v1/ration/history`

**Описание:** Получение истории рационов пользователя

**Авторизация:** Не требуется

**Ответ 200:**
```json
[
  {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430d0",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "ration_date": "2026-03-21T10:30:00Z",
    "total_kcal": 1210,
    "status": "generated"
  },
  {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430d1",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "ration_date": "2026-03-20T15:20:00Z",
    "total_kcal": 2300,
    "status": "ordered"
  }
]
```

**Поля ответа:**
| Поля | Тип | Описание |
|---|---|---|
| id | string (UUID) | ID рациона |
| user_id | string (UUID) | ID пользователя |
| ration_date | string (ISO) | Дата создания рациона |
| total_kcal | number | Общая калорийность |
| status | string | Статус: "generated", "ordered" |

---

### 7. Обновить профиль

**Путь:** `PUT /api/v1/profile`

**Описание:** Обновление профиля пользователя (текущая реализация - заглушка)

**Авторизация:** Не требуется

**Тело запроса:**
```json
{
  "remaining_kcal": 1200,
  "remaining_protein_g": 95,
  "remaining_fat_g": 40,
  "remaining_carbs_g": 120
}
```

**Поля запроса:**
| Поля | Тип | Обязательное | Описание |
|---|---|---|---|
| remaining_kcal | number | Да | Новые остатки калорий |
| remaining_protein_g | number | Да | Новые остатки белков (г) |
| remaining_fat_g | number | Да | Новые остатки жиров (г) |
| remaining_carbs_g | number | Да | Новые остатки углеводов (г) |

**Ответ 200:**
```json
{
  "message": "Profile updated successfully"
}
```

---

## Коды ошибок

### 422 Unprocessable Entity

```json
{
  "error": "user_profile_not_found",
  "message": "Заполните профиль питания"
}
```

### 503 Service Unavailable

```json
{
  "error": "ai_unavailable",
  "message": "Попробуйте через несколько секунд"
}
```

---

## Статусы рационов

| Статус | Описание |
|---|---|
| `generated` | Рацион сгенерирован, можно выбрать магазин |
| `ordered` | Корзина сформирована и оформлена |

---

## Типы данных

### UserProfile
```typescript
interface UserProfile {
  user_id: string;          // UUID
  daily_kcal: number;       // int
  remaining_kcal: number;   // int
  remaining_protein_g: number;   // int
  remaining_fat_g: number;  // int
  remaining_carbs_g: number;     // int
  goal: 'lose' | 'maintain' | 'gain';
  dietary_restrictions: string;
  lat: number;
  lng: number;
}
```

### Meal
```typescript
interface Meal {
  id: string;               // UUID
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  kcal: number;
}
```

### Ration
```typescript
interface Ration {
  id: string;               // UUID
  user_id: string;          // UUID
  ration_date: string;      // ISO date string
  total_kcal: number;
  status: 'generated' | 'ordered';
  meals: Meal[];
  ingredients: Ingredient[];
}
```

### Store
```typescript
interface Store {
  id: string;               // UUID
  store_id: string;         // Купер ID
  store_name: string;
  distance_m: number;
}
```

### Ingredient
```typescript
interface Ingredient {
  id: string;               // UUID
  name: string;
  quantity: string;
  unit: string;             // "г", "шт", "мл" и т.д.
}
```

### CartItem
```typescript
interface CartItem {
  ingredient_name: string;
  product_name: string | null;
  price_rub: number;
  found: boolean;
}
```

---

## Форматы полей

### user_id
Строка UUID в формате: `550e8400-e29b-41d4-a716-446655440000`

### ration_date
ISO 8601 формат: `2026-03-21T10:30:00Z`

### meal_type
Возможные значения:
- `breakfast` - завтрак
- `lunch` - обед
- `dinner` - ужин
- `snack` - перекус

### unit
Единицы измерения:
- `г` - граммы
- `шт` - штуки
- `мл` - миллилитры
- `кг` - килограммы

---

## Порядок работы с API

1. **Получить профиль** — `GET /api/v1/profile`
2. **Сгенерировать рацион** — `POST /api/v1/ration`
3. **Выбрать магазин** — `POST /api/v1/ration/:id/cart`
4. **Переход в Купер** — редирект на `checkout_url`

---

## Примечания для фронтенда

- Все даты возвращаются в формате ISO 8601
- Кодировка UTF-8
- Ответы от бэкенда не содержат массивов ошибок для простых случаев
- При ошибке 422 или 503 клиент должен показать соответствующее сообщение
- Магазины и ингредиенты возвращаются в виде UUID для удобства ссылок
- При создании корзины товары не найденные в магазине помечаются `found: false` и `price_rub: 0`
