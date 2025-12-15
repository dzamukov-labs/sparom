/**
 * С ЛЁГКИМ ПАРОМ — Premium Landing
 * Carousel, Timer, A/B Testing
 */

(function() {
    'use strict';

    // ===================================
    // PRELOADER
    // ===================================
    function initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 300);
        });

        // Fallback
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 2500);
    }

    // ===================================
    // CAROUSEL
    // ===================================
    function initCarousel() {
        const carousel = document.getElementById('heroCarousel');
        if (!carousel) return;

        const slides = carousel.querySelectorAll('.carousel__slide');
        const dots = carousel.querySelectorAll('.carousel__dot');
        const prevBtn = carousel.querySelector('.carousel__arrow--prev');
        const nextBtn = carousel.querySelector('.carousel__arrow--next');

        let currentIndex = 0;
        let autoplayInterval;
        const autoplayDelay = 5000;

        function showSlide(index) {
            // Normalize index
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            currentIndex = index;

            // Update slides
            slides.forEach((slide, i) => {
                slide.classList.toggle('carousel__slide--active', i === index);
            });

            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('carousel__dot--active', i === index);
            });
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
        }

        function startAutoplay() {
            stopAutoplay();
            autoplayInterval = setInterval(nextSlide, autoplayDelay);
        }

        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
            }
        }

        // Event listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                startAutoplay(); // Reset timer
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                startAutoplay(); // Reset timer
            });
        }

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                showSlide(i);
                startAutoplay(); // Reset timer
            });
        });

        // Pause on hover
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);

        // Touch support
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoplay();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
            startAutoplay();
        }, { passive: true });

        // Start autoplay
        startAutoplay();
    }

    // ===================================
    // COUNTDOWN TIMER
    // ===================================
    const TIMER_DAYS = 3;

    function initCountdown() {
        const daysEl = document.getElementById('timerDays');
        const hoursEl = document.getElementById('timerHours');
        const minsEl = document.getElementById('timerMins');

        if (!daysEl || !hoursEl || !minsEl) return;

        let endDate = localStorage.getItem('sparom_timer_end');

        if (!endDate) {
            const now = new Date();
            const end = new Date(now.getTime() + TIMER_DAYS * 24 * 60 * 60 * 1000);
            endDate = end.toISOString();
            localStorage.setItem('sparom_timer_end', endDate);
        }

        function update() {
            const now = new Date();
            const end = new Date(endDate);
            const diff = end - now;

            if (diff <= 0) {
                localStorage.removeItem('sparom_timer_end');
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minsEl.textContent = '00';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minsEl.textContent = String(mins).padStart(2, '0');
        }

        update();
        setInterval(update, 1000);
    }

    // ===================================
    // SCROLL ANIMATIONS
    // ===================================
    function initScrollAnimations() {
        const cards = document.querySelectorAll('.feature-card');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        cards.forEach(card => observer.observe(card));
    }

    // ===================================
    // CTA BUTTONS
    // ===================================
    function initCTAButtons() {
        const ctaButtons = document.querySelectorAll('#mainCta, #finalCta');

        ctaButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // Track click
                if (typeof ym === 'function' && window.YM_COUNTER_ID) {
                    ym(window.YM_COUNTER_ID, 'reachGoal', 'cta_click', {
                        button: btn.id
                    });
                }

                // Placeholder for quiz
                alert('Квиз скоро будет доступен!');
            });
        });
    }

    // ===================================
    // A/B TESTING
    // ===================================
    const AB = {
        variants: {},

        init() {
            const stored = localStorage.getItem('sparom_ab_variants');
            if (stored) {
                try {
                    this.variants = JSON.parse(stored);
                } catch(e) {
                    this.variants = {};
                }
            }

            if (window.AB_CONFIG) {
                for (const testName in window.AB_CONFIG) {
                    if (this.variants[testName] === undefined) {
                        const config = window.AB_CONFIG[testName];
                        this.variants[testName] = Math.floor(Math.random() * config.variants.length);
                    }
                }
                localStorage.setItem('sparom_ab_variants', JSON.stringify(this.variants));
            }

            this.apply();
            console.log('[A/B] Variants:', this.variants);
        },

        apply() {
            if (!window.AB_CONFIG) return;

            if (window.AB_CONFIG.headline && this.variants.headline !== undefined) {
                const variant = window.AB_CONFIG.headline.variants[this.variants.headline];
                const line1 = document.querySelector('.hero__title-line:not(.hero__title-accent)');
                const line2 = document.querySelector('.hero__title-accent');

                if (line1 && variant.line1) line1.textContent = variant.line1;
                if (line2 && variant.line2) line2.textContent = variant.line2;
            }
        },

        setVariant(testName, index) {
            this.variants[testName] = index;
            localStorage.setItem('sparom_ab_variants', JSON.stringify(this.variants));
            this.apply();
        },

        reset() {
            localStorage.removeItem('sparom_ab_variants');
            this.variants = {};
            location.reload();
        }
    };

    window.AB = AB;

    // ===================================
    // INIT
    // ===================================
    document.addEventListener('DOMContentLoaded', () => {
        initPreloader();
        initCarousel();
        initCountdown();
        initScrollAnimations();
        initCTAButtons();
        AB.init();

        console.log('[Sparom] Landing initialized');
        console.log('[Sparom] Carousel: swipe or click arrows');
        console.log('[Sparom] A/B test: AB.setVariant("headline", 1)');
    });

})();
