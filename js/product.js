/**
 * Product Page JavaScript
 */

(function() {
    'use strict';

    // Gallery functionality
    function initGallery() {
        const mainImage = document.getElementById('gallery-main');
        const thumbs = document.querySelectorAll('.gallery__thumb');

        if (!mainImage || !thumbs.length) return;

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const src = thumb.dataset.src;
                if (src) {
                    mainImage.src = src;
                    thumbs.forEach(t => t.classList.remove('gallery__thumb--active'));
                    thumb.classList.add('gallery__thumb--active');
                }
            });
        });
    }

    // Pricing tabs
    function initPricingTabs() {
        const tabs = document.querySelectorAll('.pricing-tab');
        const panels = document.querySelectorAll('.pricing-panel');

        if (!tabs.length || !panels.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.dataset.tab;

                // Update tabs
                tabs.forEach(t => t.classList.remove('pricing-tab--active'));
                tab.classList.add('pricing-tab--active');

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
        initPricingTabs();
        initModal();
        initCompareTable();
    });
})();
