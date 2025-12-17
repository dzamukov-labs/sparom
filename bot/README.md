# Sparom Telegram Bot

Бот для показа фото и планировок бань с админкой.

## Быстрый старт

### 1. Создать бота в Telegram
1. Напиши @BotFather в Telegram
2. `/newbot` → введи название → получи токен
3. Запомни токен (формат: `123456789:ABC...`)

### 2. Настроить Supabase
1. Зарегистрируйся на [supabase.com](https://supabase.com)
2. Создай новый проект
3. Зайди в SQL Editor и выполни содержимое `supabase-schema.sql`
4. В Settings → API скопируй:
   - Project URL
   - anon/public key

### 3. Запустить бота

**Локально:**
```bash
cd bot
npm install

# Создай .env файл
echo "BOT_TOKEN=твой_токен" > .env
echo "SUPABASE_URL=https://xxx.supabase.co" >> .env
echo "SUPABASE_KEY=твой_ключ" >> .env
echo "ADMIN_PASSWORD=твой_пароль" >> .env

npm start
```

**На Railway/Render:**
1. Подключи репозиторий
2. Укажи root directory: `bot`
3. Добавь переменные окружения:
   - `BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`
   - `WEBHOOK_URL` (опционально, URL твоего сервера)

### 4. Добавить картинки

Замени URL в `index.js` в объекте `CONTENT` на реальные ссылки на фото/планировки.

## API Endpoints

- `GET /api/stats?password=xxx` — статистика
- `GET /api/users?password=xxx` — список пользователей
- `POST /api/send` — отправить сообщение одному юзеру
- `POST /api/broadcast` — рассылка всем

## Админка

Открой `admin.html` в браузере. Перед использованием измени `API_URL` на адрес твоего сервера.
