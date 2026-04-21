'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Copy, ExternalLink, RefreshCw, Search, Star,
  Landmark, Rocket, Building2, Apple, Sparkles,
  User, CircleDollarSign, CalendarClock, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const MASTER_PROMPT_V4 = `# 전문 정책 큐레이터 블로그 작성 지침 (수석 에디터 X 찐-블로거: 하이엔드 에디션 v4.3 철수와 영희 감성)
당신은 네이버 홈판 상위 노출 전문 작가이자, 팩트에 엄격한 수석 에디터입니다. 아래 규칙을 미친 듯이 준수하여 원고를 작성하세요.

1. 제목 및 썸네일 전략 (SEO/GEO):
- 제목: 메인 키워드를 전면에 배치하되, 독자가 받을 수 있는 '구체적인 숫자(최대 지원 금액 등)'를 반드시 포함하여 호기심을 자극하는 25자 이내 킬링 타이틀 딱 1개 생성.
- 🎨 추천 썸네일 배경 이미지: 생성된 '제목'의 핵심 오브젝트나 상황을 가장 극적으로 묘사하는 이미지 프롬프트를 원고 최상단에 배치하세요. (텍스트는 절대 넣지 말 것)

2. 말투 및 가독성 (모바일 최적화):
- ~니다/습니다 금지: 문장의 80% 이상을 "~해요", "~죠", "~네요", "~더라고요" 등 부드러운 해요체로 작성하세요. 같은 어미를 3번 이상 연속 사용하지 마세요.
- 문장 구조: 한 문장은 무조건 짧게! 마침표(.) 뒤에는 반드시 엔터를 2번 쳐서 모바일 시인성을 극대화하세요. 핵심 키워드는 [강조] 표시를 합니다.

3. 원고 구성 가이드 (출처별 미션 처리 주의):
- 서론(Hook): 인사말 생략. 타겟 독자의 현실적인 고민이나 혜택을 놓쳤을 때의 아쉬움을 찌르며 3줄 이내로 강렬하게 시작.
- [💡 오늘 정책 핵심 요약]: 도입부 직후 배치. 아래 항목을 번호(1~4)로 명확히 정리하세요.
  1) 이 지원사업의 핵심 혜택 (무엇을/얼마를 주는지)
  2) 정확한 지원 대상 (누가 받을 수 있는지)
  3) 신청 방법 및 마감일
  4) 놓치기 쉬운 꿀팁: (하단 '7. 출처별 특화 미션' 내용을 독자 관점에서 자연스럽게 1줄로 요약. 단, '출처별 특화 강조 포인트' 같은 시스템 지시어는 본문에 절대 노출하지 말 것)
- [📊 한눈에 비교하는 핵심 포인트]: 제공된 문서 내의 비교 정보(국산vs수입, 전vs후, 사립vs국공립 등)를 추출하여 표를 그리지 말고, **'비교 리스트(체크리스트 형식)'**로 깔끔하게 텍스트로만 나열해 주세요. (하단 캡션은 무조건 "※ 공식 공고문을 바탕으로 요약한 비교 내용입니다." 로 통일. AI 이름 절대 언급 금지)

4. 팩트 가이드 (매우 보수적 원칙 적용):
- 넘겨짚기 및 유추 절대 금지: 문서에 명시되지 않은 연도 기준, 신청 기한, 기관 명칭 등을 AI가 임의로 생성하거나 유추하지 마세요. 오직 제공된 소스에 쓰여 있는 '팩트'만 보수적으로 기록하세요.
- 필수 정보 확인: 문서 내에 '지급 방식(현금/바우처 등)' 및 '필요 서류'가 명시되어 있다면 반드시 본문에 포함하세요. 
- 전문용어 세탁: 어려운 용어는 "쉽게 말해~" 식으로 풀되, 정확한 수치와 인과관계를 명확히 설명하세요.

5. 이미지 생성 지침 (구글 ImageFX 전용 - 1970년대 빈티지 교과서 철수와 영희 스타일):
- 인물 및 배경 설정: 프롬프트에 특별한 언급이 없는 한, 무조건 '한국인(Korean)' 인물과 '한국의 일상/비즈니스 환경(Korean environment)'을 기본으로 묘사하세요.
- 이미지 스타일: 무조건 1970년대 한국 초등학교 교과서 속 정겨운 수채화 및 색연필 삽화 스타일(김태형 화백의 '철수와 영희' 스타일)로 고정하세요. 맑은 수채화 채색, 뚜렷하지만 부드러운 검은 펜 외곽선, 선하고 해맑은 인물 표정을 특징으로 합니다.
- 무결성: 이미지 내에 글자, 숫자, 기호 등 어떠한 텍스트도 포함되지 않아야 합니다. (NO TEXT, NO LETTERS, NO WORDS)
- 배치: 원고 상단(썸네일용) 1개, 본문 중간(상세 묘사) 2개를 각각 생성하세요.
- 형식: [📸 사진 가이드: 상세 설명 / ImageFX Prompt: {영문} / Ratio: {3:4 또는 1:1}]
- 영문 필수 문구 (철수와 영희 전용): "A charming watercolor and colored pencil sketch in 1970s Korean retro textbook illustration style, vintage colors, soft aquarelle washes, detailed pencil outlines, nostalgic children's book quality, visible paper grain, soft lighting, heartwarming and innocent, professional artistic style, NO TEXT, NO LETTERS, NO WORDS"

6. 해시태그 및 마무리 (CTA 금지):
- 글 말미에 검색 노출을 위한 관련 해시태그 5개를 작성하세요. (예: #지원사업명 #주관기관 등)
- 억지스러운 공유 유도, 좋아요 요청 등 광고성 콜투액션(CTA)은 신뢰도를 떨어뜨리므로 절대 포함하지 마세요.`;

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

type Almaengi = { target: string; budget: string; deadline: string };
type FeedItem  = {
  id: string; ministry: string; category: string;
  title: string; link: string; date: string; description: string;
  source?: string; isLocal?: boolean; almaengi?: Almaengi;
};
type SourceState = { items: FeedItem[]; loading: boolean; fetched: boolean; error: string | null };
type DataStore   = Record<string, SourceState>;

const SOURCE_IDS = ['정책브리핑', 'K-Startup', '보조금24', '중기부/소진공', '경기/화성비즈'];

const TABS = [
  { id: '알맹이',     label: '✨ 상세/신청(알맹이)', icon: Sparkles,  color: 'text-indigo-600' },
  { id: '정책브리핑',  label: '🏛️ 정책브리핑',   icon: Landmark,   color: 'text-blue-600' },
  { id: 'K-Startup',  label: '🚀 K-Startup',   icon: Rocket,     color: 'text-orange-600' },
  { id: '보조금24',    label: '🛡️ 보조금24',     icon: ShieldCheck, color: 'text-emerald-600' },
  { id: '중기부/소진공', label: '🏢 중기부/소진공', icon: Building2,  color: 'text-purple-600' },
  { id: '경기/화성비즈', label: '🍎 경기/화성비즈', icon: Apple,      color: 'text-red-600' },
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
    } catch(e) {}
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
      const res  = await fetch(`/api/data?source=${encodeURIComponent(sourceId)}&t=${Date.now()}`, { cache: 'no-store' });
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
        fetchSource('경기/화성비즈')
      ]);
    };
    fetchAll();
  }, [fetchSource]);

  // 탭 전환 시 해당 탭 레이지 로딩 (알맹이 탭은 별도 fetch 불필요)
  useEffect(() => {
    if (activeTab !== '알맹이') fetchSource(activeTab);
  }, [activeTab, fetchSource]);

  const copySpecificPrompt = useCallback((item: FeedItem) => {
    let promptText = MASTER_PROMPT_V4;

    if (item.category !== '정책브리핑') {
      const customPoints: Record<string, string> = {
        '보조금24': "지원 자격 요건을 일반인이 알기 쉽게 풀어서 설명하고, 어디서(어느 사이트/앱) 신청하는지 구체적인 경로를 강조해 줘.",
        '중기부/소진공': "바쁜 1인 기업 대표님들을 위해 지원 규모(지원 금액)와 필수 제출 서류 목록을 깔끔한 리스트로 한 번 더 요약해 줘.",
        'K-Startup': "자금 지원 외에 공간 제공이나 교육 등 부가 혜택이 있다면 돋보이게 쓰고, 서류 심사 시 가점(우대) 요건을 '합격 꿀팁'처럼 강조해 줘.",
        '경기/화성비즈': "지역 특화 사업이므로 '거주지 요건'이나 '사업장 소재지 기준(화성/경기)'을 글 상단에 눈에 띄게 배치하고, 오프라인 접수처를 명확히 적어줘."
      };

      const targetKey = ['보조금24', '중기부/소진공', 'K-Startup', '경기/화성비즈'].find(k => item.category.includes(k) || (item.source && item.source.includes(k))) || '보조금24';
      const dynamicPoint = customPoints[targetKey];

      promptText += `\n\n7. [출처별 특화 미션] (위 요약 4번 항목 '놓치기 쉬운 꿀팁' 및 본문에 필수 반영):\n- ${dynamicPoint}`;
    }

    navigator.clipboard.writeText(promptText)
      .then(() => showToast('🤖 맞춤형 원고 작성 프롬프트 복사 완료!'));
  }, [showToast]);

  // ── 필터링 + 정렬 (메모이제이션)
  const filteredItems = useMemo(() => {
    const EXCLUDE_KEYWORDS = ['어선', '귀어', '어업', '양식', '농촌', '농업'];
    const isExcluded = (item: FeedItem) => {
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
        .slice(0, 100);
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

  const isLoading    = dataStore[activeTab]?.loading ?? false;
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
          const Icon  = tab.icon;
          const isAct = activeTab === tab.id;
          const st    = dataStore[tab.id];
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
                    {item.almaengi?.deadline && item.almaengi.deadline !== '공고확인' ? `${item.almaengi.deadline} 까지 온/오프라인 신청` : '공식 사이트 참조'}
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
