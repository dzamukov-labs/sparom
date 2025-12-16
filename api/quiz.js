export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Missing Telegram credentials');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const data = req.body;

        // Format quiz answers
        const designMap = { solid: 'Целиковая', porch: 'С крылечком' };
        const colorMap = {
            palisander: 'Палисандр',
            'dark-brown': 'Тёмно-коричневый',
            'light-brown': 'Светло-коричневый',
            custom: 'Индивидуальный'
        };
        const budgetMap = {
            '400-500': '400–500 тыс. ₽',
            '500-600': '500–600 тыс. ₽',
            '600-800': '600–800 тыс. ₽',
            '800+': 'Более 800 тыс. ₽'
        };
        const whenMap = {
            asap: 'Как можно скорее',
            month: 'В течение месяца',
            '2-3months': 'В течение 2-3 месяцев',
            looking: 'Пока изучаю'
        };

        // Build message
        const pageUrl = data.page_url || 'sparom.ru';
        let message = `🔥 <b>Новая заявка с сайта</b>\n${pageUrl}\n\n`;

        message += `📞 <b>Телефон:</b> ${data.phone || '—'}\n`;
        message += `📍 <b>Локация:</b> ${data.location || '—'}\n\n`;

        message += `<b>Ответы на квиз:</b>\n`;
        message += `├ Тип бани: ${designMap[data.design] || data.design || '—'}\n`;
        message += `├ Цвет: ${colorMap[data.color] || data.color || '—'}\n`;
        message += `├ Бюджет: ${budgetMap[data.budget] || data.budget || '—'}\n`;
        message += `└ Когда: ${whenMap[data.when] || data.when || '—'}\n`;

        // UTM tags
        if (data.utm_source || data.utm_medium || data.utm_campaign) {
            message += `\n<b>UTM метки:</b>\n`;
            if (data.utm_source) message += `├ source: ${data.utm_source}\n`;
            if (data.utm_medium) message += `├ medium: ${data.utm_medium}\n`;
            if (data.utm_campaign) message += `├ campaign: ${data.utm_campaign}\n`;
            if (data.utm_content) message += `├ content: ${data.utm_content}\n`;
            if (data.utm_term) message += `└ term: ${data.utm_term}\n`;
        }

        // Timestamp
        const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        message += `\n⏰ ${now} МСК`;

        // Send to Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();

        if (!result.ok) {
            console.error('Telegram error:', result);
            return res.status(500).json({ error: 'Failed to send message' });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
