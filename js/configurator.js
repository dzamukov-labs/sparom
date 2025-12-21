/**
 * Sauna Configurator - Step-by-step calculator
 * Mobile-first, modern UX
 */
(function() {
    'use strict';

    // Configuration
    // Production location: г. Пестово, Новгородская область, Россия
    const CONFIG = {
        deliveryPricePerKm: 45, // 45 rubles per km
        minDeliveryPrice: 3000,
        pestovoCoords: { lat: 58.5981, lng: 35.8153 } // Пестово, Новгородская область
    };

    // City database with distances from Пестово (Новгородская область)
    const CITIES = [
        { name: 'Москва', region: 'Московская область', distance: 430 },
        { name: 'Санкт-Петербург', region: 'Ленинградская область', distance: 350 },
        { name: 'Нижний Новгород', region: 'Нижегородская область', distance: 670 },
        { name: 'Казань', region: 'Республика Татарстан', distance: 1000 },
        { name: 'Екатеринбург', region: 'Свердловская область', distance: 1700 },
        { name: 'Пермь', region: 'Пермский край', distance: 1350 },
        { name: 'Великий Новгород', region: 'Новгородская область', distance: 180 },
        { name: 'Тверь', region: 'Тверская область', distance: 280 },
        { name: 'Вологда', region: 'Вологодская область', distance: 250 },
        { name: 'Ярославль', region: 'Ярославская область', distance: 320 },
        { name: 'Кострома', region: 'Костромская область', distance: 420 },
        { name: 'Рыбинск', region: 'Ярославская область', distance: 280 },
        { name: 'Череповец', region: 'Вологодская область', distance: 180 },
        { name: 'Псков', region: 'Псковская область', distance: 380 },
        { name: 'Петрозаводск', region: 'Республика Карелия', distance: 550 },
        { name: 'Архангельск', region: 'Архангельская область', distance: 780 },
        { name: 'Мурманск', region: 'Мурманская область', distance: 1200 },
        { name: 'Сыктывкар', region: 'Республика Коми', distance: 1000 },
        { name: 'Киров', region: 'Кировская область', distance: 950 },
        { name: 'Владимир', region: 'Владимирская область', distance: 500 },
        { name: 'Иваново', region: 'Ивановская область', distance: 450 },
        { name: 'Смоленск', region: 'Смоленская область', distance: 550 },
        { name: 'Калуга', region: 'Калужская область', distance: 530 },
        { name: 'Тула', region: 'Тульская область', distance: 520 },
        { name: 'Рязань', region: 'Рязанская область', distance: 560 },
        { name: 'Пестово', region: 'Новгородская область', distance: 0 },
        { name: 'Боровичи', region: 'Новгородская область', distance: 45 },
        { name: 'Старая Русса', region: 'Новгородская область', distance: 160 },
        { name: 'Валдай', region: 'Новгородская область', distance: 90 },
        { name: 'Бологое', region: 'Тверская область', distance: 100 },
        { name: 'Вышний Волочёк', region: 'Тверская область', distance: 170 },
        { name: 'Подольск', region: 'Московская область', distance: 445 },
        { name: 'Люберцы', region: 'Московская область', distance: 425 },
        { name: 'Балашиха', region: 'Московская область', distance: 420 },
        { name: 'Мытищи', region: 'Московская область', distance: 415 },
        { name: 'Королёв', region: 'Московская область', distance: 410 },
        { name: 'Домодедово', region: 'Московская область', distance: 450 },
        { name: 'Краснодар', region: 'Краснодарский край', distance: 1500 },
        { name: 'Ростов-на-Дону', region: 'Ростовская область', distance: 1200 },
        { name: 'Воронеж', region: 'Воронежская область', distance: 750 }
    ];

    // Size names for display
    const SIZE_NAMES = {
        '2-3x3': '2,3 × 3 м',
        '2-3x4': '2,3 × 4 м',
        '2-3x5': '2,3 × 5 м',
        '2-3x6-krylco': '2,3 × 6 м (с крыльцом)',
        '2-3x6': '2,3 × 6 м',
        '2-3x7-krylco': '2,3 × 7 м (с крыльцом)',
        '2-3x7': '2,3 × 7 м',
        '2-3x8': '2,3 × 8 м'
    };

    // Package names for display
    const PACKAGE_NAMES = {
        'base': 'Базовая',
        'comfort': 'Комфорт',
        'max': 'Максимум'
    };

    // State
    let state = {
        currentStep: 1,
        totalSteps: 4,
        selectedSize: '2-3x4',
        sizePrice: 397900,
        selectedPackage: 'comfort',
        packagePrice: 72000,
        options: {
            stove: { value: 'ermak', price: 0 },
            foundation: { value: 'blocks', price: 0 },
            layout: 1
        },
        extras: [],
        deliveryCity: null,
        deliveryDistance: 0,
        deliveryPrice: 0
    };

    // DOM Elements
    let elements = {};

    // Initialize
    function init() {
        cacheElements();
        bindEvents();
        updateUI();
    }

    // Cache DOM elements
    function cacheElements() {
        elements = {
            progressSteps: document.querySelectorAll('.config-progress__step'),
            steps: document.querySelectorAll('.config-step'),
            sizeCards: document.querySelectorAll('.config-size-card'),
            packageCards: document.querySelectorAll('.config-package'),
            layoutCards: document.querySelectorAll('.config-layout-card'),
            optionCards: document.querySelectorAll('.config-option-card'),
            btnNext: document.getElementById('config-btn-next'),
            btnBack: document.getElementById('config-btn-back'),
            btnOrder: document.getElementById('config-btn-order'),
            footerPrice: document.getElementById('config-footer-price'),
            cityInput: document.getElementById('config-city-input'),
            citySuggestions: document.getElementById('config-city-suggestions'),
            deliveryResult: document.getElementById('config-delivery-result'),
            deliveryCity: document.getElementById('config-delivery-city'),
            deliveryDistance: document.getElementById('config-delivery-distance'),
            deliveryPrice: document.getElementById('config-delivery-price'),
            summarySize: document.getElementById('summary-size'),
            summarySizeName: document.getElementById('summary-size-name'),
            summaryPackage: document.getElementById('summary-package'),
            summaryPackageName: document.getElementById('summary-package-name'),
            summaryOptionsList: document.getElementById('summary-options-list'),
            summaryDelivery: document.getElementById('summary-delivery'),
            summaryTotal: document.getElementById('summary-total')
        };
    }

    // Bind events
    function bindEvents() {
        // Size cards
        elements.sizeCards.forEach(card => {
            card.addEventListener('click', () => selectSize(card));
        });

        // Package cards
        elements.packageCards.forEach(card => {
            card.addEventListener('click', () => selectPackage(card));
        });

        // Layout cards
        elements.layoutCards.forEach(card => {
            card.addEventListener('click', () => selectLayout(card));
        });

        // Option cards
        elements.optionCards.forEach(card => {
            card.addEventListener('click', () => selectOption(card));
        });

        // Navigation buttons
        elements.btnNext.addEventListener('click', nextStep);
        elements.btnBack.addEventListener('click', prevStep);

        // City input
        if (elements.cityInput) {
            elements.cityInput.addEventListener('input', handleCityInput);
            elements.cityInput.addEventListener('focus', handleCityInput);
            elements.cityInput.addEventListener('blur', () => {
                setTimeout(() => {
                    elements.citySuggestions.classList.remove('config-delivery__suggestions--open');
                }, 200);
            });
        }
    }

    // Select size
    function selectSize(card) {
        elements.sizeCards.forEach(c => c.classList.remove('config-size-card--selected'));
        card.classList.add('config-size-card--selected');

        state.selectedSize = card.dataset.size;
        state.sizePrice = parseInt(card.dataset.price);

        updatePrice();
    }

    // Select package
    function selectPackage(card) {
        elements.packageCards.forEach(c => c.classList.remove('config-package--selected'));
        card.classList.add('config-package--selected');

        state.selectedPackage = card.dataset.package;
        state.packagePrice = parseInt(card.dataset.price);

        updatePrice();
    }

    // Select layout
    function selectLayout(card) {
        elements.layoutCards.forEach(c => c.classList.remove('config-layout-card--selected'));
        card.classList.add('config-layout-card--selected');

        state.options.layout = parseInt(card.dataset.layout);
    }

    // Select option (stove, foundation, extras)
    function selectOption(card) {
        const optionType = card.dataset.option;
        const value = card.dataset.value;
        const price = parseInt(card.dataset.price) || 0;

        if (optionType === 'extra') {
            // Toggle extras
            card.classList.toggle('config-option-card--selected');

            const extraIndex = state.extras.findIndex(e => e.value === value);
            if (extraIndex > -1) {
                state.extras.splice(extraIndex, 1);
            } else {
                state.extras.push({ value, price });
            }
        } else {
            // Single selection for stove/foundation
            const siblingCards = document.querySelectorAll(`[data-option="${optionType}"]`);
            siblingCards.forEach(c => c.classList.remove('config-option-card--selected'));
            card.classList.add('config-option-card--selected');

            state.options[optionType] = { value, price };
        }

        updatePrice();
    }

    /**
     * YANDEX MAPS API INTEGRATION
     * ===========================
     *
     * Для подключения автодополнения городов через Яндекс Карты:
     *
     * 1. Получите API-ключ на https://developer.tech.yandex.ru/
     *    - Зарегистрируйтесь и создайте новое приложение
     *    - Включите API "JavaScript API и HTTP Геокодер"
     *    - Скопируйте полученный ключ
     *
     * 2. Добавьте скрипт в <head> страницы (перед </head>):
     *    <script src="https://api-maps.yandex.ru/2.1/?apikey=ВАШ_КЛЮЧ&lang=ru_RU" type="text/javascript"></script>
     *
     * 3. Установите YANDEX_API_ENABLED = true ниже
     *
     * После этого автодополнение будет использовать Яндекс Suggest API,
     * а расстояние будет рассчитываться через Яндекс Маршруты.
     */
    const YANDEX_API_ENABLED = false; // Измените на true после подключения API

    // Handle city input
    function handleCityInput(e) {
        const query = elements.cityInput.value.trim();

        if (query.length < 2) {
            elements.citySuggestions.classList.remove('config-delivery__suggestions--open');
            return;
        }

        // Use Yandex API if available
        if (YANDEX_API_ENABLED && window.ymaps) {
            handleCityInputYandex(query);
        } else {
            handleCityInputLocal(query);
        }
    }

    // Local database search (fallback)
    function handleCityInputLocal(query) {
        const queryLower = query.toLowerCase();
        const matches = CITIES.filter(city =>
            city.name.toLowerCase().includes(queryLower) ||
            city.region.toLowerCase().includes(queryLower)
        ).slice(0, 6);

        if (matches.length > 0) {
            elements.citySuggestions.innerHTML = matches.map(city => `
                <div class="config-delivery__suggestion" data-city="${city.name}" data-distance="${city.distance}">
                    ${city.name}
                    <span class="config-delivery__suggestion-region">${city.region}</span>
                </div>
            `).join('');

            elements.citySuggestions.classList.add('config-delivery__suggestions--open');

            elements.citySuggestions.querySelectorAll('.config-delivery__suggestion').forEach(item => {
                item.addEventListener('click', () => selectCityLocal(item));
            });
        } else {
            elements.citySuggestions.classList.remove('config-delivery__suggestions--open');
        }
    }

    // Yandex Suggest API search
    function handleCityInputYandex(query) {
        ymaps.suggest(query, { results: 6 }).then(function(items) {
            if (items.length > 0) {
                elements.citySuggestions.innerHTML = items.map(item => `
                    <div class="config-delivery__suggestion config-delivery__suggestion--yandex" data-address="${item.value}">
                        ${item.displayName}
                    </div>
                `).join('');

                elements.citySuggestions.classList.add('config-delivery__suggestions--open');

                elements.citySuggestions.querySelectorAll('.config-delivery__suggestion').forEach(suggItem => {
                    suggItem.addEventListener('click', () => selectCityYandex(suggItem));
                });
            } else {
                elements.citySuggestions.classList.remove('config-delivery__suggestions--open');
            }
        });
    }

    // Select city from local database
    function selectCityLocal(item) {
        const cityName = item.dataset.city;
        const distance = parseInt(item.dataset.distance);

        state.deliveryCity = cityName;
        state.deliveryDistance = distance;
        state.deliveryPrice = Math.max(
            CONFIG.minDeliveryPrice,
            distance * CONFIG.deliveryPricePerKm
        );

        elements.cityInput.value = cityName;
        elements.citySuggestions.classList.remove('config-delivery__suggestions--open');

        showDeliveryResult(cityName, distance, state.deliveryPrice);
        updatePrice();
    }

    // Select city from Yandex API and calculate route
    function selectCityYandex(item) {
        const address = item.dataset.address;
        elements.cityInput.value = address;
        elements.citySuggestions.classList.remove('config-delivery__suggestions--open');

        // Calculate route distance using Yandex Routes API
        ymaps.route([
            'г. Пестово, Новгородская область',
            address
        ], { routingMode: 'auto' }).then(function(route) {
            const distance = Math.round(route.getLength() / 1000); // km

            state.deliveryCity = address;
            state.deliveryDistance = distance;
            state.deliveryPrice = Math.max(
                CONFIG.minDeliveryPrice,
                distance * CONFIG.deliveryPricePerKm
            );

            showDeliveryResult(address, distance, state.deliveryPrice);
            updatePrice();
        }).catch(function(err) {
            console.error('Route calculation error:', err);
            // Fallback: show error message
            elements.deliveryResult.style.display = 'block';
            elements.deliveryCity.textContent = address;
            elements.deliveryDistance.textContent = 'Не удалось рассчитать';
            elements.deliveryPrice.textContent = 'Уточните по телефону';
        });
    }

    // Show delivery result
    function showDeliveryResult(city, distance, price) {
        elements.deliveryResult.style.display = 'block';
        elements.deliveryCity.textContent = city;
        elements.deliveryDistance.textContent = distance + ' км';
        elements.deliveryPrice.textContent = formatPrice(price);
    }

    // Next step
    function nextStep() {
        if (state.currentStep < state.totalSteps) {
            setStep(state.currentStep + 1);
        }
    }

    // Previous step
    function prevStep() {
        if (state.currentStep > 1) {
            setStep(state.currentStep - 1);
        }
    }

    // Set step
    function setStep(stepNum) {
        state.currentStep = stepNum;

        // Update progress bar
        elements.progressSteps.forEach((step, index) => {
            const stepIndex = index + 1;
            step.classList.remove('config-progress__step--active', 'config-progress__step--completed');

            if (stepIndex === stepNum) {
                step.classList.add('config-progress__step--active');
            } else if (stepIndex < stepNum) {
                step.classList.add('config-progress__step--completed');
            }
        });

        // Update visible step
        elements.steps.forEach(step => {
            step.classList.remove('config-step--active');
            if (parseInt(step.dataset.step) === stepNum) {
                step.classList.add('config-step--active');
            }
        });

        // Update buttons
        updateButtons();

        // Update summary on last step
        if (stepNum === 4) {
            updateSummary();
        }

        // Scroll to top of configurator
        document.getElementById('configurator').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Update buttons visibility
    function updateButtons() {
        const isFirstStep = state.currentStep === 1;
        const isLastStep = state.currentStep === state.totalSteps;

        elements.btnBack.style.display = isFirstStep ? 'none' : 'flex';
        elements.btnNext.style.display = isLastStep ? 'none' : 'flex';
        elements.btnOrder.style.display = isLastStep ? 'flex' : 'none';
    }

    // Calculate total price
    function calculateTotal() {
        let total = state.sizePrice + state.packagePrice;

        // Add options
        total += state.options.stove.price;
        total += state.options.foundation.price;

        // Add extras
        state.extras.forEach(extra => {
            total += extra.price;
        });

        // Add delivery
        total += state.deliveryPrice;

        return total;
    }

    // Calculate options total
    function calculateOptionsTotal() {
        let total = 0;
        total += state.options.stove.price;
        total += state.options.foundation.price;
        state.extras.forEach(extra => {
            total += extra.price;
        });
        return total;
    }

    // Update price display
    function updatePrice() {
        const total = calculateTotal();
        elements.footerPrice.textContent = formatPrice(total);
    }

    // Option names for display
    const OPTION_NAMES = {
        stove: {
            ermak: 'Печь Ермак 12-Т',
            grilld: 'Печь Grill\'d Cometa'
        },
        foundation: {
            blocks: 'Блоки 200×200',
            svai: 'Винтовые сваи'
        },
        extra: {
            terrace: 'Терраса',
            benches: 'Стол + лавки'
        }
    };

    // Update summary
    function updateSummary() {
        // Update size name
        const sizeName = SIZE_NAMES[state.selectedSize] || state.selectedSize;
        if (elements.summarySizeName) {
            elements.summarySizeName.textContent = 'Баня ' + sizeName;
        }
        elements.summarySize.textContent = formatPrice(state.sizePrice);

        // Update package name
        const packageName = PACKAGE_NAMES[state.selectedPackage] || state.selectedPackage;
        if (elements.summaryPackageName) {
            elements.summaryPackageName.textContent = 'Комплектация «' + packageName + '»';
        }
        if (state.packagePrice > 0) {
            elements.summaryPackage.textContent = '+' + formatPrice(state.packagePrice);
        } else {
            elements.summaryPackage.textContent = 'Включено';
        }

        // Build itemized options list
        if (elements.summaryOptionsList) {
            let optionsHtml = '';

            // Stove (only if paid)
            if (state.options.stove.price > 0) {
                const stoveName = OPTION_NAMES.stove[state.options.stove.value] || state.options.stove.value;
                optionsHtml += `<div class="config-summary__option">
                    <span class="config-summary__option-name">${stoveName}</span>
                    <span class="config-summary__option-price">+${formatPrice(state.options.stove.price)}</span>
                </div>`;
            }

            // Foundation (only if paid)
            if (state.options.foundation.price > 0) {
                const foundationName = OPTION_NAMES.foundation[state.options.foundation.value] || state.options.foundation.value;
                optionsHtml += `<div class="config-summary__option">
                    <span class="config-summary__option-name">${foundationName}</span>
                    <span class="config-summary__option-price">+${formatPrice(state.options.foundation.price)}</span>
                </div>`;
            }

            // Extras
            state.extras.forEach(extra => {
                const extraName = OPTION_NAMES.extra[extra.value] || extra.value;
                optionsHtml += `<div class="config-summary__option">
                    <span class="config-summary__option-name">${extraName}</span>
                    <span class="config-summary__option-price">+${formatPrice(extra.price)}</span>
                </div>`;
            });

            elements.summaryOptionsList.innerHTML = optionsHtml;
        }

        // Delivery
        if (state.deliveryPrice > 0) {
            elements.summaryDelivery.textContent = '+' + formatPrice(state.deliveryPrice);
        } else {
            elements.summaryDelivery.textContent = 'Не указана';
        }

        elements.summaryTotal.textContent = formatPrice(calculateTotal());
    }

    // Update UI
    function updateUI() {
        updatePrice();
        updateButtons();
    }

    // Format price
    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
