/**
 * Google Sheets Price Sync API
 * Fetches current prices from Google Sheets
 */

import { google } from 'googleapis';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let priceCache = null;
let cacheTimestamp = 0;

// Google Sheets configuration
const SPREADSHEET_ID = '14e6UAfwxsYUmkkG9r_DxR2psGmpy3r8mAr9N_DSAB9c';
const SHEET_NAME = 'Лист1'; // Change if needed
const RANGE = 'A3:D13'; // Headers + data rows

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check cache
        const now = Date.now();
        if (priceCache && (now - cacheTimestamp) < CACHE_DURATION) {
            console.log('Returning cached prices');
            return res.status(200).json({
                success: true,
                cached: true,
                data: priceCache,
                timestamp: cacheTimestamp
            });
        }

        // Get credentials from environment
        const credentials = getCredentials();
        if (!credentials) {
            console.error('Missing Google Sheets credentials');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Google Sheets credentials not configured'
            });
        }

        // Fetch from Google Sheets
        const prices = await fetchPricesFromSheet(credentials);

        // Update cache
        priceCache = prices;
        cacheTimestamp = now;

        return res.status(200).json({
            success: true,
            cached: false,
            data: prices,
            timestamp: cacheTimestamp
        });

    } catch (error) {
        console.error('Error fetching prices:', error);

        // Return cached data if available, even if expired
        if (priceCache) {
            console.log('Returning stale cache due to error');
            return res.status(200).json({
                success: true,
                cached: true,
                stale: true,
                data: priceCache,
                timestamp: cacheTimestamp
            });
        }

        return res.status(500).json({
            error: 'Failed to fetch prices',
            message: error.message
        });
    }
}

/**
 * Get Google credentials from environment
 */
function getCredentials() {
    const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID } = process.env;

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        return null;
    }

    return {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: GOOGLE_PROJECT_ID || 'sparom-450109'
    };
}

/**
 * Fetch prices from Google Sheets
 */
async function fetchPricesFromSheet(credentials) {
    // Create auth client
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch data
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${RANGE}`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
        throw new Error('No data found in spreadsheet');
    }

    // Parse the data
    const prices = parsePriceData(rows);
    return prices;
}

/**
 * Parse price data from sheet rows
 * Expected format:
 * Row 0: Headers (Размер бани, Базовая, Комфорт, Максимум)
 * Row 1-10: Data rows
 */
function parsePriceData(rows) {
    // Skip header row (index 0)
    const dataRows = rows.slice(1);

    const sizes = {};
    const packages = {
        base: {},
        comfort: {},
        max: {}
    };

    dataRows.forEach(row => {
        if (row.length < 4) return; // Skip incomplete rows

        const sizeText = row[0]; // e.g., "2,3X3 целиковая"
        const basePrice = parsePrice(row[1]);
        const comfortPrice = parsePrice(row[2]);
        const maxPrice = parsePrice(row[3]);

        // Extract size key (e.g., "2-3x3", "2-3x6-krylco")
        const sizeKey = extractSizeKey(sizeText);
        if (!sizeKey) return;

        // Store prices
        sizes[sizeKey] = {
            name: sizeText,
            base: basePrice,
            comfort: comfortPrice,
            max: maxPrice
        };

        packages.base[sizeKey] = basePrice;
        packages.comfort[sizeKey] = comfortPrice;
        packages.max[sizeKey] = maxPrice;
    });

    return {
        sizes,
        packages
    };
}

/**
 * Extract size key from Russian text
 * Examples:
 *   "2,3X3 целиковая" -> "2-3x3"
 *   "2,3X4 целиковая" -> "2-3x4"
 *   "2,3X5 с крылечком" -> "2-3x5-krylco"
 *   "2,3X6 целиковая" -> "2-3x6"
 *   "2,3X6 с крылечком" -> "2-3x6-krylco"
 */
function extractSizeKey(text) {
    if (!text) return null;

    // Match pattern like "2,3X3", "2,3X4", etc.
    const match = text.match(/2[,.]3[xX×](\d+)/);
    if (!match) return null;

    const length = match[1];
    let key = `2-3x${length}`;

    // Check if it has крылечко (porch)
    if (text.includes('крылечк') || text.includes('крыльц')) {
        key += '-krylco';
    }

    return key;
}

/**
 * Parse price from string or number
 */
function parsePrice(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Remove spaces and parse
        const cleaned = value.replace(/\s/g, '');
        return parseInt(cleaned, 10) || 0;
    }
    return 0;
}
