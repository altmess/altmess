# Auth Module

Модуль авторизации и регистрации пользователей.

## Endpoints

### POST /auth/register
Регистрация нового пользователя.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-22T18:59:00.000Z"
}
```

### POST /auth/login
Вход пользователя.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

## Использование JWT токена

Для защищенных роутов используйте `onRequest: [fastify.authenticate]`:

```typescript
fastify.get('/protected', {
  onRequest: [fastify.authenticate],
  handler: async (request, reply) => {
    // request.user содержит данные из JWT токена
    return { userId: request.user.id };
  }
});
```

## Переменные окружения

- `JWT_SECRET` - секретный ключ для подписи JWT токенов
