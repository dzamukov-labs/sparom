-- Supabase Schema для аналитики расходов Яндекс.Директ и продаж AmoCRM
-- Выполни этот SQL в Supabase Dashboard -> SQL Editor

-- ===========================================
-- ТАБЛИЦА: Расходы по кампаниям Яндекс.Директ
-- ===========================================
CREATE TABLE IF NOT EXISTS yandex_expenses (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    campaign_name TEXT,
    year INT NOT NULL,
    month INT NOT NULL,
    cost DECIMAL(12, 2) DEFAULT 0,         -- Расход в рублях
    impressions INT DEFAULT 0,              -- Показы
    clicks INT DEFAULT 0,                   -- Клики
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Уникальный ключ: одна запись на кампанию + месяц
    UNIQUE(campaign_id, year, month)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_yandex_expenses_campaign ON yandex_expenses(campaign_id);
CREATE INDEX IF NOT EXISTS idx_yandex_expenses_period ON yandex_expenses(year, month);

-- ===========================================
-- ТАБЛИЦА: Лиды из AmoCRM
-- ===========================================
CREATE TABLE IF NOT EXISTS crm_leads (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT UNIQUE NOT NULL,         -- ID сделки в AmoCRM
    lead_name TEXT,                         -- Название сделки
    status_id INT,                          -- ID статуса
    status_name TEXT,                       -- Название статуса (этап воронки)
    pipeline_id INT,                        -- ID воронки
    pipeline_name TEXT,                     -- Название воронки
    price DECIMAL(12, 2) DEFAULT 0,         -- Сумма сделки

    -- UTM метки
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,                      -- ID кампании Яндекс.Директ
    utm_content TEXT,
    utm_term TEXT,

    -- Даты
    lead_created_at TIMESTAMPTZ,            -- Дата создания лида в AmoCRM
    lead_closed_at TIMESTAMPTZ,             -- Дата закрытия сделки

    -- Извлечённый ID кампании (числовой, для сопоставления)
    extracted_campaign_id BIGINT,

    -- Метаданные
    raw_data JSONB DEFAULT '{}',            -- Полные данные из AmoCRM для отладки
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_id ON crm_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status_name);
CREATE INDEX IF NOT EXISTS idx_crm_leads_campaign ON crm_leads(extracted_campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created ON crm_leads(lead_created_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_utm_source ON crm_leads(utm_source);

-- ===========================================
-- ТАБЛИЦА: Месячная аналитика (агрегированные снимки)
-- ===========================================
CREATE TABLE IF NOT EXISTS monthly_analytics (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    campaign_name TEXT,
    year INT NOT NULL,
    month INT NOT NULL,

    -- Данные из Яндекс.Директ
    cost DECIMAL(12, 2) DEFAULT 0,          -- Расход
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,

    -- Данные из AmoCRM
    leads_count INT DEFAULT 0,              -- Количество заявок (статус "Заявка оформлена")

    -- Вычисляемые метрики
    cost_per_lead DECIMAL(12, 2),           -- Цена за заявку (cost / leads_count)

    -- Метаданные
    is_locked BOOLEAN DEFAULT FALSE,        -- Заблокировано от изменений (месяц закрыт)
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),-- Когда был сделан снимок
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Уникальный ключ
    UNIQUE(campaign_id, year, month)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_campaign ON monthly_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_period ON monthly_analytics(year, month);

-- ===========================================
-- ТАБЛИЦА: Логи синхронизации
-- ===========================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGSERIAL PRIMARY KEY,
    sync_type TEXT NOT NULL,                -- 'yandex_expenses', 'crm_leads', 'analytics'
    status TEXT NOT NULL,                   -- 'started', 'success', 'error'
    records_processed INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    details JSONB DEFAULT '{}'
);

-- Индекс для поиска последних синхронизаций
CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(sync_type, started_at DESC);

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================
ALTER TABLE yandex_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Политика: разрешить всё для service_role key
CREATE POLICY "Service role access" ON yandex_expenses FOR ALL USING (true);
CREATE POLICY "Service role access" ON crm_leads FOR ALL USING (true);
CREATE POLICY "Service role access" ON monthly_analytics FOR ALL USING (true);
CREATE POLICY "Service role access" ON sync_logs FOR ALL USING (true);

-- ===========================================
-- ФУНКЦИЯ: Извлечение числового ID кампании из utm_campaign
-- ===========================================
CREATE OR REPLACE FUNCTION extract_campaign_id(utm_campaign TEXT)
RETURNS BIGINT AS $$
DECLARE
    result BIGINT;
BEGIN
    -- Извлекаем первое число из строки (8+ цифр подряд)
    SELECT (regexp_matches(utm_campaign, '(\d{8,})'))[1]::BIGINT INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- ТРИГГЕР: Автоматическое извлечение campaign_id при вставке/обновлении
-- ===========================================
CREATE OR REPLACE FUNCTION update_extracted_campaign_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.extracted_campaign_id := extract_campaign_id(NEW.utm_campaign);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_extract_campaign_id
    BEFORE INSERT OR UPDATE ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_extracted_campaign_id();

-- ===========================================
-- ПРЕДСТАВЛЕНИЕ: Сводная аналитика по месяцам
-- ===========================================
CREATE OR REPLACE VIEW analytics_summary AS
SELECT
    ye.campaign_id,
    ye.campaign_name,
    ye.year,
    ye.month,
    ye.cost,
    ye.clicks,
    COALESCE(leads.leads_count, 0) as leads_count,
    CASE
        WHEN COALESCE(leads.leads_count, 0) > 0
        THEN ROUND(ye.cost / leads.leads_count, 2)
        ELSE NULL
    END as cost_per_lead
FROM yandex_expenses ye
LEFT JOIN (
    SELECT
        extracted_campaign_id,
        EXTRACT(YEAR FROM lead_created_at)::INT as year,
        EXTRACT(MONTH FROM lead_created_at)::INT as month,
        COUNT(*) as leads_count
    FROM crm_leads
    WHERE
        utm_source = 'yandex'
        AND status_name = 'заявка оформлена'
        AND extracted_campaign_id IS NOT NULL
    GROUP BY extracted_campaign_id, year, month
) leads ON ye.campaign_id = leads.extracted_campaign_id
    AND ye.year = leads.year
    AND ye.month = leads.month
ORDER BY ye.year DESC, ye.month DESC, ye.campaign_name;
