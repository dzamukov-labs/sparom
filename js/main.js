/**
 * С ЛЁГКИМ ПАРОМ - Landing Page
 * Main JavaScript: Timer + A/B Testing Framework
 */

(function() {
    'use strict';

    // ===================================
    // COUNTDOWN TIMER
    // ===================================

    const TIMER_DAYS = 3; // Количество дней для таймера

    function initCountdown() {
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');

        if (!daysEl || !hoursEl || !minutesEl) return;

        // Получаем или создаём дату окончания
        let endDate = localStorage.getItem('sparom_timer_end');

        if (!endDate) {
            // Создаём новую дату окончания
            const now = new Date();
            const end = new Date(now.getTime() + TIMER_DAYS * 24 * 60 * 60 * 1000);
            endDate = end.toISOString();
            localStorage.setItem('sparom_timer_end', endDate);
        }

        function updateTimer() {
            const now = new Date();
            const end = new Date(endDate);
            const diff = end - now;

            if (diff <= 0) {
                // Таймер истёк - сбрасываем
                localStorage.removeItem('sparom_timer_end');
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minutesEl.textContent = '00';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minutesEl.textContent = String(minutes).padStart(2, '0');
        }

        updateTimer();
        setInterval(updateTimer, 1000);
    }

    // ===================================
    // A/B TESTING FRAMEWORK
    // ===================================

    const AB = {
        // Хранилище выбранных вариантов
        variants: {},

        // Инициализация A/B тестов
        init: function() {
            const stored = localStorage.getItem('sparom_ab_variants');

            if (stored) {
                try {
                    this.variants = JSON.parse(stored);
                } catch(e) {
                    this.variants = {};
                }
            }

            // Определяем варианты для каждого теста
            if (window.AB_CONFIG) {
                for (const testName in window.AB_CONFIG) {
                    if (!this.variants[testName]) {
                        const config = window.AB_CONFIG[testName];
                        const variantIndex = Math.floor(Math.random() * config.variants.length);
                        this.variants[testName] = variantIndex;
                    }
                }

                localStorage.setItem('sparom_ab_variants', JSON.stringify(this.variants));
            }

            this.applyVariants();
            this.trackToMetrika();
        },

        // Применяем выбранные варианты
        applyVariants: function() {
            if (!window.AB_CONFIG) return;

            // Headline
            if (window.AB_CONFIG.headline && this.variants.headline !== undefined) {
                const headlineEl = document.querySelector('[data-ab="headline"]');
                if (headlineEl) {
                    headlineEl.innerHTML = window.AB_CONFIG.headline.variants[this.variants.headline];
                }
            }

            // CTA Button
            if (window.AB_CONFIG.cta && this.variants.cta !== undefined) {
                const ctaEl = document.querySelector('[data-ab="cta"]');
                if (ctaEl) {
                    const variant = window.AB_CONFIG.cta.variants[this.variants.cta];
                    const textEl = ctaEl.querySelector('.btn__text');
                    const subtextEl = ctaEl.querySelector('.btn__subtext');
                    if (textEl) textEl.textContent = variant.text;
                    if (subtextEl) subtextEl.textContent = variant.subtext;
                }
            }
        },

        // Отправляем варианты в Яндекс.Метрику
        trackToMetrika: function() {
            if (typeof ym === 'function' && window.YM_COUNTER_ID) {
                ym(window.YM_COUNTER_ID, 'params', {
                    ab_test: this.variants
                });
            }

            // Логируем для дебага
            console.log('[A/B Test] Variants:', this.variants);
        },

        // Получить текущий вариант теста
        getVariant: function(testName) {
            return this.variants[testName];
        },

        // Принудительно установить вариант (для тестирования)
        setVariant: function(testName, variantIndex) {
            this.variants[testName] = variantIndex;
            localStorage.setItem('sparom_ab_variants', JSON.stringify(this.variants));
            this.applyVariants();
        },

        // Сбросить все варианты
        reset: function() {
            localStorage.removeItem('sparom_ab_variants');
            this.variants = {};
            location.reload();
        }
    };

    // Делаем доступным глобально для дебага
    window.AB = AB;

    // ===================================
    // CTA BUTTON HANDLERS
    // ===================================

    function initCTAButtons() {
        const ctaButtons = document.querySelectorAll('#mainCta, #galleryCta, #finalCta');

        ctaButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();

                // Отправляем событие в Метрику
                if (typeof ym === 'function' && window.YM_COUNTER_ID) {
                    ym(window.YM_COUNTER_ID, 'reachGoal', 'cta_click', {
                        button: this.id,
                        ab_variant: AB.variants
                    });
                }

                // Здесь будет переход на квиз
                // window.location.href = '/quiz';

                // Пока показываем алерт
                alert('Квиз скоро будет доступен!');
            });
        });
    }

    // ===================================
    // SMOOTH SCROLL
    // ===================================

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ===================================

    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.benefit-card').forEach(card => {
            card.style.animationPlayState = 'paused';
            observer.observe(card);
        });
    }

    // ===================================
    // INIT ON DOM READY
    // ===================================

    document.addEventListener('DOMContentLoaded', function() {
        initCountdown();
        AB.init();
        initCTAButtons();
        initSmoothScroll();
        initScrollAnimations();

        console.log('[Sparom] Landing page initialized');
        console.log('[Sparom] To test A/B variants, use: AB.setVariant("headline", 1)');
        console.log('[Sparom] To reset A/B tests: AB.reset()');
    });

})();
