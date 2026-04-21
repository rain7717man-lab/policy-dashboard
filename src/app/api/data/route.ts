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
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const limit = 100;
    const fetchLimit = 500; // 더 넓은 풀에서 데이터를 가져와서 필터링 (특히 보조금24 등에서 많이 깎여나가는 것 방지)

    console.log(`[API] Fetching source: ${source}, target return: ${limit}, fetchLimit: ${fetchLimit}`);

    try {
        let data: any[] = [];

        switch (source) {
            case '정책브리핑':
                data = await withRetry(() => scrapeKoreaKr(fetchLimit));
                break;
            case 'K-Startup':
                data = await withRetry(() => scrapeKStartup(fetchLimit));
                break;
            case '보조금24':
                data = await withRetry(() => scrapeGov24(fetchLimit));
                break;
            case '중기부/소진공':
                data = await withRetry(() => scrapeMSS(fetchLimit));
                break;
            case '경기/화성비즈':
                data = await withRetry(() => scrapeGyeonggi(fetchLimit));
                break;
            default:
                return NextResponse.json({ success: false, message: 'Invalid source' }, { status: 400 });
        }

        // [핵심 키워드 리스트]
        const TARGET_KEYWORDS = ['소상공인', '1인기업', '창업', '마케팅', '디지털', '육아', '아동', '생활안정', '교육비', '바우처'];
        
        // [우선 제외 (Exclude) 리스트]
        const EXCLUDE_KEYWORDS = ['어선', '양식', '농업', '해양', '귀농', '축산'];

        // 필터링 적용
        const filteredData = data.filter(item => {
            const title = item.title || '';
            const desc = item.description || '';
            
            // 🚨 1. 중요: 제목에 제외 키워드가 포함되어 있으면 즉시 완전 제외
            if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) {
                return false; // 제외
            }

            // 2. 제목이나 내용에 핵심 키워드가 하나라도 포함되어 있는지 확인
            const fullText = title + ' ' + desc;
            return TARGET_KEYWORDS.some(kw => fullText.includes(kw));
        }).slice(0, limit); // 최종적으로 100개까지만 리턴

        console.log(`[API] Success: ${source}, Fetched: ${data.length}, After Filter: ${filteredData.length}`);
        return NextResponse.json({ success: true, count: filteredData.length, data: filteredData });
    } catch (error: any) {
        console.error(`[API] Error for ${source}:`, error.message || error);
        return NextResponse.json({ success: false, data: [], message: error.message || 'Unknown error' });
    }
}
