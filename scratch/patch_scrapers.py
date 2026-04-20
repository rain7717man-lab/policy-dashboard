import re

with open('src/lib/scrapers/index.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# ── 1. 정책브리핑: 단일 URL + throw 방식 (다중 URL 루프 제거)
# 함수 본문 시작 찾기
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if 'export async function scrapeKoreaKr' in line:
        start_idx = i
    if start_idx is not None and i > start_idx and line.strip() == '}':
        end_idx = i
        break

if start_idx is not None and end_idx is not None:
    new_func = [
        'export async function scrapeKoreaKr(limit = 100): Promise<FeedItem[]> {\n',
        '  // 공식 보도자료 RSS 단일 URL 고정 (엔드포인트 추론 금지)\n',
        "  const RSS_URL = 'https://www.korea.kr/rss/pressrelease.xml';\n",
        '  console.log(`[정책브리핑] RSS 호출: ${RSS_URL}`);\n',
        '  // 에러 시 throw -> route.ts retryWithBackoff 자동 재시도\n',
        '  const res  = await axios.get(RSS_URL, {\n',
        "    headers:    { ...CHROME_HEADERS, Referer: 'https://www.korea.kr/' },\n",
        '    httpsAgent: http,\n',
        '    timeout:    20000,\n',
        '  });\n',
        '  const feed = await parser.parseString(res.data);\n',
        '  if (!feed.items?.length) {\n',
        "    console.warn('[정책브리핑] 빈 피드 - 재시도 예정');\n",
        "    throw new Error('정책브리핑 피드 비어있음');\n",
        '  }\n',
        '  console.log(`[정책브리핑] ${feed.items.length}건 수신`);\n',
        '  return feed.items\n',
        '    .map(item => ({\n',
        '      id:          `korea-${item.guid ?? item.link}`,\n',
        "      ministry:    item.title?.match(/\\[(.*?)\\]/)?.[1] ?? '대한민국 정부',\n",
        "      category:    '정책브리핑',\n",
        "      title:       (item.title ?? '').replace(/\\[.*?\\]\\s*/, '').trim(),\n",
        "      link:        item.link ?? 'https://www.korea.kr',\n",
        "      date:        toDate(item.pubDate, ''),\n",
        "      description: (item.contentSnippet ?? '').slice(0, 200),\n",
        "      source:      '정책브리핑',\n",
        '      isLocal:     false,\n',
        "      almaengi:    extractAlmaengi(item.title ?? '', item.contentSnippet ?? ''),\n",
        '    }))\n',
        '    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())\n',
        '    .slice(0, limit);\n',
        '}\n',
    ]
    lines[start_idx:end_idx+1] = new_func
    print(f'정책브리핑 패치 성공 ({start_idx}-{end_idx})')
else:
    print('정책브리핑 함수 범위 미발견')

with open('src/lib/scrapers/index.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

# ── 2. 보조금24: serviceKey URL 제거 + Authorization 헤더
with open('src/lib/scrapers/index.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# URL 교체
c = c.replace(
    'https://api.odcloud.kr/api/gov24/v1/serviceList?page=1&perPage=${limit}&returnType=JSON&serviceKey=${API_KEY}',
    'https://api.odcloud.kr/api/gov24/v1/serviceList?page=1&perPage=${limit}&returnType=JSON'
)

# headers 블록 교체 (gov24 함수 내 첫 번째 것만)
old_h = "      headers: { ...CHROME_HEADERS, Accept: 'application/json' },\n      httpsAgent: http,\n      timeout:    15000,"
new_h = "      headers: {\n        ...CHROME_HEADERS,\n        'Accept':        'application/json',\n        'Authorization': `Infuser ${API_KEY}`,  // odcloud 전용 (공백 필수)\n      },\n      httpsAgent: http,\n      timeout:    20000,"

pos = c.find('scrapeGov24')
if pos != -1:
    chunk = c[pos:pos+800]
    if old_h in chunk:
        new_chunk = chunk.replace(old_h, new_h, 1)
        c = c[:pos] + new_chunk + c[pos+800:]
        print('보조금24 headers 패치 성공')
    else:
        print('보조금24 headers 패치 실패 - 패턴 미발견')
        print(repr(chunk[200:400]))

with open('src/lib/scrapers/index.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print('모든 패치 완료')
