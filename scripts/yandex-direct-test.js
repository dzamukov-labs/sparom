/**
 * Тест подключения к Яндекс.Директ API
 * Запуск: node scripts/yandex-direct-test.js
 */

const YANDEX_DIRECT_TOKEN = process.env.YANDEX_DIRECT_TOKEN;

if (!YANDEX_DIRECT_TOKEN) {
    console.error('❌ YANDEX_DIRECT_TOKEN не задан в переменных окружения');
    process.exit(1);
}

async function testConnection() {
    console.log('🔄 Проверяю подключение к Яндекс.Директ...\n');

    try {
        // Получаем информацию об аккаунте
        const response = await fetch('https://api.direct.yandex.com/json/v5/campaigns', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${YANDEX_DIRECT_TOKEN}`,
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
            console.error('❌ Ошибка API:', data.error.error_string || data.error.error_detail);
            console.error('   Код:', data.error.error_code);
            return false;
        }

        console.log('✅ Подключение успешно!\n');

        const campaigns = data.result?.Campaigns || [];

        if (campaigns.length === 0) {
            console.log('📭 Кампаний пока нет (это нормально для нового аккаунта)');
        } else {
            console.log(`📊 Найдено кампаний: ${campaigns.length}\n`);
            campaigns.forEach(c => {
                console.log(`   • ${c.Name}`);
                console.log(`     ID: ${c.Id}, Статус: ${c.Status}, Состояние: ${c.State}\n`);
            });
        }

        // Проверим лимиты
        console.log('📈 Проверяю баланс и лимиты...');

        const agencyResponse = await fetch('https://api.direct.yandex.com/json/v5/agencyclients', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${YANDEX_DIRECT_TOKEN}`,
                'Accept-Language': 'ru',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method: 'get',
                params: {
                    SelectionCriteria: {},
                    FieldNames: ['Login']
                }
            })
        });

        const agencyData = await agencyResponse.json();

        if (!agencyData.error) {
            console.log('✅ Это агентский аккаунт');
        } else {
            console.log('ℹ️  Это обычный рекламный аккаунт (не агентство)');
        }

        return true;

    } catch (err) {
        console.error('❌ Ошибка сети:', err.message);
        return false;
    }
}

testConnection().then(success => {
    console.log('\n' + (success ? '🎉 Тест пройден!' : '💥 Тест не пройден'));
    process.exit(success ? 0 : 1);
});
