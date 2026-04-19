import { NextRequest, NextResponse } from 'next/server';
import { 
    scrapeKoreaKr, 
    scrapeKStartup, 
    scrapeGov24, 
    scrapeMSS, 
    scrapeGyeonggi, 
    withRetry 
} from '@/lib/scrapers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const limit = 100;

    console.log(`[API] Fetching source: ${source}, Target: ${limit}`);

    try {
        let data: any[] = [];

        switch (source) {
            case '정책브리핑':
                data = await withRetry(() => scrapeKoreaKr(limit));
                break;
            case 'K-Startup':
                data = await withRetry(() => scrapeKStartup(limit));
                break;
            case '보조금24':
                data = await withRetry(() => scrapeGov24(limit));
                break;
            case '중기부/소진공':
                data = await withRetry(() => scrapeMSS(limit));
                break;
            case '경기/화성비즈':
                data = await withRetry(() => scrapeGyeonggi(limit));
                break;
            default:
                return NextResponse.json({ success: false, message: 'Invalid source' }, { status: 400 });
        }

        console.log(`[API] Success: ${source}, Total Count: ${data.length}`);
        return NextResponse.json({ success: true, count: data.length, data });
    } catch (error: any) {
        console.error(`[API] Error for ${source}:`, error.message || error);
        return NextResponse.json({ success: false, data: [], message: error.message || 'Unknown error' });
    }
}
