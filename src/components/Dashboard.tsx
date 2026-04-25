'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Copy, ExternalLink, RefreshCw, Search, Star,
  Landmark, Rocket, Building2, Apple, Sparkles,
  User, CircleDollarSign, CalendarClock, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const MASTER_PROMPT_V9 = `# 전문 정책 큐레이터 블로그 원고 작성 지침 (GEO 최적화 + 팩트 체크 V9)
당신은 "어려운 정부 정책이나 지원 사업을 일반인의 눈높이에서 알기 쉽게, 팩트 기반으로 깔끔하게 정리해 주는 전문 정책 큐레이터"입니다. 아래 규칙을 완벽하게 준수하여 원고를 작성하세요.

1. 🎯 제목 및 롱테일 키워드 전략 (SEO/GEO):
- 관공서 스타일(예: "2026년 OO시 지원금 공고 요약")은 절대 금지하며, 사람들이 네이버나 AI에 검색할 법한 '질문형/해결형' 롱테일 키워드를 사용하세요.
- [필수 조건]: 제목에 반드시 독자를 후킹할 수 있는 **'구체적인 숫자(지원 금액, 혜택 등)'**를 포함하세요.
- 위 조건을 충족하는 킬링 타이틀 딱 1개만 최상단에 큰 제목(#)으로 출력하세요.

2. 👤 톤앤매너 및 팩트 체크 (가짜 역할극 절대 금지):
- ❌ 1인칭 소설 금지: "저도 매장을 운영하지만", "제 가게 장부를 보며" 같은 가짜 배경 설정이나 억지스러운 감정이입을 절대 하지 마세요. 무지성으로 '사장님'이라고 부르는 패턴도 차단하세요.
- ✅ 담백하고 세련된 큐레이터 톤: 호들갑 떨지 말고, 해당 정책의 진짜 타겟(예: 청년, 부모, 소상공인 등)에게 필요한 팩트와 혜택만 깔끔하고 객관적으로 전달하세요. 본인이 정책을 주최하는 것처럼("저희가 지원해 드려요") 쓰지 마세요.
- 🛑 넘겨짚기 금지: 명시되지 않은 내용(기한, 조건 등)은 절대 유추하지 말고, 오직 쓰여 있는 '사실'만 보수적으로 정리하세요.

3. 🏗️ GEO 최적화 및 강제 소제목 구조 (필수):
텍스트가 한 덩어리로 길게 이어지는 것을 절대 금지하며, 아래 3가지 섹션을 반드시 포함하세요.
① ## ⏱️ 바쁜 분들을 위한 3줄 요약: 글 최상단에 배치하고 [지원 대상 / 핵심 내용 / 신청 기한]을 불릿 포인트(*)로 명확히 정리하세요.
② 강제 소제목 단락화: 본문 내용을 반드시 3~4개의 논리적인 단락으로 나누고, 각 단락이 시작될 때마다 내용의 핵심을 요약하는 **매력적인 소제목(Subheading)**을 다세요.
  * 소제목은 **'이모지 + 굵은 글씨(또는 ## 기호)'** 조합을 사용하세요. (예: "## 💡 1. 2026년, 무엇이 가장 크게 달라졌을까?")
③ ## 🙋‍♂️ 가장 많이 헷갈려하는 질문 TOP 3: 글 후반부에 배치하고, 공고문 내용 중 헷갈릴 만한 내용을 Q&A 형식으로 3개 작성하세요.

4. ✍️ 말투 및 문장 연결:
- 단조로운 '~해요.', '~어요.' 반복을 피하고, '~하고,', '~하지만,' 등 연결 어미를 적극 사용하여 문맥이 물 흐르듯 자연스럽게 이어지게 하세요.
- 마침표(.) 뒤에는 반드시 엔터를 2번 쳐서 모바일 시인성을 극대화하고, 핵심 키워드는 [강조] 표시를 하세요.

5. 🎨 시각화 자료 (분산 배치 및 애플/스타트업 감성 카피라이팅):
- 본문 분량에 따라 슬라이드 개수를 유동적으로(2~7장 등) 구성하되, 내용의 흐름이 바뀌는 문단 사이사이에 \`[🎨 카드뉴스 슬라이드 1번 삽입]\`, \`[🎨 카드뉴스 슬라이드 2번 삽입]\` 식으로 **개별 분산 배치**하세요.
- 맨 마지막에는 \`[📊 최종 요약 인포그래픽 삽입]\` 기호를 1번만 배치하세요.
- 🍏 디자인 대본 감성 (공공기관 톤 쫙 빼기): 슬라이드와 인포그래픽 텍스트는 공문서처럼 줄글로 빽빽하게 쓰지 마세요. '애플 프레젠테이션'이나 '트렌디한 IT 스타트업' 느낌으로 텍스트를 최대한 다이어트하고, 짧고 강렬한 명사형/핵심 위주로 카피를 뽑아주세요.
- 텍스트 모아보기: 원고 작성이 모두 끝난 후, 맨 마지막 줄에 '---' (작은따옴표 안의 구분선)을 긋고, 캔바(Canva)에 복사하기 쉽도록 정제된 [슬라이드별 핵심 대본]과 [인포그래픽 요약 텍스트]를 한곳에 모아서 출력하세요.
`;



function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

type Almaengi = { target: string; budget: string; deadline: string };
type FeedItem = {
  id: string; ministry: string; category: string;
  title: string; link: string; date: string; description: string;
  source?: string; isLocal?: boolean; almaengi?: Almaengi;
};
type SourceState = { items: FeedItem[]; loading: boolean; fetched: boolean; error: string | null };
type DataStore = Record<string, SourceState>;

const SOURCE_IDS = ['정책브리핑', 'K-Startup', '보조금24', '중기부/소진공', '경기/화성비즈', '로컬(화성/경기)'];

const TABS = [
  { id: '알맹이', label: '✨ 상세/신청(알맹이)', icon: Sparkles, color: 'text-indigo-600' },
  { id: '정책브리핑', label: '🏛️ 정책브리핑', icon: Landmark, color: 'text-blue-600' },
  { id: 'K-Startup', label: '🚀 K-Startup', icon: Rocket, color: 'text-orange-600' },
  { id: '보조금24', label: '🛡️ 보조금24', icon: ShieldCheck, color: 'text-emerald-600' },
  { id: '중기부/소진공', label: '🏢 중기부/소진공', icon: Building2, color: 'text-purple-600' },
  { id: '경기/화성비즈', label: '🍎 경기/화성비즈', icon: Apple, color: 'text-red-600' },
  { id: '로컬(화성/경기)', label: '📍 로컬(화성/경기)', icon: Landmark, color: 'text-cyan-600' },
];

const mkInitial = (): DataStore =>
  Object.fromEntries(SOURCE_IDS.map(id => [id, { items: [], loading: false, fetched: false, error: null }]));

const decodeHtml = (str: string) => {
  if (!str) return '';
  return str
    .replace(/<[^>]*>?/gm, '') // HTML 태그 완벽 제거
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&#183;/g, '·')
    .replace(/&nbsp;/g, ' ');
};

const filterTitle = (title: string) => {
  if (!title) return '';
  return title
    .replace(/\[\s*보도자료\s*\]/g, '')
    .replace(/국무총리\s*주재/g, '')
    .replace(/장관/g, '')
    .replace(/차관/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const filterDescription = (str: string) => {
  if (!str) return '';

  // 1단계: 명시적인 찌꺼기 블록(괄호 등)을 텍스트 전체에서 먼저 정규식으로 도려냄
  let cleanedStr = str.replace(/[【\[(](일시|장소|관련 국정과제|국정과제|참고|보도자료|문의|안내|기타).*?[】\])]/g, '');

  const kws = ['국무총리', '장관', '차관', '주재', '개최', '보도자료', '양성평등위원회', '비상경제본부'];

  // 2단계: 문장 단위 필터링
  const resultLines = cleanedStr.split('\n').map(line => {
    return line.split('. ')
      .filter(sentence => {
        if (kws.some(kw => sentence.includes(kw))) return false;
        const trimmed = sentence.trim();
        if (trimmed.length < 5) return false;
        if (trimmed.match(/(?:은|는|이|가|을|를|과|와|로|으로|에|에서|의|며|고|며,|고,|통해|대해|위해)$/)) return false;
        return true;
      })
      .join('. ');
  }).filter(line => line.trim().length > 0);

  const finalResult = resultLines.join('\n').trim();

  // 3단계: 너무 빡빡하게 필터링되어 내용이 텅 비게 되었을 경우 안전망 (Fallback)
  if (finalResult.length === 0) {
    // 원본에서 최소한의 정보(첫 문장)라도 반드시 반환
    const originalFirstSentence = str.split(/[.\n]/).find(s => s.trim().length > 5) || str.slice(0, 50);
    const fallback = originalFirstSentence.trim();
    return fallback + (fallback.endsWith('.') ? '' : '.');
  }

  return finalResult;
};

export default function Dashboard() {
  const [dataStore, setDataStore] = useState<DataStore>(mkInitial());
  const [activeTab, setActiveTab] = useState('알맹이');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  // ── fetchingRef: 무한 재호출 방지 (useCallback의 dataStore 의존성 제거)
  const fetchingRef = useRef<Set<string>>(new Set());

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        showToast('알맹이 탭에서 찜을 해제했습니다.');
      } else {
        newSet.add(id);
        showToast('✨ 알맹이 탭에 카드를 꽂았습니다!');
      }
      localStorage.setItem('pinnedItems', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, [showToast]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pinnedItems');
      if (saved) setPinnedIds(new Set(JSON.parse(saved)));
    } catch (e) { }
  }, []);

  // ── 핵심 fetch 함수 — finally에서 반드시 loading=false 보장
  const fetchSource = useCallback(async (sourceId: string, force = false) => {
    // 이미 요청 중이면 스킵
    if (fetchingRef.current.has(sourceId)) return;

    setDataStore(prev => {
      // 이미 fetched이고 강제 갱신이 아니면 skip
      if (!force && prev[sourceId]?.fetched) return prev;
      return { ...prev, [sourceId]: { ...prev[sourceId], loading: true, error: null } };
    });

    // fetched 여부를 직접 확인 (클로저 stale 방지)
    const snapshot = await new Promise<DataStore>(resolve => {
      setDataStore(s => { resolve(s); return s; });
    });
    if (!force && snapshot[sourceId]?.fetched) return;
    if (fetchingRef.current.has(sourceId)) return;

    fetchingRef.current.add(sourceId);
    if (force) showToast(`🔃 ${sourceId} 데이터 수집 중…`);

    try {
      const res = await fetch(`/api/data?source=${encodeURIComponent(sourceId)}&t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();

      if (json.success) {
        const items: FeedItem[] = json.data ?? [];
        const errMsg = items.length === 0 ? '데이터를 불러올 수 없습니다 (보안 차단 또는 공고 없음)' : null;
        setDataStore(prev => ({ ...prev, [sourceId]: { items, fetched: true, loading: false, error: errMsg } }));
        if (force && items.length > 0) showToast(`✅ ${sourceId} ${items.length}건 수집!`);
      } else {
        setDataStore(prev => ({
          ...prev,
          [sourceId]: { ...prev[sourceId], fetched: true, loading: false, error: json.message ?? '데이터를 불러올 수 없습니다 (서버 에러)' },
        }));
      }
    } catch (e: any) {
      setDataStore(prev => ({
        ...prev,
        [sourceId]: { ...prev[sourceId], fetched: true, loading: false, error: '서버 연결 실패' },
      }));
    } finally {
      // 무한 로딩 절대 방지 — finally는 try/catch 결과와 무관하게 항상 실행
      setDataStore(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], loading: false } }));
      fetchingRef.current.delete(sourceId);
    }
  }, [showToast]); // dataStore 의존성 제거 → 재호출 루프 차단

  // 최초 접속 시 전체 소스 병렬 Fetch
  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([
        fetchSource('정책브리핑'),
        fetchSource('K-Startup'),
        fetchSource('보조금24'),
        fetchSource('중기부/소진공'),
        fetchSource('경기/화성비즈'),
        fetchSource('로컬(화성/경기)')
      ]);
    };
    fetchAll();
  }, [fetchSource]);

  // 탭 전환 시 해당 탭 레이지 로딩 (알맹이 탭은 별도 fetch 불필요)
  useEffect(() => {
    if (activeTab !== '알맹이') fetchSource(activeTab);
  }, [activeTab, fetchSource]);

  const copySpecificPrompt = useCallback((item: FeedItem) => {
    let promptText = MASTER_PROMPT_V9;

    if (item.category !== '정책브리핑') {
      const customPoints: Record<string, string> = {
        '보조금24': "지원 자격 요건을 일반인이 알기 쉽게 풀어서 설명하고, 어디서(어느 사이트/앱) 신청하는지 구체적인 경로를 강조해 줘.",
        '중기부/소진공': "바쁜 1인 기업 대표님들을 위해 지원 규모(지원 금액)와 필수 제출 서류 목록을 깔끔한 리스트로 한 번 더 요약해 줘.",
        'K-Startup': "자금 지원 외에 공간 제공이나 교육 등 부가 혜택이 있다면 돋보이게 쓰고, 서류 심사 시 가점(우대) 요건을 '합격 꿀팁'처럼 강조해 줘.",
        '경기/화성비즈': "지역 특화 사업이므로 '거주지 요건'이나 '사업장 소재지 기준(화성/경기)'을 글 상단에 눈에 띄게 배치하고, 오프라인 접수처를 명확히 적어줘.",
        '로컬(화성/경기)': "시청/도청의 직접 공고이므로 '화성시민/경기도민' 대상임을 명확히 하고, 해당 지자체 거주자에게만 주어지는 특별한 혜택이나 가점 사항을 최우선적으로 강조해 줘."
      };

      const targetKey = ['보조금24', '중기부/소진공', 'K-Startup', '경기/화성비즈', '로컬(화성/경기)'].find(k => item.category.includes(k) || (item.source && item.source.includes(k))) || '보조금24';
      const dynamicPoint = customPoints[targetKey];

      promptText += `\n\n7. [출처별 특화 미션](위 요약 4번 항목 '놓치기 쉬운 꿀팁' 및 본문에 필수 반영): \n - ${dynamicPoint} `;
    }

    navigator.clipboard.writeText(promptText)
      .then(() => showToast('🤖 맞춤형 원고 작성 프롬프트 복사 완료!'));
  }, [showToast]);

  // ── 필터링 + 정렬 (메모이제이션)
  const filteredItems = useMemo(() => {
    const EXCLUDE_MINISTRIES = [
      '해양수산부', '농림축산식품부', '농촌진흥청', '산림청',
      '통일부', '국방부', '병무청', '방위사업청',
      '우주항공청', '원자력안전위원회', '통계청', '인사혁신처'
    ];
    const EXCLUDE_KEYWORDS = ['어선', '귀어', '어업', '양식', '농기계', '농업'];

    const isExcluded = (item: FeedItem) => {
      const ministry = item.ministry || '';
      if (EXCLUDE_MINISTRIES.some(kw => ministry.includes(kw))) return true;

      const fullText = (item.title || '') + ' ' + (item.description || '');
      return EXCLUDE_KEYWORDS.some(kw => fullText.includes(kw));
    };

    let result: FeedItem[];
    if (activeTab === '알맹이') {
      const allItems = Object.values(dataStore).flatMap(s => s.items);
      const uniqueItems = Array.from(new Map(allItems.map(i => [i.id, i])).values());
      result = uniqueItems
        .filter(i => !isExcluded(i) && (pinnedIds.has(i.id) || (i.almaengi && i.almaengi.budget !== '상세참조' && i.almaengi.deadline !== '공고확인')))
        .sort((a, b) => {
          const aPinned = pinnedIds.has(a.id);
          const bPinned = pinnedIds.has(b.id);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, 200);
    } else {
      result = [...(dataStore[activeTab]?.items ?? [])]
        .filter(i => !isExcluded(i))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.ministry.toLowerCase().includes(q),
    );
  }, [dataStore, activeTab, searchQuery, pinnedIds]);

  const isLoading = dataStore[activeTab]?.loading ?? false;
  const currentError = activeTab !== '알맹이' ? (dataStore[activeTab]?.error ?? null) : null;

  // ────────────────────── RENDER ──────────────────────
  return (
    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

      {/* ── 헤더 */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            공식 정책 실시간 모니터링
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            서버사이드 프록시 + 헤더 스푸핑 기반 WAF 우회 (v6)
          </p>
        </div>
        {activeTab !== '알맹이' && (
          <button
            onClick={() => fetchSource(activeTab, true)}
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-50 shadow-lg"
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            {isLoading ? '수집 중…' : `${activeTab} 재수집`}
          </button>
        )}
      </div>

      {/* ── 탭 */}
      <div className="flex flex-wrap justify-start gap-2 pb-3 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isAct = activeTab === tab.id;
          const st = dataStore[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-5 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-black border-2 transition-all',
                isAct
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-300',
              )}
            >
              <Icon className={cn('w-4 h-4', isAct ? '' : tab.color)} />
              {tab.label}
              {/* 상태 인디케이터 */}
              {st?.fetched && !isAct && (
                <span className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                  st.error ? 'bg-red-500' : 'bg-emerald-500',
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── 검색 */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`${activeTab} 검색…`}
          className="w-full pl-14 pr-5 py-4 rounded-3xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-base font-bold shadow-sm transition-all"
        />
      </div>

      {/* ── 컨텐츠 영역 */}
      {isLoading ? (
        // 스켈레톤
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 rounded-[2.5rem] border-2 border-gray-50 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : currentError ? (
        // 에러 UI (무한 로딩 대신 명확한 에러 표시)
        <div className="flex flex-col items-center gap-5 py-28 bg-red-50 dark:bg-red-900/10 rounded-[3rem] border-2 border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-xl font-black text-red-700 dark:text-red-400 text-center px-4">{currentError}</h2>
          <p className="text-sm text-gray-500 max-w-sm text-center font-medium">
            정부 사이트의 보안 정책(WAF)으로 인해 일시적으로 차단되었을 수 있습니다.
            잠시 후 재시도하거나 다른 탭을 이용해 주세요.
          </p>
          <button
            onClick={() => fetchSource(activeTab, true)}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all active:scale-95"
          >
            지금 다시 시도
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-28 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-400 font-black text-xl">수집된 데이터가 없습니다.</p>
          <button onClick={() => fetchSource(activeTab, true)} className="text-sm text-indigo-500 font-bold underline">강제 재수집 시도</button>
        </div>
      ) : (
        // 카드 그리드
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {filteredItems.map(item => {
            const cleanTitle = filterTitle(decodeHtml(item.title));
            const rawDesc = decodeHtml(item.description);
            const cleanDesc = filterDescription(rawDesc).trim();
            const tagList = Array.from(new Set([
              '정부지원사업',
              item.ministry ? item.ministry.replace(/\s+/g, '') : '',
              activeTab === 'K-Startup' ? 'K_Startup' : '',
              (item.almaengi?.budget && item.almaengi.budget !== '상세확인') ? '지원금' : '정부정책'
            ])).filter(Boolean);

            return (
              <article
                key={item.id}
                className={cn(
                  "group flex flex-col rounded-[2.5rem] p-7 border-2 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden",
                  pinnedIds.has(item.id)
                    ? "bg-amber-50/40 dark:bg-amber-900/10 border-amber-200 hover:border-amber-400 dark:border-amber-800/60 dark:hover:border-amber-700"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                )}
              >
                {/* 상단 메타 */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full w-max">
                      {item.ministry}
                    </span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-900/30 px-3 py-1.5 rounded-lg w-max">
                      {item.date}
                    </span>
                  </div>

                  {/* 찜하기(Pin) 토글 버튼 */}
                  <button
                    onClick={() => togglePin(item.id)}
                    className={cn(
                      "px-3 py-1.5 md:py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 border-2 select-none",
                      pinnedIds.has(item.id)
                        ? "bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-400"
                        : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
                    )}
                    title="필터링을 무시하고 알맹이 탭 최상단에 고정합니다."
                  >
                    <Star className={cn("w-4 h-4", pinnedIds.has(item.id) && "fill-current")} />
                    <span className="text-xs font-bold hidden sm:inline whitespace-nowrap">{pinnedIds.has(item.id) ? '찜 해제' : '알맹이에 꽂기'}</span>
                  </button>
                </div>

                {/* 제목 */}
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-5 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors min-h-[3rem]" title={cleanTitle}>
                  {cleanTitle}
                </h3>

                {/* 상세/신청(알맹이) 수직 영역 */}
                <div className="flex flex-col gap-4 mb-6 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-sm flex-grow">

                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white mb-1">[📝 주요내용]</h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3" title={cleanDesc}>
                      {cleanDesc || '상세 공고문 참조'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-1">[🎯 지원대상]</h4>
                    <p className="text-gray-800 dark:text-gray-200 font-medium line-clamp-2">
                      {item.almaengi?.target && item.almaengi.target !== '해당기업' ? item.almaengi.target : '전체 (세부조건 공고확인)'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-emerald-600 dark:text-emerald-400 mb-1">[💰 지원내용]</h4>
                    <p className="text-emerald-700 dark:text-emerald-400 font-black">
                      {item.almaengi?.budget && item.almaengi.budget !== '상세참조' ? item.almaengi.budget : '상세확인'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-orange-600 dark:text-orange-400 mb-1">[🚀 신청방법]</h4>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      {item.almaengi?.deadline && item.almaengi.deadline !== '공고확인' ? `${item.almaengi.deadline} 까지 온 / 오프라인 신청` : '공식 사이트 참조'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-purple-600 dark:text-purple-400 mb-1">[📞 접수/문의]</h4>
                    <p className="text-gray-600 dark:text-gray-400 font-medium tracking-tight line-clamp-1">
                      {item.ministry || '소관기관 문의처 참조'}
                    </p>
                  </div>

                </div>

                {/* 하단 영역 (태그 + 버튼) */}
                <div className="mt-auto flex flex-col gap-4">
                  {/* 해시태그 */}
                  <div className="flex flex-wrap gap-1.5">
                    {tagList.map(tag => (
                      <span key={tag} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 버튼 */}
                  <div className="space-y-2.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.link).then(() => showToast('🔗 원본 링크가 복사되었습니다!'));
                      }}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg"
                    >
                      <Copy className="w-4 h-4" /> 🔗 공식 링크 복사
                    </button>
                    <button
                      onClick={() => copySpecificPrompt(item)}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg"
                    >
                      <Copy className="w-4 h-4" /> 🤖 원고 작성 프롬프트 복사
                    </button>
                    <button
                      onClick={() => window.open(item.link, '_blank')}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700/30 text-gray-500 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> 공식기관 원문 보기
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Toast */}
      <div className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-[2rem] bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm shadow-2xl whitespace-nowrap transition-all duration-300',
        toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none',
      )}>
        {toast.msg}
      </div>
    </div>
  );
}
