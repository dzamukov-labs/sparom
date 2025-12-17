-- Supabase Schema для Sparom Bot
-- Выполни этот SQL в Supabase Dashboard -> SQL Editor

-- Таблица пользователей бота
CREATE TABLE IF NOT EXISTS bot_users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_id ON bot_users(telegram_id);

-- Таблица действий (для аналитики)
CREATE TABLE IF NOT EXISTS bot_actions (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    action TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для аналитики
CREATE INDEX IF NOT EXISTS idx_bot_actions_telegram_id ON bot_actions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_bot_actions_created_at ON bot_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_bot_actions_action ON bot_actions(action);

-- RLS (Row Level Security) - отключаем для простоты
-- В production рекомендуется настроить правильно
ALTER TABLE bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_actions ENABLE ROW LEVEL SECURITY;

-- Политика: разрешить всё для service_role key
CREATE POLICY "Service role access" ON bot_users FOR ALL USING (true);
CREATE POLICY "Service role access" ON bot_actions FOR ALL USING (true);
