/**
 * Sauna Configurator - Step-by-step calculator
 * Mobile-first, modern UX
 */
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        deliveryPricePerKm: 45, // 45 rubles per km
        minDeliveryPrice: 3000,
        kirovCoords: { lat: 58.5966, lng: 49.6601 }
    };

    // City database with distances from Kirov
    const CITIES = [
        { name: 'Москва', region: 'Московская область', distance: 896 },
        { name: 'Санкт-Петербург', region: 'Ленинградская область', distance: 1100 },
        { name: 'Нижний Новгород', region: 'Нижегородская область', distance: 340 },
        { name: 'Казань', region: 'Республика Татарстан', distance: 400 },
        { name: 'Екатеринбург', region: 'Свердловская область', distance: 660 },
        { name: 'Пермь', region: 'Пермский край', distance: 470 },
        { name: 'Йошкар-Ола', region: 'Республика Марий Эл', distance: 180 },
        { name: 'Чебоксары', region: 'Чувашская Республика', distance: 250 },
        { name: 'Ижевск', region: 'Удмуртская Республика', distance: 280 },
        { name: 'Уфа', region: 'Республика Башкортостан', distance: 640 },
        { name: 'Саратов', region: 'Саратовская область', distance: 750 },
        { name: 'Самара', region: 'Самарская область', distance: 560 },
        { name: 'Челябинск', region: 'Челябинская область', distance: 820 },
        { name: 'Тюмень', region: 'Тюменская область', distance: 870 },
        { name: 'Новосибирск', region: 'Новосибирская область', distance: 1900 },
        { name: 'Краснодар', region: 'Краснодарский край', distance: 1600 },
        { name: 'Воронеж', region: 'Воронежская область', distance: 890 },
        { name: 'Ростов-на-Дону', region: 'Ростовская область', distance: 1200 },
        { name: 'Владимир', region: 'Владимирская область', distance: 580 },
        { name: 'Ярославль', region: 'Ярославская область', distance: 480 },
        { name: 'Кострома', region: 'Костромская область', distance: 380 },
        { name: 'Вологда', region: 'Вологодская область', distance: 420 },
        { name: 'Сыктывкар', region: 'Республика Коми', distance: 520 },
        { name: 'Киров', region: 'Кировская область', distance: 0 },
        { name: 'Котельнич', region: 'Кировская область', distance: 90 },
        { name: 'Слободской', region: 'Кировская область', distance: 35 },
        { name: 'Вятские Поляны', region: 'Кировская область', distance: 150 },
        { name: 'Кирово-Чепецк', region: 'Кировская область', distance: 30 },
        { name: 'Омутнинск', region: 'Кировская область', distance: 180 },
        { name: 'Подольск', region: 'Московская область', distance: 910 },
        { name: 'Люберцы', region: 'Московская область', distance: 885 },
        { name: 'Балашиха', region: 'Московская область', distance: 880 },
        { name: 'Мытищи', region: 'Московская область', distance: 875 },
        { name: 'Королёв', region: 'Московская область', distance: 870 },
        { name: 'Домодедово', region: 'Московская область', distance: 920 }
    ];

    // Size names for display
    const SIZE_NAMES = {
        '2-3x3': '2,3 × 3 м',
        '2-3x4': '2,3 × 4 м',
        '2-3x6': '2,3 × 6 м',
        '2-3x7-krylco': '2,3 × 7 м',
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
            summaryPackage: document.getElementById('summary-package'),
            summaryOptions: document.getElementById('summary-options'),
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

    // Handle city input
    function handleCityInput(e) {
        const query = elements.cityInput.value.toLowerCase().trim();

        if (query.length < 2) {
            elements.citySuggestions.classList.remove('config-delivery__suggestions--open');
            return;
        }

        const matches = CITIES.filter(city =>
            city.name.toLowerCase().includes(query) ||
            city.region.toLowerCase().includes(query)
        ).slice(0, 6);

        if (matches.length > 0) {
            elements.citySuggestions.innerHTML = matches.map(city => `
                <div class="config-delivery__suggestion" data-city="${city.name}" data-distance="${city.distance}">
                    ${city.name}
                    <span class="config-delivery__suggestion-region">${city.region}</span>
                </div>
            `).join('');

            elements.citySuggestions.classList.add('config-delivery__suggestions--open');

            // Bind click events to suggestions
            elements.citySuggestions.querySelectorAll('.config-delivery__suggestion').forEach(item => {
                item.addEventListener('click', () => selectCity(item));
            });
        } else {
            elements.citySuggestions.classList.remove('config-delivery__suggestions--open');
        }
    }

    // Select city
    function selectCity(item) {
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

        // Show result
        elements.deliveryResult.style.display = 'block';
        elements.deliveryCity.textContent = cityName;
        elements.deliveryDistance.textContent = distance + ' км';
        elements.deliveryPrice.textContent = formatPrice(state.deliveryPrice);

        updatePrice();
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

    // Update summary
    function updateSummary() {
        const optionsTotal = calculateOptionsTotal();

        elements.summarySize.textContent = formatPrice(state.sizePrice);

        if (state.packagePrice > 0) {
            elements.summaryPackage.textContent = '+' + formatPrice(state.packagePrice);
        } else {
            elements.summaryPackage.textContent = 'Включено';
        }

        if (optionsTotal > 0) {
            elements.summaryOptions.textContent = '+' + formatPrice(optionsTotal);
        } else {
            elements.summaryOptions.textContent = '0 ₽';
        }

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
