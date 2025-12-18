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
    });
}

start();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
