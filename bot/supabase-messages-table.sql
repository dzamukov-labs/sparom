-- Таблица для хранения истории сообщений
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS bot_messages (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    direction VARCHAR(3) NOT NULL CHECK (direction IN ('in', 'out')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_bot_messages_telegram_id ON bot_messages(telegram_id);
CREATE INDEX IF NOT EXISTS idx_bot_messages_created_at ON bot_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_messages_direction ON bot_messages(telegram_id, direction);

-- Включить RLS (Row Level Security)
ALTER TABLE bot_messages ENABLE ROW LEVEL SECURITY;

-- Политика доступа (только сервис может читать/писать)
CREATE POLICY "Service access only" ON bot_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);
