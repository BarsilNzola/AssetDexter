"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGiniCoefficient = calculateGiniCoefficient;
exports.normalizeValue = normalizeValue;
exports.calculateVolatility = calculateVolatility;
exports.generateAssetId = generateAssetId;
exports.formatRarityTier = formatRarityTier;
exports.formatRiskTier = formatRiskTier;
exports.formatAssetType = formatAssetType;
exports.formatLargeNumber = formatLargeNumber;
exports.calculateHealthScore = calculateHealthScore;
exports.calculateTrend = calculateTrend;
exports.calculateSupplyScore = calculateSupplyScore;
exports.calculateDistributionScore = calculateDistributionScore;
exports.calculateAgeScore = calculateAgeScore;
exports.calculateMarketCapScore = calculateMarketCapScore;
exports.calculateLiquidityScore = calculateLiquidityScore;
function calculateGiniCoefficient(holdings) {
    if (holdings.length === 0)
        return 0;
    const sortedHoldings = holdings.slice().sort((a, b) => a - b);
    const n = sortedHoldings.length;
    const sum = sortedHoldings.reduce((a, b) => a + b, 0);
    if (sum === 0)
        return 0;
    let numerator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (2 * (i + 1) - n - 1) * sortedHoldings[i];
    }
    return numerator / (n * sum);
}
function normalizeValue(value, min, max) {
    if (max === min)
        return 0.5;
    return (value - min) / (max - min);
}
function calculateVolatility(prices) {
    if (prices.length < 2)
        return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}
function generateAssetId(chainId, address) {
    return `${chainId}_${address.toLowerCase()}`;
}
function formatRarityTier(tier) {
    const tiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    return tiers[tier] || 'Unknown';
}
function formatRiskTier(tier) {
    const tiers = ['Low', 'Medium', 'High', 'Speculative'];
    return tiers[tier] || 'Unknown';
}
function formatAssetType(type) {
    const types = ['Tokenized Treasury', 'Real Estate', 'Art', 'Luxury Goods', 'Private Credit'];
    return types[type] || 'Unknown';
}
function formatLargeNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
}
function calculateHealthScore(rarityScore, riskScore) {
    return Math.round((rarityScore + (100 - riskScore)) / 2);
}
// AI model helper functions
function calculateTrend(data) {
    if (data.length < 2)
        return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return (last - first) / first;
}
function calculateSupplyScore(supply) {
    if (supply <= 1000)
        return 1.0;
    if (supply <= 10000)
        return 0.8;
    if (supply <= 100000)
        return 0.6;
    if (supply <= 1000000)
        return 0.4;
    return 0.2;
}
function calculateDistributionScore(giniCoefficient) {
    return 1 - giniCoefficient;
}
function calculateAgeScore(ageInDays) {
    if (ageInDays >= 365)
        return 1.0;
    if (ageInDays >= 180)
        return 0.8;
    if (ageInDays >= 90)
        return 0.6;
    if (ageInDays >= 30)
        return 0.4;
    return 0.2;
}
function calculateMarketCapScore(marketCap) {
    if (marketCap >= 1000000000)
        return 1.0;
    if (marketCap >= 100000000)
        return 0.8;
    if (marketCap >= 10000000)
        return 0.6;
    if (marketCap >= 1000000)
        return 0.4;
    return 0.2;
}
function calculateLiquidityScore(liquidity) {
    if (liquidity >= 10000000)
        return 1.0;
    if (liquidity >= 1000000)
        return 0.8;
    if (liquidity >= 100000)
        return 0.6;
    if (liquidity >= 10000)
        return 0.4;
    return 0.2;
}
//# sourceMappingURL=helpers.js.map