import { MarketPredictionInput } from '../../types/analysis';
import { calculateVolatility } from '../../utils/helper';

export class MarketPredictor {
  predictMarketMovement(input: MarketPredictionInput): { 
    direction: string; 
    confidence: number;
    factors: string[];
  } {
    const {
      priceHistory,
      volume,
      yieldChanges,
      marketCap,
      sentiment
    } = input;

    if (priceHistory.length < 5) {
      return {
        direction: 'Neutral',
        confidence: 0.5,
        factors: ['Insufficient data for prediction']
      };
    }

    // Calculate technical indicators
    const recentTrend = this.calculateTrend(priceHistory.slice(-5));
    const volatility = calculateVolatility(priceHistory);
    const volumeTrend = this.calculateTrend(volume.slice(-5));
    const yieldTrend = yieldChanges.length > 0 ? this.calculateTrend(yieldChanges.slice(-3)) : 0;

    // Combine factors
    let score = 0;
    const factors: string[] = [];

    // Price trend (40% weight)
    if (recentTrend > 0.02) {
      score += 0.4;
      factors.push('Positive price momentum');
    } else if (recentTrend < -0.02) {
      score += 0;
      factors.push('Negative price momentum');
    } else {
      score += 0.2;
      factors.push('Sideways price movement');
    }

    // Volume trend (20% weight)
    if (volumeTrend > 0.1) {
      score += 0.2;
      factors.push('Increasing volume');
    } else if (volumeTrend < -0.1) {
      score += 0;
      factors.push('Decreasing volume');
    } else {
      score += 0.1;
    }

    // Yield changes (20% weight)
    if (yieldTrend > 0) {
      score += 0.2;
      factors.push('Improving yields');
    } else if (yieldTrend < 0) {
      score += 0;
      factors.push('Declining yields');
    } else {
      score += 0.1;
    }

    // Sentiment (20% weight)
    score += sentiment * 0.2;
    if (sentiment > 0.6) {
      factors.push('Positive market sentiment');
    } else if (sentiment < 0.4) {
      factors.push('Negative market sentiment');
    }

    // Determine direction and confidence
    let direction: string;
    let confidence: number;

    if (score > 0.6) {
      direction = 'Bullish';
      confidence = score;
    } else if (score < 0.4) {
      direction = 'Bearish';
      confidence = 1 - score;
    } else {
      direction = 'Neutral';
      confidence = 0.5;
    }

    return {
      direction,
      confidence: Math.round(confidence * 100),
      factors
    };
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const first = data[0];
    const last = data[data.length - 1];
    
    return (last - first) / first;
  }
}