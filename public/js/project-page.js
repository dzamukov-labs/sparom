/**
 * Project Page Price Sync
 * Updates prices from Google Sheets on individual project pages
 */
(function() {
    'use strict';

    let pricesFromSheet = null;

    // Get current project size from page URL or default
    function getCurrentProjectSize() {
        const path = window.location.pathname;
        // Extract size from URL like /proekty/2-3x4.html
        const match = path.match(/2-3x(\d+)(-krylco)?/);
        if (match) {
            return `2-3x${match[1]}${match[2] || ''}`;
        }
        return '2-3x4'; // default fallback
    }

    /**
     * Load prices from Google Sheets API
     */
    async function loadPricesFromAPI() {
        try {
            const response = await fetch('/api/prices');
            const result = await response.json();

            if (result.success && result.data) {
                pricesFromSheet = result.data;
                console.log('Project page: Prices loaded from Google Sheets:', result.cached ? '(cached)' : '(fresh)');

                // Update prices on the page
                updatePricingOverview();
            } else {
                console.warn('Failed to load prices from API:', result.error);
            }
        } catch (error) {
            console.error('Error loading prices from API:', error);
            // Fallback to hardcoded prices (already in HTML)
        }
    }

    /**
     * Update pricing overview buttons (top of product page)
     */
    function updatePricingOverview() {
        if (!pricesFromSheet || !pricesFromSheet.sizes) return;

        const currentSize = getCurrentProjectSize();
        const sizeData = pricesFromSheet.sizes[currentSize];

        if (!sizeData) {
            console.warn(`No price data found for size: ${currentSize}`);
            return;
        }

        // Update overview buttons
        const overviewItems = document.querySelectorAll('.pricing-overview__item');
        overviewItems.forEach(item => {
            const tab = item.dataset.tab;
            const priceElement = item.querySelector('.pricing-overview__price');

            if (priceElement && sizeData[tab]) {
                priceElement.textContent = formatPrice(sizeData[tab]);
            }
        });

        console.log(`Updated pricing overview for ${currentSize}:`, sizeData);
    }

    /**
     * Format price
     */
    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPricesFromAPI);
    } else {
        loadPricesFromAPI();
    }
})();
