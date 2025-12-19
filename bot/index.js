/**
 * Sparom Telegram Bot
 * Показывает фото и планировки бань по размерам
 */

const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Конфиг
const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sparom2024';
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN не задан!');
    process.exit(1);
}

// Supabase client
const supabase = SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// Bot instance
const bot = new Telegraf(BOT_TOKEN);

// Размеры бань
const SIZES = ['2.3х3', '2.3х4', '2.3х5', '2.3х6', '2.3х7', '2.3х8'];

// Заглушки для фото/планировок (замени на реальные URL)
const CONTENT = {
    photos: {
        '2.3х3': [
            'https://sparom.ru/images/banya-winter-1.png',
            'https://sparom.ru/images/banya-winter-2.png'
        ],
        '2.3х4': [
            'https://sparom.ru/images/banya-winter-1.png',
            'https://sparom.ru/images/banya-winter-3.png'
        ],
        '2.3х5': [
            'https://sparom.ru/images/banya-winter-2.png',
            'https://sparom.ru/images/banya-winter-3.png'
        ],
        '2.3х6': [
            'https://sparom.ru/images/banya-winter-1.png',
            'https://sparom.ru/images/banya-winter-2.png'
        ],
        '2.3х7': [
            'https://sparom.ru/images/banya-winter-2.png',
            'https://sparom.ru/images/banya-winter-3.png'
        ],
        '2.3х8': [
            'https://sparom.ru/images/banya-winter-1.png',
            'https://sparom.ru/images/banya-winter-3.png'
        ]
    },
    layouts: {
        '2.3х3': [
            'https://sparom.ru/images/banya-winter-1.png'
        ],
        '2.3х4': [
            'https://sparom.ru/images/banya-winter-2.png'
        ],
        '2.3х5': [
            'https://sparom.ru/images/banya-winter-3.png'
        ],
        '2.3х6': [
            'https://sparom.ru/images/banya-winter-1.png'
        ],
        '2.3х7': [
            'https://sparom.ru/images/banya-winter-2.png'
        ],
        '2.3х8': [
            'https://sparom.ru/images/banya-winter-3.png'
        ]
    }
};

// Сохранить пользователя в базу
async function saveUser(ctx) {
    if (!supabase) return;

    const user = ctx.from;
    try {
        await supabase.from('bot_users').upsert({
            telegram_id: user.id,
            username: user.username || null,
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'telegram_id' });
    } catch (err) {
        console.error('Error saving user:', err.message);
    }
}

// Логировать действие
async function logAction(ctx, action, data = {}) {
    if (!supabase) return;

    try {
        await supabase.from('bot_actions').insert({
            telegram_id: ctx.from.id,
            action,
            data,
            created_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error logging action:', err.message);
    }
}

// Сохранить сообщение в историю
async function saveMessage(telegramId, direction, text) {
    if (!supabase || !text) return;

    try {
        await supabase.from('bot_messages').insert({
            telegram_id: telegramId,
            direction, // 'in' (от пользователя) или 'out' (от админа)
            message: text,
            created_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error saving message:', err.message);
    }
}

// Главное меню
function mainMenu() {
    return Markup.keyboard([
        ['📸 Посмотреть фото', '📐 Посмотреть планировки']
    ]).resize();
}

// Меню размеров
function sizesMenu(prefix) {
    return Markup.inlineKeyboard([
        [Markup.button.callback('2.3х3', `${prefix}_2.3х3`), Markup.button.callback('2.3х4', `${prefix}_2.3х4`)],
        [Markup.button.callback('2.3х5', `${prefix}_2.3х5`), Markup.button.callback('2.3х6', `${prefix}_2.3х6`)],
        [Markup.button.callback('2.3х7', `${prefix}_2.3х7`), Markup.button.callback('2.3х8', `${prefix}_2.3х8`)]
    ]);
}

// Команда /start
bot.start(async (ctx) => {
    await saveUser(ctx);
    await logAction(ctx, 'start');

    await ctx.reply(
        `👋 Добро пожаловать в «С лёгким паром»!\n\n` +
        `Здесь вы найдёте:\n` +
        `📸 50+ фото готовых бань\n` +
        `📐 35 вариантов планировок\n\n` +
        `Выберите, что хотите посмотреть:`,
        mainMenu()
    );
});

// Фото
bot.hears('📸 Посмотреть фото', async (ctx) => {
    await logAction(ctx, 'photos_menu');
    await ctx.reply('Выберите размер бани:', sizesMenu('photo'));
});

// Планировки
bot.hears('📐 Посмотреть планировки', async (ctx) => {
    await logAction(ctx, 'layouts_menu');
    await ctx.reply('Выберите размер бани:', sizesMenu('layout'));
});

// Обработка выбора размера для фото
SIZES.forEach(size => {
    bot.action(`photo_${size}`, async (ctx) => {
        await ctx.answerCbQuery();
        await logAction(ctx, 'view_photos', { size });

        const photos = CONTENT.photos[size] || [];
        if (photos.length === 0) {
            await ctx.reply(`Фото для размера ${size} пока нет. Скоро добавим!`);
            return;
        }

        await ctx.reply(`📸 Фото бань размера ${size}:`);

        // Отправляем как медиагруппу
        const media = photos.map((url, i) => ({
            type: 'photo',
            media: url,
            caption: i === 0 ? `Баня ${size}` : undefined
        }));

        try {
            await ctx.replyWithMediaGroup(media);
        } catch (err) {
            // Если медиагруппа не работает, отправляем по одному
            for (const url of photos) {
                await ctx.replyWithPhoto(url);
            }
        }

        await ctx.reply('Хотите посмотреть другой размер?', sizesMenu('photo'));
    });
});

// Обработка выбора размера для планировок
SIZES.forEach(size => {
    bot.action(`layout_${size}`, async (ctx) => {
        await ctx.answerCbQuery();
        await logAction(ctx, 'view_layouts', { size });

        const layouts = CONTENT.layouts[size] || [];
        if (layouts.length === 0) {
            await ctx.reply(`Планировки для размера ${size} пока нет. Скоро добавим!`);
            return;
        }

        await ctx.reply(`📐 Планировки бань размера ${size}:`);

        const media = layouts.map((url, i) => ({
            type: 'photo',
            media: url,
            caption: i === 0 ? `Планировка ${size}` : undefined
        }));

        try {
            await ctx.replyWithMediaGroup(media);
        } catch (err) {
            for (const url of layouts) {
                await ctx.replyWithPhoto(url);
            }
        }

        await ctx.reply('Хотите посмотреть другой размер?', sizesMenu('layout'));
    });
});

// Слушаем все текстовые сообщения от пользователей (кроме команд)
bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    // Пропускаем команды и нажатия на клавиатуру
    if (text.startsWith('/') || text.includes('📸') || text.includes('📐')) {
        return;
    }

    await saveUser(ctx);
    await saveMessage(ctx.from.id, 'in', text);
    await logAction(ctx, 'message', { text: text.substring(0, 100) });

    // Автоответ
    await ctx.reply(
        '✉️ Спасибо за сообщение! Мы свяжемся с вами в ближайшее время.\n\n' +
        'А пока можете посмотреть фото и планировки наших бань:',
        mainMenu()
    );
});

// Express для админки и webhook
const app = express();
app.use(cors());
app.use(express.json());

// Получить URL аватарки пользователя
async function getUserAvatarUrl(telegramId) {
    try {
        const photos = await bot.telegram.getUserProfilePhotos(telegramId, 0, 1);
        if (photos.total_count > 0) {
            const fileId = photos.photos[0][0].file_id;
            const fileUrl = await bot.telegram.getFileLink(fileId);
            return fileUrl.href;
        }
    } catch (err) {
        // Пользователь мог заблокировать бота или удалить аватар
    }
    return null;
}

// API: Получить всех пользователей
app.get('/api/users', async (req, res) => {
    if (req.query.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabase) {
        return res.json({ users: [], message: 'Supabase not configured' });
    }

    const { data: users, error } = await supabase
        .from('bot_users')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Добавляем последнее сообщение и аватарку для каждого пользователя
    const usersWithData = await Promise.all((users || []).map(async (user) => {
        const [messagesResult, avatarUrl] = await Promise.all([
            supabase
                .from('bot_messages')
                .select('message, direction, created_at')
                .eq('telegram_id', user.telegram_id)
                .order('created_at', { ascending: false })
                .limit(1),
            getUserAvatarUrl(user.telegram_id)
        ]);

        return {
            ...user,
            last_message: messagesResult.data?.[0] || null,
            avatar_url: avatarUrl
        };
    }));

    res.json({ users: usersWithData });
});

// API: Статистика
app.get('/api/stats', async (req, res) => {
    if (req.query.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabase) {
        return res.json({ total_users: 0, message: 'Supabase not configured' });
    }

    const { count } = await supabase
        .from('bot_users')
        .select('*', { count: 'exact', head: true });

    const { data: actions } = await supabase
        .from('bot_actions')
        .select('action')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    res.json({
        total_users: count || 0,
        actions_24h: actions?.length || 0
    });
});

// API: Отправить сообщение пользователю
app.post('/api/send', async (req, res) => {
    const { password, telegram_id, message, parse_mode } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const options = parse_mode ? { parse_mode } : {};
        await bot.telegram.sendMessage(telegram_id, message, options);

        // Сохраняем исходящее сообщение в историю
        await saveMessage(telegram_id, 'out', message);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: История сообщений с пользователем
app.get('/api/messages/:telegram_id', async (req, res) => {
    if (req.query.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabase) {
        return res.json({ messages: [], message: 'Supabase not configured' });
    }

    const { telegram_id } = req.params;
    const { direction, limit = 50 } = req.query;

    let query = supabase
        .from('bot_messages')
        .select('*')
        .eq('telegram_id', telegram_id)
        .order('created_at', { ascending: true })
        .limit(parseInt(limit));

    // Фильтр по направлению (in/out)
    if (direction === 'in' || direction === 'out') {
        query = query.eq('direction', direction);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ messages: data || [] });
});

// API: Рассылка всем
app.post('/api/broadcast', async (req, res) => {
    const { password, message } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabase) {
        return res.status(400).json({ error: 'Supabase not configured' });
    }

    const { data: users } = await supabase.from('bot_users').select('telegram_id');

    let sent = 0;
    let failed = 0;

    for (const user of users || []) {
        try {
            await bot.telegram.sendMessage(user.telegram_id, message);
            sent++;
        } catch {
            failed++;
        }
        // Пауза чтобы не превысить лимит Telegram
        await new Promise(r => setTimeout(r, 50));
    }

    res.json({ sent, failed, total: users?.length || 0 });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Хелпер для запросов к Яндекс.Директ API
async function yandexDirectRequest(endpoint, method, params) {
    const token = process.env.YANDEX_DIRECT_TOKEN;
    const response = await fetch(`https://api.direct.yandex.com/json/v5/${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': 'ru',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method: method || 'get', params })
    });
    return response.json();
}

// Хелпер для Reports API (асинхронный)
async function yandexReportRequest(reportParams) {
    const token = process.env.YANDEX_DIRECT_TOKEN;
    const response = await fetch('https://api.direct.yandex.com/json/v5/reports', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': 'ru',
            'Content-Type': 'application/json',
            'processingMode': 'auto',
            'returnMoneyInMicros': 'false',
            'skipReportHeader': 'true',
            'skipReportSummary': 'true'
        },
        body: JSON.stringify({ params: reportParams })
    });

    // Reports API возвращает TSV, не JSON
    const text = await response.text();

    // Парсим TSV в JSON
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { rows: [], headers: [] };

    const headers = lines[0].split('\t');
    const rows = lines.slice(1).map(line => {
        const values = line.split('\t');
        const row = {};
        headers.forEach((h, i) => row[h] = values[i]);
        return row;
    });

    return { headers, rows };
}

// Хелпер для Яндекс.Метрика API
async function yandexMetrikaRequest(method, endpoint, params = {}) {
    const token = process.env.YANDEX_DIRECT_TOKEN;
    const counterId = '35165775';

    const url = new URL(`https://api-metrika.yandex.net/stat/v1/data${endpoint}`);
    url.searchParams.append('id', counterId);

    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    const response = await fetch(url.toString(), {
        method: method || 'GET',
        headers: {
            'Authorization': `OAuth ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return response.json();
}

// API: Полный анализ кампаний
app.get('/api/yandex-analysis', async (req, res) => {
    if (req.query.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = process.env.YANDEX_DIRECT_TOKEN;
    if (!token) {
        return res.json({ success: false, error: 'YANDEX_DIRECT_TOKEN не задан' });
    }

    try {
        // 1. Получаем кампании
        const campaignsData = await yandexDirectRequest('campaigns', 'get', {
            SelectionCriteria: {},
            FieldNames: ['Id', 'Name', 'Status', 'State', 'Type', 'DailyBudget', 'Statistics']
        });

        if (campaignsData.error) {
            return res.json({ success: false, error: campaignsData.error.error_string });
        }

        const campaigns = campaignsData.result?.Campaigns || [];
        if (campaigns.length === 0) {
            return res.json({ success: true, message: 'Кампаний нет', campaigns: [] });
        }

        const campaignIds = campaigns.map(c => c.Id);

        // 2. Получаем группы объявлений
        const adGroupsData = await yandexDirectRequest('adgroups', 'get', {
            SelectionCriteria: { CampaignIds: campaignIds },
            FieldNames: ['Id', 'Name', 'CampaignId', 'Status']
        });
        const adGroups = adGroupsData.result?.AdGroups || [];

        // 3. Получаем объявления
        const adsData = await yandexDirectRequest('ads', 'get', {
            SelectionCriteria: { CampaignIds: campaignIds },
            FieldNames: ['Id', 'CampaignId', 'AdGroupId', 'Status', 'State', 'Type'],
            TextAdFieldNames: ['Title', 'Title2', 'Text', 'Href', 'DisplayDomain']
        });
        const ads = adsData.result?.Ads || [];

        // 4. Получаем ключевые слова
        const keywordsData = await yandexDirectRequest('keywords', 'get', {
            SelectionCriteria: { CampaignIds: campaignIds },
            FieldNames: ['Id', 'Keyword', 'CampaignId', 'AdGroupId', 'Status', 'State']
        });
        const keywords = keywordsData.result?.Keywords || [];

        res.json({
            success: true,
            summary: {
                campaigns_count: campaigns.length,
                ad_groups_count: adGroups.length,
                ads_count: ads.length,
                keywords_count: keywords.length
            },
            campaigns: campaigns.map(c => ({
                id: c.Id,
                name: c.Name,
                status: c.Status,
                state: c.State,
                type: c.Type,
                daily_budget: c.DailyBudget,
                stats: c.Statistics
            })),
            ad_groups: adGroups.map(g => ({
                id: g.Id,
                name: g.Name,
                campaign_id: g.CampaignId,
                status: g.Status
            })),
            ads: ads.map(a => ({
                id: a.Id,
                campaign_id: a.CampaignId,
                ad_group_id: a.AdGroupId,
                status: a.Status,
                state: a.State,
                type: a.Type,
                title: a.TextAd?.Title,
                title2: a.TextAd?.Title2,
                text: a.TextAd?.Text,
                href: a.TextAd?.Href,
                domain: a.TextAd?.DisplayDomain
            })),
            keywords: keywords.map(k => ({
                id: k.Id,
                keyword: k.Keyword,
                campaign_id: k.CampaignId,
                status: k.Status,
                state: k.State
            }))
        });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// API: Тест Яндекс.Директ
app.get('/api/yandex-test', async (req, res) => {
    if (req.query.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = process.env.YANDEX_DIRECT_TOKEN;
    if (!token) {
        return res.json({ success: false, error: 'YANDEX_DIRECT_TOKEN не задан' });
    }

    try {
        const response = await fetch('https://api.direct.yandex.com/json/v5/campaigns', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Language': 'ru',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method: 'get',
                params: {
                    SelectionCriteria: {},
                    FieldNames: ['Id', 'Name', 'Status', 'State']
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.json({
                success: false,
                error: data.error.error_string || data.error.error_detail,
                code: data.error.error_code
            });
        }

        const campaigns = data.result?.Campaigns || [];
        res.json({
            success: true,
            campaigns_count: campaigns.length,
            campaigns: campaigns.map(c => ({
                id: c.Id,
                name: c.Name,
                status: c.Status,
                state: c.State
            }))
        });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ============================================
// ПОЛНЫЙ API ЯНДЕКС.ДИРЕКТ - ВСЕ ВОЗМОЖНОСТИ
// ============================================

// Проверка авторизации для Яндекс API
function checkYandexAuth(req, res) {
    if (req.query.password !== ADMIN_PASSWORD && req.body?.password !== ADMIN_PASSWORD) {
        res.status(401).json({ error: 'Unauthorized' });
        return false;
    }
    if (!process.env.YANDEX_DIRECT_TOKEN) {
        res.json({ success: false, error: 'YANDEX_DIRECT_TOKEN не задан' });
        return false;
    }
    return true;
}

// === УНИВЕРСАЛЬНЫЙ API (любой метод к любому сервису) ===
app.post('/api/yandex/raw', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { service, method, params } = req.body;
    if (!service || !method) {
        return res.json({ success: false, error: 'Укажите service и method' });
    }

    try {
        const result = await yandexDirectRequest(service, method, params || {});
        res.json({ success: !result.error, ...result });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === СТАТИСТИКА И ОТЧЁТЫ ===
app.get('/api/yandex/stats', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { campaign_ids, date_from, date_to, goal_id } = req.query;
    const dateFrom = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = date_to || new Date().toISOString().split('T')[0];

    try {
        // Базовые поля для отчета
        let fieldNames = ['Date', 'CampaignId', 'CampaignName', 'Impressions', 'Clicks', 'Cost', 'Ctr', 'AvgCpc'];

        // Если указана конкретная цель, добавляем поля по целям
        if (goal_id) {
            fieldNames.push('GoalId', 'GoalName', 'GoalConversions', 'GoalCost', 'GoalConversionRate');
        } else {
            // Общие конверсии (все автоцели + настроенные)
            fieldNames.push('Conversions', 'CostPerConversion');
        }

        // Формируем фильтры
        const filters = [];
        if (campaign_ids) {
            filters.push({ Field: 'CampaignId', Operator: 'IN', Values: campaign_ids.split(',').map(Number) });
        }
        if (goal_id) {
            filters.push({ Field: 'GoalId', Operator: 'EQUALS', Values: [parseInt(goal_id)] });
        }

        const reportParams = {
            SelectionCriteria: {
                DateFrom: dateFrom,
                DateTo: dateTo,
                Filter: filters.length > 0 ? filters : []
            },
            FieldNames: fieldNames,
            ReportName: 'Stats_' + Date.now(),
            ReportType: 'CAMPAIGN_PERFORMANCE_REPORT',
            DateRangeType: 'CUSTOM_DATE',
            Format: 'TSV',
            IncludeVAT: 'YES'
        };

        const data = await yandexReportRequest(reportParams);
        res.json({
            success: true,
            date_from: dateFrom,
            date_to: dateTo,
            goal_id: goal_id || null,
            ...data
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === КАМПАНИИ ===
// Получить кампании
app.get('/api/yandex/campaigns', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { state } = req.query; // ON, OFF, ARCHIVED и т.д.

    try {
        const params = {
            SelectionCriteria: state ? { States: [state] } : {},
            FieldNames: ['Id', 'Name', 'Status', 'State', 'Type', 'DailyBudget', 'StartDate', 'EndDate', 'Statistics']
        };
        const data = await yandexDirectRequest('campaigns', 'get', params);
        res.json({ success: !data.error, campaigns: data.result?.Campaigns || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Создать кампанию
app.post('/api/yandex/campaigns/add', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { name, daily_budget, start_date, negative_keywords, regions } = req.body;
    if (!name) return res.json({ success: false, error: 'Укажите name' });

    try {
        const params = {
            Campaigns: [{
                Name: name,
                StartDate: start_date || new Date().toISOString().split('T')[0],
                DailyBudget: daily_budget ? { Amount: daily_budget * 1000000, Mode: 'STANDARD' } : undefined,
                NegativeKeywords: negative_keywords ? { Items: negative_keywords } : undefined,
                TextCampaign: {
                    BiddingStrategy: {
                        Search: { BiddingStrategyType: 'HIGHEST_POSITION' },
                        Network: { BiddingStrategyType: 'SERVING_OFF' }
                    },
                    Settings: [
                        { Option: 'ADD_METRICA_TAG', Value: 'YES' },
                        { Option: 'ADD_TO_FAVORITES', Value: 'NO' }
                    ]
                }
            }]
        };

        if (regions) params.Campaigns[0].TextCampaign.CounterIds = regions;

        const data = await yandexDirectRequest('campaigns', 'add', params);
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Обновить кампанию
app.post('/api/yandex/campaigns/update', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { id, name, daily_budget } = req.body;
    if (!id) return res.json({ success: false, error: 'Укажите id' });

    try {
        const campaign = { Id: id };
        if (name) campaign.Name = name;
        if (daily_budget) campaign.DailyBudget = { Amount: daily_budget * 1000000, Mode: 'STANDARD' };

        const data = await yandexDirectRequest('campaigns', 'update', { Campaigns: [campaign] });
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Действия с кампаниями (запуск, пауза, архив)
app.post('/api/yandex/campaigns/action', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { ids, action } = req.body; // action: suspend, resume, archive, unarchive, delete
    if (!ids || !action) return res.json({ success: false, error: 'Укажите ids и action' });

    try {
        const data = await yandexDirectRequest('campaigns', action, { SelectionCriteria: { Ids: ids } });
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === ГРУППЫ ОБЪЯВЛЕНИЙ ===
app.get('/api/yandex/adgroups', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { campaign_ids } = req.query;
    if (!campaign_ids) return res.json({ success: false, error: 'Укажите campaign_ids' });

    try {
        const params = {
            SelectionCriteria: { CampaignIds: campaign_ids.split(',').map(Number) },
            FieldNames: ['Id', 'Name', 'CampaignId', 'Status', 'Type', 'RegionIds']
        };
        const data = await yandexDirectRequest('adgroups', 'get', params);
        res.json({ success: !data.error, ad_groups: data.result?.AdGroups || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/adgroups/add', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { campaign_id, name, region_ids } = req.body;
    if (!campaign_id || !name) return res.json({ success: false, error: 'Укажите campaign_id и name' });

    try {
        const params = {
            AdGroups: [{
                Name: name,
                CampaignId: campaign_id,
                RegionIds: region_ids || [225] // 225 = Россия
            }]
        };
        const data = await yandexDirectRequest('adgroups', 'add', params);
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === ОБЪЯВЛЕНИЯ ===
app.get('/api/yandex/ads', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { campaign_ids, adgroup_ids } = req.query;
    if (!campaign_ids && !adgroup_ids) return res.json({ success: false, error: 'Укажите campaign_ids или adgroup_ids' });

    try {
        const criteria = {};
        if (campaign_ids) criteria.CampaignIds = campaign_ids.split(',').map(Number);
        if (adgroup_ids) criteria.AdGroupIds = adgroup_ids.split(',').map(Number);

        const params = {
            SelectionCriteria: criteria,
            FieldNames: ['Id', 'CampaignId', 'AdGroupId', 'Status', 'State', 'Type', 'StatusClarification'],
            TextAdFieldNames: ['Title', 'Title2', 'Text', 'Href', 'DisplayDomain', 'Mobile', 'DisplayUrlPath']
        };
        const data = await yandexDirectRequest('ads', 'get', params);
        res.json({ success: !data.error, ads: data.result?.Ads || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/ads/add', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { adgroup_id, title, title2, text, href, display_url } = req.body;
    if (!adgroup_id || !title || !text || !href) {
        return res.json({ success: false, error: 'Укажите adgroup_id, title, text, href' });
    }

    try {
        const params = {
            Ads: [{
                AdGroupId: adgroup_id,
                TextAd: {
                    Title: title.substring(0, 56),
                    Title2: title2?.substring(0, 30),
                    Text: text.substring(0, 81),
                    Href: href,
                    DisplayUrlPath: display_url
                }
            }]
        };
        const data = await yandexDirectRequest('ads', 'add', params);
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/ads/update', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { id, title, title2, text, href } = req.body;
    if (!id) return res.json({ success: false, error: 'Укажите id' });

    try {
        const ad = { Id: id, TextAd: {} };
        if (title) ad.TextAd.Title = title.substring(0, 56);
        if (title2) ad.TextAd.Title2 = title2.substring(0, 30);
        if (text) ad.TextAd.Text = text.substring(0, 81);
        if (href) ad.TextAd.Href = href;

        const data = await yandexDirectRequest('ads', 'update', { Ads: [ad] });
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/ads/action', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { ids, action } = req.body; // action: suspend, resume, archive, unarchive, moderate
    if (!ids || !action) return res.json({ success: false, error: 'Укажите ids и action' });

    try {
        const data = await yandexDirectRequest('ads', action, { SelectionCriteria: { Ids: ids } });
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === КЛЮЧЕВЫЕ СЛОВА ===
app.get('/api/yandex/keywords', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { campaign_ids, adgroup_ids } = req.query;
    if (!campaign_ids && !adgroup_ids) return res.json({ success: false, error: 'Укажите campaign_ids или adgroup_ids' });

    try {
        const criteria = {};
        if (campaign_ids) criteria.CampaignIds = campaign_ids.split(',').map(Number);
        if (adgroup_ids) criteria.AdGroupIds = adgroup_ids.split(',').map(Number);

        const params = {
            SelectionCriteria: criteria,
            FieldNames: ['Id', 'Keyword', 'CampaignId', 'AdGroupId', 'Status', 'State', 'Bid', 'ContextBid']
        };
        const data = await yandexDirectRequest('keywords', 'get', params);
        res.json({ success: !data.error, keywords: data.result?.Keywords || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/keywords/add', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { adgroup_id, keywords } = req.body; // keywords = ["купить баню", "баня под ключ"]
    if (!adgroup_id || !keywords) return res.json({ success: false, error: 'Укажите adgroup_id и keywords' });

    try {
        const params = {
            Keywords: keywords.map(kw => ({
                AdGroupId: adgroup_id,
                Keyword: kw
            }))
        };
        const data = await yandexDirectRequest('keywords', 'add', params);
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/keywords/action', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { ids, action } = req.body; // action: suspend, resume, delete
    if (!ids || !action) return res.json({ success: false, error: 'Укажите ids и action' });

    try {
        const data = await yandexDirectRequest('keywords', action, { SelectionCriteria: { Ids: ids } });
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === СТАВКИ ===
app.get('/api/yandex/bids', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { campaign_ids, adgroup_ids, keyword_ids } = req.query;

    try {
        const criteria = {};
        if (campaign_ids) criteria.CampaignIds = campaign_ids.split(',').map(Number);
        if (adgroup_ids) criteria.AdGroupIds = adgroup_ids.split(',').map(Number);
        if (keyword_ids) criteria.KeywordIds = keyword_ids.split(',').map(Number);

        const params = {
            SelectionCriteria: criteria,
            FieldNames: ['KeywordId', 'CampaignId', 'AdGroupId', 'Bid', 'ContextBid']
        };
        const data = await yandexDirectRequest('bids', 'get', params);
        res.json({ success: !data.error, bids: data.result?.Bids || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/bids/set', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { keyword_id, bid, context_bid } = req.body;
    if (!keyword_id) return res.json({ success: false, error: 'Укажите keyword_id' });

    try {
        const bidItem = { KeywordId: keyword_id };
        if (bid) bidItem.Bid = bid * 1000000; // в микро-единицах
        if (context_bid) bidItem.ContextBid = context_bid * 1000000;

        const data = await yandexDirectRequest('bids', 'set', { Bids: [bidItem] });
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === СПРАВОЧНИКИ (регионы, валюты, и т.д.) ===
app.get('/api/yandex/dictionaries', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { names } = req.query; // GeoRegions, Currencies, TimeZones, и т.д.
    if (!names) return res.json({ success: false, error: 'Укажите names (например: GeoRegions,Currencies)' });

    try {
        const data = await yandexDirectRequest('dictionaries', 'get', { DictionaryNames: names.split(',') });
        res.json({ success: !data.error, ...data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === ИНФОРМАЦИЯ ОБ АККАУНТЕ ===
app.get('/api/yandex/account', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    try {
        const data = await yandexDirectRequest('clients', 'get', {
            FieldNames: ['Login', 'ClientId', 'AccountQuality', 'Phone', 'CountryId', 'Currency', 'Archived', 'Representatives']
        });
        res.json({ success: !data.error, account: data.result?.Clients?.[0], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === БЫСТРЫЕ ССЫЛКИ (SITELINKS) ===
app.get('/api/yandex/sitelinks', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { ids } = req.query;

    try {
        const params = {
            SelectionCriteria: ids ? { Ids: ids.split(',').map(Number) } : {},
            FieldNames: ['Id', 'Sitelinks']
        };
        const data = await yandexDirectRequest('sitelinks', 'get', params);
        res.json({ success: !data.error, sitelinks: data.result?.SitelinksSets || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/yandex/sitelinks/add', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    const { sitelinks } = req.body; // [{ title: "О нас", href: "https://..." }, ...]
    if (!sitelinks) return res.json({ success: false, error: 'Укажите sitelinks' });

    try {
        const params = {
            SitelinksSets: [{
                Sitelinks: sitelinks.map(s => ({ Title: s.title, Href: s.href, Description: s.description }))
            }]
        };
        const data = await yandexDirectRequest('sitelinks', 'add', params);
        res.json({ success: !data.error, result: data.result, error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === VCARDS (визитки) ===
app.get('/api/yandex/vcards', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    try {
        const params = {
            SelectionCriteria: {},
            FieldNames: ['Id', 'CompanyName', 'Phone', 'Street', 'City', 'WorkTime']
        };
        const data = await yandexDirectRequest('vcards', 'get', params);
        res.json({ success: !data.error, vcards: data.result?.VCards || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === РЕТАРГЕТИНГ ===
app.get('/api/yandex/retargeting', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    try {
        const data = await yandexDirectRequest('retargetinglists', 'get', {
            SelectionCriteria: {},
            FieldNames: ['Id', 'Name', 'Description', 'IsAvailable']
        });
        res.json({ success: !data.error, lists: data.result?.RetargetingLists || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === МИНУС-СЛОВА ===
app.get('/api/yandex/negative-keywords', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    try {
        const data = await yandexDirectRequest('negativekeywordsharedsets', 'get', {
            SelectionCriteria: {},
            FieldNames: ['Id', 'Name', 'NegativeKeywords']
        });
        res.json({ success: !data.error, sets: data.result?.NegativeKeywordSharedSets || [], error: data.error?.error_string });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === ЦЕЛИ (GOALS) ===
// Получить список целей из Яндекс.Метрики для кампаний
app.get('/api/yandex/goals', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    try {
        // Получаем список кампаний
        const campaignsData = await yandexDirectRequest('campaigns', 'get', {
            SelectionCriteria: {},
            FieldNames: ['Id', 'Name']
        });

        if (campaignsData.error) {
            return res.json({ success: false, error: campaignsData.error.error_string });
        }

        const campaigns = campaignsData.result?.Campaigns || [];

        // Для каждой кампании получаем цели через Reports API
        // Используем отчет CAMPAIGN_PERFORMANCE_REPORT с группировкой по GoalId
        const reportParams = {
            SelectionCriteria: {
                DateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                DateTo: new Date().toISOString().split('T')[0]
            },
            FieldNames: ['CampaignId', 'GoalId', 'GoalName', 'GoalCost', 'GoalConversions', 'GoalConversionRate'],
            ReportName: 'Goals_' + Date.now(),
            ReportType: 'CAMPAIGN_PERFORMANCE_REPORT',
            DateRangeType: 'CUSTOM_DATE',
            Format: 'TSV',
            IncludeVAT: 'YES'
        };

        const goalsData = await yandexReportRequest(reportParams);

        // Группируем цели по уникальным ID и именам
        const goalsMap = new Map();
        goalsData.rows?.forEach(row => {
            if (row.GoalId && row.GoalId !== '--') {
                goalsMap.set(row.GoalId, {
                    id: row.GoalId,
                    name: row.GoalName || 'Без названия',
                    campaigns: goalsMap.get(row.GoalId)?.campaigns || []
                });

                const existingCampaigns = goalsMap.get(row.GoalId).campaigns;
                if (!existingCampaigns.includes(row.CampaignId)) {
                    existingCampaigns.push(row.CampaignId);
                }
            }
        });

        const goals = Array.from(goalsMap.values());

        res.json({
            success: true,
            goals,
            total: goals.length
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// === КОМПЛЕКСНАЯ АНАЛИТИКА ===
// Полный анализ для создания новой кампании
app.get('/api/yandex/full-analysis', async (req, res) => {
    if (!checkYandexAuth(req, res)) return;

    try {
        const analysis = {
            timestamp: new Date().toISOString(),
            new_landing: 'sparom.ru/special-d',
            old_landing: 'sparom.ru/special'
        };

        // 1. Получаем все кампании
        const campaignsData = await yandexDirectRequest('campaigns', 'get', {
            SelectionCriteria: {},
            FieldNames: ['Id', 'Name', 'Status', 'State', 'Statistics', 'DailyBudget', 'StartDate']
        });

        analysis.campaigns = {
            total: campaignsData.result?.Campaigns?.length || 0,
            items: campaignsData.result?.Campaigns || []
        };

        // 2. Получаем статистику по кампаниям за последние 30 дней
        const statsReport = await yandexReportRequest({
            SelectionCriteria: {
                DateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                DateTo: new Date().toISOString().split('T')[0]
            },
            FieldNames: ['CampaignId', 'CampaignName', 'Impressions', 'Clicks', 'Cost', 'Ctr', 'AvgCpc', 'Conversions', 'CostPerConversion'],
            ReportName: 'FullAnalysis_' + Date.now(),
            ReportType: 'CAMPAIGN_PERFORMANCE_REPORT',
            DateRangeType: 'CUSTOM_DATE',
            Format: 'TSV',
            IncludeVAT: 'YES'
        });

        analysis.campaigns.stats = statsReport.rows || [];

        // 3. Получаем ключевые слова с лучшим CTR
        const keywordsReport = await yandexReportRequest({
            SelectionCriteria: {
                DateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                DateTo: new Date().toISOString().split('T')[0]
            },
            FieldNames: ['CampaignName', 'Keyword', 'Impressions', 'Clicks', 'Ctr', 'AvgCpc', 'Conversions'],
            ReportName: 'Keywords_' + Date.now(),
            ReportType: 'SEARCH_QUERY_PERFORMANCE_REPORT',
            DateRangeType: 'CUSTOM_DATE',
            Format: 'TSV',
            IncludeVAT: 'YES'
        });

        analysis.keywords = {
            total: keywordsReport.rows?.length || 0,
            top_converting: (keywordsReport.rows || [])
                .filter(k => parseFloat(k.Conversions || 0) > 0)
                .sort((a, b) => parseFloat(b.Conversions || 0) - parseFloat(a.Conversions || 0))
                .slice(0, 20),
            top_ctr: (keywordsReport.rows || [])
                .filter(k => parseFloat(k.Clicks || 0) > 10)
                .sort((a, b) => parseFloat(b.Ctr || 0) - parseFloat(a.Ctr || 0))
                .slice(0, 20)
        };

        // 4. Данные из Яндекс.Метрики
        try {
            // Источники трафика
            const sourcesData = await yandexMetrikaRequest('GET', '', {
                metrics: 'ym:s:visits,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds',
                dimensions: 'ym:s:lastSignTrafficSource',
                date1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date2: new Date().toISOString().split('T')[0],
                limit: 10
            });

            analysis.metrika = {
                sources: sourcesData.data || [],
                query: sourcesData.query || {}
            };

            // Конверсии по целям
            const goalsData = await yandexMetrikaRequest('GET', '', {
                metrics: 'ym:s:goal204286948reaches,ym:s:goal204286948conversionRate',
                dimensions: 'ym:s:date',
                date1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date2: new Date().toISOString().split('T')[0],
                group: 'day'
            });

            analysis.metrika.goal_stats = goalsData.data || [];
        } catch (metrikaError) {
            analysis.metrika = { error: metrikaError.message };
        }

        // 5. Рекомендации на основе анализа
        analysis.recommendations = generateRecommendations(analysis);

        res.json({ success: true, analysis });
    } catch (err) {
        res.json({ success: false, error: err.message, stack: err.stack });
    }
});

// Генерация рекомендаций на основе анализа
function generateRecommendations(analysis) {
    const recommendations = {
        budget: {},
        keywords: [],
        ad_copy: [],
        targeting: []
    };

    // Анализ бюджета
    const totalCost = analysis.campaigns.stats?.reduce((sum, c) => sum + parseFloat(c.Cost || 0), 0) || 0;
    const totalConversions = analysis.campaigns.stats?.reduce((sum, c) => sum + parseFloat(c.Conversions || 0), 0) || 0;
    const avgCPA = totalConversions > 0 ? totalCost / totalConversions : 0;

    recommendations.budget = {
        current_monthly: Math.round(totalCost),
        avg_cpa: Math.round(avgCPA),
        recommended_daily: Math.round(totalCost / 30 * 1.2), // +20% для новой кампании
        reason: 'На основе текущих затрат с запасом 20% для тестирования'
    };

    // Топ ключевых слов
    recommendations.keywords = analysis.keywords.top_converting.slice(0, 10).map(k => ({
        keyword: k.Keyword,
        conversions: k.Conversions,
        ctr: k.Ctr,
        reason: 'Высокая конверсия в текущих кампаниях'
    }));

    // Рекомендации по текстам
    const avgCtr = analysis.campaigns.stats?.reduce((sum, c) => sum + parseFloat(c.Ctr || 0), 0) / (analysis.campaigns.stats?.length || 1);
    recommendations.ad_copy.push({
        suggestion: 'Использовать УТП нового лендинга',
        current_avg_ctr: avgCtr?.toFixed(2),
        reason: 'Новый лендинг имеет улучшенную структуру и оффер'
    });

    return recommendations;
}

// Автопинг для предотвращения засыпания (работает на Render.com, Vercel, и локально)
function startKeepAlive() {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 минут

    // Автоопределение URL в зависимости от окружения
    let selfUrl;
    if (process.env.RENDER_EXTERNAL_URL) {
        // Render.com
        selfUrl = process.env.RENDER_EXTERNAL_URL;
    } else if (process.env.VERCEL_URL) {
        // Vercel
        selfUrl = `https://${process.env.VERCEL_URL}`;
    } else {
        // Локальная разработка
        selfUrl = `http://localhost:${PORT}`;
    }

    setInterval(async () => {
        try {
            const response = await fetch(`${selfUrl}/health`);
            const data = await response.json();
            console.log(`[Keep-Alive] Ping successful at ${new Date().toISOString()}, status: ${data.status}`);
        } catch (err) {
            console.error(`[Keep-Alive] Ping failed: ${err.message}`);
        }
    }, PING_INTERVAL);

    console.log(`[Keep-Alive] Started - pinging ${selfUrl}/health every 14 minutes`);
}

// Запуск
async function start() {
    // Polling mode (для локальной разработки)
    if (process.env.NODE_ENV !== 'production') {
        bot.launch();
        console.log('Bot started in polling mode');
    } else {
        // Webhook mode (для production)
        const webhookUrl = process.env.WEBHOOK_URL;
        if (webhookUrl) {
            await bot.telegram.setWebhook(`${webhookUrl}/bot${BOT_TOKEN}`);
            app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
            console.log('Bot started in webhook mode');
        } else {
            bot.launch();
            console.log('Bot started in polling mode (production)');
        }
    }

    app.listen(PORT, () => {
        console.log(`Admin API running on port ${PORT}`);

        // Запускаем автопинг ВСЕГДА (во всех окружениях)
        startKeepAlive();
    });
}

start();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
