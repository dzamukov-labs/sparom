/**
 * С ЛЁГКИМ ПАРОМ — Premium Landing
 * Animations, Timer, A/B Testing
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
                document.body.style.overflow = '';
            }, 500);
        });

        // Fallback - hide after 3 seconds regardless
        setTimeout(() => {
            preloader.classList.add('hidden');
            document.body.style.overflow = '';
        }, 3000);
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
        const sections = document.querySelectorAll('.features, .gallery, .process, .cta-section');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    // Animate children with stagger
                    const children = entry.target.querySelectorAll('.feature-card, .process__step, .gallery__thumb');
                    children.forEach((child, i) => {
                        setTimeout(() => {
                            child.classList.add('visible');
                        }, i * 100);
                    });
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        sections.forEach(section => {
            section.classList.add('animate-on-scroll');
            observer.observe(section);
        });

        // Individual cards animation
        const cards = document.querySelectorAll('.feature-card, .process__step');
        cards.forEach(card => {
            card.classList.add('animate-on-scroll');
        });
    }

    // ===================================
    // GALLERY INTERACTION
    // ===================================
    function initGallery() {
        const thumbs = document.querySelectorAll('.gallery__thumb');
        const mainImg = document.getElementById('galleryMain');

        if (!thumbs.length || !mainImg) return;

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                // Remove active from all
                thumbs.forEach(t => t.classList.remove('gallery__thumb--active'));

                // Add active to clicked
                thumb.classList.add('gallery__thumb--active');

                // Update main image with fade effect
                const newSrc = thumb.querySelector('img').src.replace('w=400', 'w=1200');
                mainImg.style.opacity = '0';

                setTimeout(() => {
                    mainImg.src = newSrc;
                    mainImg.style.opacity = '1';
                }, 300);
            });
        });
    }

    // ===================================
    // SMOOTH PARALLAX ON HERO
    // ===================================
    function initParallax() {
        const heroImg = document.querySelector('.hero__bg-image');
        if (!heroImg) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    const rate = scrolled * 0.3;

                    if (scrolled < window.innerHeight) {
                        heroImg.style.transform = `scale(1.05) translateY(${rate}px)`;
                    }

                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ===================================
    // CTA BUTTONS
    // ===================================
    function initCTAButtons() {
        const ctaButtons = document.querySelectorAll('#mainCta, #galleryCta, #finalCta');

        ctaButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // Track click
                if (typeof ym === 'function' && window.YM_COUNTER_ID) {
                    ym(window.YM_COUNTER_ID, 'reachGoal', 'cta_click', {
                        button: btn.id
                    });
                }

                // Add ripple effect
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    background: rgba(255,255,255,0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;

                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size/2) + 'px';

                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);

                // Quiz placeholder
                alert('Квиз скоро будет доступен!');
            });
        });

        // Add ripple animation to page
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
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

            // Headline
            if (window.AB_CONFIG.headline && this.variants.headline !== undefined) {
                const variant = window.AB_CONFIG.headline.variants[this.variants.headline];
                const line1 = document.querySelector('.hero__title-line:first-child');
                const line2 = document.querySelector('.hero__title-line--accent');

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
    // FLOATING OFFER ANIMATION
    // ===================================
    function initFloatingOffer() {
        const offer = document.querySelector('.floating-offer');
        if (!offer) return;

        // Subtle hover animation
        offer.addEventListener('mouseenter', () => {
            offer.style.transform = 'translateY(-5px) scale(1.02)';
        });

        offer.addEventListener('mouseleave', () => {
            offer.style.transform = 'translateY(0) scale(1)';
        });
    }

    // ===================================
    // HEADER SCROLL EFFECT
    // ===================================
    function initHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                header.style.background = 'rgba(44, 24, 16, 0.9)';
                header.style.backdropFilter = 'blur(10px)';
            } else {
                header.style.background = 'transparent';
                header.style.backdropFilter = 'none';
            }

            lastScroll = currentScroll;
        });
    }

    // ===================================
    // INIT
    // ===================================
    document.addEventListener('DOMContentLoaded', () => {
        initPreloader();
        initCountdown();
        initScrollAnimations();
        initGallery();
        initParallax();
        initCTAButtons();
        initFloatingOffer();
        initHeaderScroll();
        AB.init();

        console.log('[Sparom] Premium landing initialized');
    });

})();
