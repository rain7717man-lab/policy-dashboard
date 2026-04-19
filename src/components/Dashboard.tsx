'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Copy, ExternalLink, RefreshCw, Search,
  Landmark, Rocket, Building2, Apple, Sparkles,
  User, CircleDollarSign, CalendarClock, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MASTER_PROMPT } from '@/lib/constants';

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

export default function Dashboard() {
  const [dataStore, setDataStore] = useState<DataStore>(mkInitial());
  const [activeTab, setActiveTab] = useState('알맹이');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '' });

  // ── fetchingRef: 무한 재호출 방지 (useCallback의 dataStore 의존성 제거)
  const fetchingRef = useRef<Set<string>>(new Set());

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
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

  // 최초 마운트 시: 알맹이 탭이 기본이므로 정책브리핑+K-Startup 백그라운드 프리로드
  useEffect(() => {
    fetchSource('정책브리핑');
    fetchSource('K-Startup');
  }, [fetchSource]);

  // 탭 전환 시 해당 탭 레이지 로딩 (알맹이 탭은 별도 fetch 불필요)
  useEffect(() => {
    if (activeTab !== '알맹이') fetchSource(activeTab);
  }, [activeTab, fetchSource]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(MASTER_PROMPT)
      .then(() => showToast('원고 작성 프롬프트 복사 완료!'));
  };

  // ── 필터링 + 정렬 (메모이제이션)
  const filteredItems = useMemo(() => {
    let result: FeedItem[];
    if (activeTab === '알맹이') {
      result = Object.values(dataStore)
        .flatMap(s => s.items)
        .filter(i => i.almaengi && i.almaengi.budget !== '상세참조' && i.almaengi.deadline !== '공고확인')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 100);
    } else {
      result = [...(dataStore[activeTab]?.items ?? [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.ministry.toLowerCase().includes(q),
    );
  }, [dataStore, activeTab, searchQuery]);

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
        <button
          onClick={() => fetchSource(activeTab, true)}
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-50 shadow-lg"
        >
          <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
          {isLoading ? '수집 중…' : `${activeTab} 재수집`}
        </button>
      </div>

      {/* ── 탭 */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-3 mb-6 sm:flex-wrap">
        {TABS.map(tab => {
          const Icon  = tab.icon;
          const isAct = activeTab === tab.id;
          const st    = dataStore[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-black border-2 transition-all whitespace-nowrap',
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
          {filteredItems.map(item => (
            <article
              key={item.id}
              className="group flex flex-col bg-white dark:bg-gray-800 rounded-[2.5rem] p-7 border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-500 overflow-hidden"
            >
              {/* 상단 메타 */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">
                  {item.ministry}
                </span>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-900/30 px-3 py-1.5 rounded-lg">
                  {item.date}
                </span>
              </div>

              {/* 제목 */}
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-5 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors min-h-[3rem]" title={item.title}>
                {item.title}
              </h3>

              {/* 알맹이 */}
              <div className="space-y-2.5 mb-6 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                {[
                  { icon: User,            label: '대상', value: item.almaengi?.target ?? '전체',    cls: 'text-gray-800 dark:text-gray-200' },
                  { icon: CircleDollarSign, label: '예산', value: item.almaengi?.budget ?? '상세확인', cls: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: CalendarClock,   label: '마감', value: item.almaengi?.deadline ?? '상시',   cls: 'text-red-600 dark:text-red-400' },
                ].map(({ icon: Icon, label, value, cls }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="w-10 text-xs font-bold text-gray-400 shrink-0">{label}</span>
                    <span className={cn('text-sm font-black truncate', cls)}>{value}</span>
                  </div>
                ))}
              </div>

              {/* 설명 */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-grow" title={item.description}>
                {item.description}
              </p>

              {/* 버튼 */}
              <div className="mt-auto space-y-2.5">
                <button
                  onClick={copyPrompt}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  <Copy className="w-4 h-4" /> 📝 원고 작성 프롬프트 복사
                </button>
                <button
                  onClick={() => window.open(item.link, '_blank')}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700/30 text-gray-500 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> 공식기관 원문 보기
                </button>
              </div>
            </article>
          ))}
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
