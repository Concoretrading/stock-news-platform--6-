
import axios from 'axios';

export interface FinnhubNews {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

export class FinnhubService {
    private apiKey: string;
    private baseUrl = 'https://finnhub.io/api/v1';

    constructor() {
        this.apiKey = process.env.FINNHUB_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️ FINNHUB_API_KEY NOT FOUND: FinnhubService will be limited.');
        }
    }

    /**
     * Get general market news
     */
    async getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<FinnhubNews[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/news`, {
                params: {
                    category,
                    token: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching market news from Finnhub:', error);
            return [];
        }
    }

    /**
     * Get company-specific news
     */
    async getCompanyNews(symbol: string, fromDate: string, toDate: string): Promise<FinnhubNews[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/company-news`, {
                params: {
                    symbol,
                    from: fromDate,
                    to: toDate,
                    token: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching company news for ${symbol} from Finnhub:`, error);
            return [];
        }
    }

    /**
     * Get earnings calendar surprises
     */
    async getEarningsSurprises(symbol: string): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/stock/earnings`, {
                params: {
                    symbol,
                    token: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching earnings surprises for ${symbol}:`, error);
            return null;
        }
    }
}

export const finnhubService = new FinnhubService();
