import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 모든 수집 로직이 api/rss로 통합되었습니다.
  // 중복 수집 및 성능 저하를 방지하기 위해 빈 데이터 또는 리다이렉션 응답을 반환합니다.
  return NextResponse.json({ success: true, count: 0, data: [] });
}
