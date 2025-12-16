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
    // COUNTDOWN TIMER - Weekly deadline (Thursday 23:59 MSK)
    // ===================================
    function initCountdown() {
        const daysEl = document.getElementById('timerDays');
        const hoursEl = document.getElementById('timerHours');
        const minsEl = document.getElementById('timerMins');

        if (!daysEl || !hoursEl || !minsEl) return;

        function getNextThursdayMidnightMSK() {
            // Get current time in Moscow (UTC+3)
            const now = new Date();
            const mskOffset = 3 * 60; // Moscow is UTC+3
            const localOffset = now.getTimezoneOffset();
            const mskTime = new Date(now.getTime() + (mskOffset + localOffset) * 60 * 1000);

            // Find next Thursday 23:59:59 MSK
            // Thursday = 4 (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
            const dayOfWeek = mskTime.getDay();
            let daysUntilThursday = (4 - dayOfWeek + 7) % 7;

            // If it's Thursday, check if we're past 23:59
            if (daysUntilThursday === 0) {
                const hours = mskTime.getHours();
                const mins = mskTime.getMinutes();
                if (hours >= 23 && mins >= 59) {
                    daysUntilThursday = 7; // Next Thursday
                }
            }

            // Calculate end date in MSK
            const endMSK = new Date(mskTime);
            endMSK.setDate(endMSK.getDate() + daysUntilThursday);
            endMSK.setHours(23, 59, 59, 999);

            // Convert back to local time for comparison
            const endLocal = new Date(endMSK.getTime() - (mskOffset + localOffset) * 60 * 1000);

            return endLocal;
        }

        function update() {
            const now = new Date();
            const end = getNextThursdayMidnightMSK();
            const diff = end - now;

            if (diff <= 0) {
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
    // QUIZ MODAL
    // ===================================
    function initQuiz() {
        const modal = document.getElementById('quizModal');
        if (!modal) return;

        const overlay = modal.querySelector('.quiz-modal__overlay');
        const closeBtn = modal.querySelector('.quiz-modal__close');
        const steps = modal.querySelectorAll('.quiz__step');
        const progressBar = modal.querySelector('.quiz__progress-bar');
        const stepInfo = modal.querySelector('.quiz__step-info');
        const backBtn = modal.querySelector('.quiz__btn--back');
        const nextBtn = modal.querySelector('.quiz__btn--next');

        let currentStep = 0;
        const totalSteps = 6;
        const answers = {};

        function openModal() {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Track quiz open
            if (typeof ym === 'function' && window.YM_COUNTER_ID) {
                ym(window.YM_COUNTER_ID, 'reachGoal', 'quiz_open');
            }
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function goToStep(step) {
            if (step < 0 || step > totalSteps) return;

            currentStep = step;

            // Update steps visibility
            steps.forEach((s, i) => {
                s.classList.toggle('quiz__step--active', i === step);
            });

            // Update progress bar
            const progress = ((step + 1) / totalSteps) * 100;
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }

            // Update step info
            if (stepInfo) {
                stepInfo.textContent = `Шаг ${step + 1} из ${totalSteps}`;
            }

            // Update navigation buttons
            if (backBtn) {
                backBtn.style.visibility = step === 0 ? 'hidden' : 'visible';
            }

            if (nextBtn) {
                if (step === totalSteps - 1) {
                    nextBtn.textContent = 'Получить подборку';
                } else {
                    nextBtn.textContent = 'Далее →';
                }
            }

            // Hide nav on success screen
            const nav = modal.querySelector('.quiz__nav');
            if (nav) {
                nav.style.display = step >= totalSteps ? 'none' : 'flex';
            }

            // Hide step info and progress on success
            if (stepInfo) {
                stepInfo.style.display = step >= totalSteps ? 'none' : 'block';
            }
            const progressContainer = modal.querySelector('.quiz__progress');
            if (progressContainer) {
                progressContainer.style.display = step >= totalSteps ? 'none' : 'block';
            }

            validateCurrentStep();
        }

        function validateCurrentStep() {
            if (!nextBtn) return;

            let isValid = false;

            switch (currentStep) {
                case 0: // Design
                    isValid = modal.querySelector('input[name="design"]:checked') !== null;
                    break;
                case 1: // Color
                    isValid = modal.querySelector('input[name="color"]:checked') !== null;
                    break;
                case 2: // Budget
                    isValid = modal.querySelector('input[name="budget"]:checked') !== null;
                    break;
                case 3: // When
                    isValid = modal.querySelector('input[name="when"]:checked') !== null;
                    break;
                case 4: // Location
                    const location = modal.querySelector('input[name="location"]');
                    isValid = location && location.value.trim().length >= 3;
                    break;
                case 5: // Phone
                    const phone = modal.querySelector('input[name="phone"]');
                    // Check for at least 11 digits (7 + 10 digits)
                    const digits = phone ? phone.value.replace(/\D/g, '') : '';
                    isValid = digits.length >= 11;
                    break;
                default:
                    isValid = true;
            }

            nextBtn.disabled = !isValid;
        }

        function collectAnswers() {
            const design = modal.querySelector('input[name="design"]:checked');
            const color = modal.querySelector('input[name="color"]:checked');
            const budget = modal.querySelector('input[name="budget"]:checked');
            const when = modal.querySelector('input[name="when"]:checked');
            const location = modal.querySelector('input[name="location"]');
            const phone = modal.querySelector('input[name="phone"]');

            return {
                design: design ? design.value : '',
                color: color ? color.value : '',
                budget: budget ? budget.value : '',
                when: when ? when.value : '',
                location: location ? location.value.trim() : '',
                phone: phone ? phone.value.trim() : ''
            };
        }

        function getUTMParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                utm_source: params.get('utm_source') || '',
                utm_medium: params.get('utm_medium') || '',
                utm_campaign: params.get('utm_campaign') || '',
                utm_content: params.get('utm_content') || '',
                utm_term: params.get('utm_term') || ''
            };
        }

        async function submitQuiz() {
            const data = collectAnswers();
            const utm = getUTMParams();

            const payload = { ...data, ...utm };

            // Track quiz completion
            if (typeof ym === 'function' && window.YM_COUNTER_ID) {
                ym(window.YM_COUNTER_ID, 'reachGoal', 'quiz_complete', payload);
            }

            console.log('[Quiz] Submitted:', payload);

            // Show success screen immediately
            goToStep(totalSteps);

            // Send to Telegram
            try {
                await fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error('[Quiz] Send error:', err);
            }
        }

        // Event listeners
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                goToStep(currentStep - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentStep === totalSteps - 1) {
                    submitQuiz();
                } else {
                    goToStep(currentStep + 1);
                }
            });
        }

        // Listen for option changes
        modal.querySelectorAll('input[type="radio"]').forEach(input => {
            input.addEventListener('change', () => {
                validateCurrentStep();

                // Auto-advance for first 4 steps (except contact)
                if (currentStep < 4) {
                    setTimeout(() => {
                        goToStep(currentStep + 1);
                    }, 300);
                }
            });
        });

        // Phone input validation with prefilled +7
        const phoneInput = modal.querySelector('input[name="phone"]');
        if (phoneInput) {
            // Ensure +7 is always there
            phoneInput.addEventListener('focus', () => {
                if (!phoneInput.value || phoneInput.value.length < 3) {
                    phoneInput.value = '+7 ';
                }
            });

            phoneInput.addEventListener('input', () => {
                // Get only digits
                let value = phoneInput.value.replace(/\D/g, '');

                // Always start with 7
                if (value.length === 0) {
                    value = '7';
                } else if (value[0] === '8') {
                    value = '7' + value.slice(1);
                } else if (value[0] !== '7') {
                    value = '7' + value;
                }

                // Limit to 11 digits
                if (value.length > 11) {
                    value = value.slice(0, 11);
                }

                // Format: +7 (XXX) XXX-XX-XX
                let formatted = '+7 ';
                if (value.length > 1) {
                    formatted += '(' + value.slice(1, 4);
                }
                if (value.length > 4) {
                    formatted += ') ' + value.slice(4, 7);
                }
                if (value.length > 7) {
                    formatted += '-' + value.slice(7, 9);
                }
                if (value.length > 9) {
                    formatted += '-' + value.slice(9, 11);
                }

                phoneInput.value = formatted;
                validateCurrentStep();
            });

            // Prevent deleting +7
            phoneInput.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && phoneInput.value.length <= 4) {
                    e.preventDefault();
                }
            });
        }

        // Location input validation
        const locationInput = modal.querySelector('input[name="location"]');
        if (locationInput) {
            locationInput.addEventListener('input', validateCurrentStep);
        }

        // Initialize
        goToStep(0);

        // Expose open function
        window.openQuiz = openModal;

        return { open: openModal, close: closeModal };
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

                // Open quiz
                if (typeof window.openQuiz === 'function') {
                    window.openQuiz();
                }
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
        initQuiz();
        initCTAButtons();
        AB.init();

        console.log('[Sparom] Landing initialized');
        console.log('[Sparom] Carousel: swipe or click arrows');
        console.log('[Sparom] Quiz: openQuiz() to test');
        console.log('[Sparom] A/B test: AB.setVariant("headline", 1)');
    });

})();
