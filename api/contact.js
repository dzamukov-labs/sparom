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

        // Source labels
        const sourceLabels = {
            'about-founder': '📝 Страница "О компании" — Написать Георгию',
            'about-callback': '📞 Страница "О компании" — Обратный звонок',
            'header-callback': '📞 Шапка сайта — Заказать звонок',
            'footer-callback': '📞 Подвал сайта — Обратный звонок',
            'project-callback': '🏠 Страница проекта — Обратный звонок',
            'configurator': '⚙️ Конфигуратор — Заявка',
            'default': '📨 Заявка с сайта'
        };

        const sourceLabel = sourceLabels[data.source] || sourceLabels['default'];
        const pageUrl = data.page_url || 'sparom.ru';

        // Build message
        let message = `🔥 <b>${sourceLabel}</b>\n`;
        message += `${pageUrl}\n\n`;
        message += `📞 <b>Телефон:</b> ${data.phone || '—'}\n`;

        if (data.name) {
            message += `👤 <b>Имя:</b> ${data.name}\n`;
        }

        if (data.message) {
            message += `💬 <b>Сообщение:</b> ${data.message}\n`;
        }

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
