"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskTier = exports.RarityTier = exports.AssetType = void 0;
var AssetType;
(function (AssetType) {
    AssetType[AssetType["TOKENIZED_TREASURY"] = 0] = "TOKENIZED_TREASURY";
    AssetType[AssetType["REAL_ESTATE"] = 1] = "REAL_ESTATE";
    AssetType[AssetType["ART"] = 2] = "ART";
    AssetType[AssetType["LUXURY_GOODS"] = 3] = "LUXURY_GOODS";
    AssetType[AssetType["PRIVATE_CREDIT"] = 4] = "PRIVATE_CREDIT";
})(AssetType || (exports.AssetType = AssetType = {}));
var RarityTier;
(function (RarityTier) {
    RarityTier[RarityTier["COMMON"] = 0] = "COMMON";
    RarityTier[RarityTier["UNCOMMON"] = 1] = "UNCOMMON";
    RarityTier[RarityTier["RARE"] = 2] = "RARE";
    RarityTier[RarityTier["EPIC"] = 3] = "EPIC";
    RarityTier[RarityTier["LEGENDARY"] = 4] = "LEGENDARY";
})(RarityTier || (exports.RarityTier = RarityTier = {}));
var RiskTier;
(function (RiskTier) {
    RiskTier[RiskTier["LOW"] = 0] = "LOW";
    RiskTier[RiskTier["MEDIUM"] = 1] = "MEDIUM";
    RiskTier[RiskTier["HIGH"] = 2] = "HIGH";
    RiskTier[RiskTier["SPECULATIVE"] = 3] = "SPECULATIVE";
})(RiskTier || (exports.RiskTier = RiskTier = {}));
//# sourceMappingURL=rwa.js.map