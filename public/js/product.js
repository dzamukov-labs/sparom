/**
 * Product Page JavaScript
 */

(function() {
    'use strict';

    // Gallery images array for lightbox
    let galleryImages = [];
    let currentImageIndex = 0;

    // Gallery functionality
    function initGallery() {
        const mainImage = document.getElementById('gallery-main');
        const thumbs = document.querySelectorAll('.gallery__thumb');

        if (!mainImage || !thumbs.length) return;

        // Collect all gallery images
        thumbs.forEach((thumb, index) => {
            const src = thumb.dataset.src;
            if (src && !galleryImages.includes(src)) {
                galleryImages.push(src);
            }
        });

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const src = thumb.dataset.src;
                const index = thumb.dataset.index;
                if (src) {
                    mainImage.src = src;
                    currentImageIndex = parseInt(index) || 0;
                    thumbs.forEach(t => t.classList.remove('gallery__thumb--active'));
                    thumb.classList.add('gallery__thumb--active');
                }
            });
        });
    }

    // Lightbox functionality
    function initLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxCounter = document.getElementById('lightbox-counter');
        const mainImageWrapper = document.getElementById('gallery-main-wrapper');

        // Get thumbs from hidden container (for full gallery) or visible thumbs
        const hiddenThumbs = document.querySelectorAll('.gallery-compact__hidden .gallery__thumb');
        const thumbs = hiddenThumbs.length > 0 ? hiddenThumbs : document.querySelectorAll('.gallery__thumb');

        if (!lightbox) return;

        // Collect unique images for lightbox
        const uniqueImages = [];
        thumbs.forEach(thumb => {
            const src = thumb.dataset.src;
            if (src && !uniqueImages.includes(src)) {
                uniqueImages.push(src);
            }
        });

        function openLightbox(index) {
            if (uniqueImages.length === 0) return;

            currentImageIndex = index;
            updateLightboxImage();
            lightbox.classList.add('lightbox--open');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('lightbox--open');
            document.body.style.overflow = '';
        }

        function updateLightboxImage() {
            if (lightboxImage && uniqueImages[currentImageIndex]) {
                lightboxImage.src = uniqueImages[currentImageIndex];
                if (lightboxCounter) {
                    lightboxCounter.textContent = `${currentImageIndex + 1} / ${uniqueImages.length}`;
                }
            }
        }

        function nextImage() {
            currentImageIndex = (currentImageIndex + 1) % uniqueImages.length;
            updateLightboxImage();
        }

        function prevImage() {
            currentImageIndex = (currentImageIndex - 1 + uniqueImages.length) % uniqueImages.length;
            updateLightboxImage();
        }

        // Open lightbox on main image click (compact gallery)
        if (mainImageWrapper) {
            mainImageWrapper.addEventListener('click', (e) => {
                // Don't open lightbox if clicking video button
                if (e.target.closest('.gallery-compact__video-btn') || e.target.closest('.gallery__video-btn')) return;
                openLightbox(0);
            });
        }

        // Open lightbox on compact gallery thumbs
        const compactThumbs = document.querySelectorAll('.gallery-compact__thumb');
        compactThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.dataset.index) || 0;
                openLightbox(index);
            });
        });

        // Close button
        const closeBtn = lightbox.querySelector('.lightbox__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }

        // Overlay click
        const overlay = lightbox.querySelector('.lightbox__overlay');
        if (overlay) {
            overlay.addEventListener('click', closeLightbox);
        }

        // Navigation buttons
        const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
        const nextBtn = lightbox.querySelector('.lightbox__nav--next');

        if (prevBtn) prevBtn.addEventListener('click', prevImage);
        if (nextBtn) nextBtn.addEventListener('click', nextImage);

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('lightbox--open')) return;

            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        });
    }

    // Pricing tabs with new overview
    function initPricingTabs() {
        const overviewItems = document.querySelectorAll('.pricing-overview__item');
        const panels = document.querySelectorAll('.pricing-panel');

        if (!overviewItems.length || !panels.length) return;

        overviewItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPanel = item.dataset.tab;

                // Update overview items
                overviewItems.forEach(i => i.classList.remove('pricing-overview__item--active'));
                item.classList.add('pricing-overview__item--active');

                // Update panels
                panels.forEach(panel => {
                    if (panel.dataset.panel === targetPanel) {
                        panel.classList.add('pricing-panel--active');
                    } else {
                        panel.classList.remove('pricing-panel--active');
                    }
                });
            });
        });
    }

    // Modal functionality
    function initModal() {
        const openBtn = document.getElementById('open-layouts');
        const modal = document.getElementById('layouts-modal');

        if (!openBtn || !modal) return;

        const closeBtn = modal.querySelector('.modal__close');
        const overlay = modal.querySelector('.modal__overlay');

        function openModal() {
            modal.classList.add('modal--open');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('modal--open');
            document.body.style.overflow = '';
        }

        openBtn.addEventListener('click', openModal);

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
                closeModal();
            }
        });
    }

    // Compare table toggle
    function initCompareTable() {
        const toggleBtn = document.getElementById('toggle-compare');
        const compareTable = document.getElementById('compare-table');

        if (!toggleBtn || !compareTable) return;

        toggleBtn.addEventListener('click', () => {
            const isOpen = compareTable.classList.contains('compare-table--open');

            if (isOpen) {
                compareTable.classList.remove('compare-table--open');
                toggleBtn.classList.remove('pricing-compare-btn--open');
                toggleBtn.innerHTML = `
                    Показать полное сравнение
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                `;
            } else {
                compareTable.classList.add('compare-table--open');
                toggleBtn.classList.add('pricing-compare-btn--open');
                toggleBtn.innerHTML = `
                    Скрыть сравнение
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                `;
            }
        });
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        initGallery();
        initLightbox();
        initPricingTabs();
        initModal();
        initCompareTable();
    });
})();
