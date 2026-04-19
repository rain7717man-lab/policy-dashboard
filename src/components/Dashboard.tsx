'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Copy, ExternalLink, RefreshCw, Search, Landmark, Rocket, Building2, Apple, Sparkles, User, CircleDollarSign, CalendarClock, ShieldCheck, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MASTER_PROMPT } from '@/lib/constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Almaengi = {
  target: string;
  budget: string;
  deadline: string;
};

type FeedItem = {
  id: string;
  ministry: string;
  category: string;
  title: string;
  link: string;
  date: string;
  description: string;
  source?: string;
  isLocal?: boolean;
  almaengi?: Almaengi;
};

type SourceState = {
    items: FeedItem[];
    loading: boolean;
    fetched: boolean;
    error: string | null;
};

const TABS = [
  { id: '정책브리핑', label: '🏛️ 정책브리핑', icon: Landmark, color: 'text-blue-600' },
  { id: 'K-Startup', label: '🚀 K-Startup', icon: Rocket, color: 'text-orange-600' },
  { id: '보조금24', label: '🛡️ 보조금24', icon: ShieldCheck, color: 'text-emerald-600' },
  { id: '중기부/소진공', label: '🏢 중기부/소진공', icon: Building2, color: 'text-purple-600' },
  { id: '경기/화성비즈', label: '🍎 경기/화성비즈', icon: Apple, color: 'text-red-600' },
  { id: '알맹이', label: '✨ 상세/신청(알맹이)', icon: Sparkles, color: 'text-indigo-600' },
];

export default function Dashboard() {
  const [dataStore, setDataStore] = useState<Record<string, SourceState>>({
    '정책브리핑': { items: [], loading: false, fetched: false, error: null },
    'K-Startup': { items: [], loading: false, fetched: false, error: null },
    '보조금24': { items: [], loading: false, fetched: false, error: null },
    '중기부/소진공': { items: [], loading: false, fetched: false, error: null },
    '경기/화성비즈': { items: [], loading: false, fetched: false, error: null },
  });

  const [activeTab, setActiveTab] = useState('정책브리핑');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2000);
  }, []);

  const fetchSource = useCallback(async (sourceId: string, isManual = false) => {
    if (!isManual && dataStore[sourceId]?.fetched) return;

    setDataStore(prev => ({
        ...prev,
        [sourceId]: { ...prev[sourceId], loading: true, error: null }
    }));

    if (isManual) showToast(`🔃 ${sourceId} 데이터를 실시간 수집 중입니다...`);

    try {
      const res = await fetch(`/api/data?source=${encodeURIComponent(sourceId)}&t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success && json.data) {
          const items = json.data || [];
          setDataStore(prev => ({
              ...prev,
              [sourceId]: { 
                items: items, 
                fetched: true, 
                loading: false, 
                error: items.length === 0 ? '데이터 수집 실패 (사이트 보안 차단 또는 공고 없음)' : null 
              }
          }));
          if (isManual && items.length > 0) showToast(`✅ ${sourceId} ${items.length}건 수집 완료!`);
      } else {
          setDataStore(prev => ({ 
            ...prev, 
            [sourceId]: { ...prev[sourceId], loading: false, error: '데이터 수보 중 에러 발생' } 
          }));
      }
    } catch (e: any) {
      setDataStore(prev => ({ 
        ...prev, 
        [sourceId]: { ...prev[sourceId], loading: false, error: '서버 연결 실패' } 
      }));
    } finally {
      // 무한 로딩 방지를 위해 반드시 실행
      setDataStore(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], loading: false } }));
    }
  }, [dataStore, showToast]);

  useEffect(() => {
    fetchSource('정책브리핑');
  }, []);

  useEffect(() => {
    if (activeTab !== '알맹이') {
        fetchSource(activeTab);
    }
  }, [activeTab]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(MASTER_PROMPT).then(() => {
      showToast('원고 작성 프롬프트가 복사되었습니다!');
    });
  };

  const filteredItems = useMemo(() => {
    let result: FeedItem[] = [];

    if (activeTab === '알맹이') {
      const allFetchedItems = Object.values(dataStore).flatMap(s => s.items);
      result = allFetchedItems.filter(item => 
        item.almaengi && (
          (item.almaengi.budget !== '내용 확인' && item.almaengi.budget !== '상세참조') ||
          (item.almaengi.deadline !== '상세참조' && item.almaengi.deadline !== '공고확인')
        )
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 100);
    } else {
      result = (dataStore[activeTab]?.items || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.ministry.toLowerCase().includes(query)
      );
    }

    return result;
  }, [dataStore, activeTab, searchQuery]);

  const isLoading = dataStore[activeTab]?.loading || false;
  const currentError = dataStore[activeTab]?.error || null;

  return (
    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

      {/* ── 헤더 ── */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            공식 정책 실시간 수집 센터
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400 font-bold sm:text-lg">
            내부 API 연동 기반 정밀 모니터링 (v5)
          </p>
        </div>

        <button
          onClick={() => fetchSource(activeTab, true)}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl text-base font-black transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-500/20"
        >
          <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          <span>{isLoading ? '데이터 수집 중...' : `${activeTab} 재수집 시도`}</span>
        </button>
      </div>

      {/* ── 탭 네비게이션 ── */}
      <div className="mb-6 sm:mb-10">
        <div className="flex overflow-x-auto scrollbar-hide -mx-3 px-3 gap-2 pb-2 sm:flex-wrap sm:justify-start">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isFetched = dataStore[tab.id]?.fetched;
            const hasError = dataStore[tab.id]?.error;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-4 rounded-2xl text-base font-black transition-all shrink-0 whitespace-nowrap border-2 relative",
                  isActive 
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "" : tab.color)} />
                {tab.label}
                {isFetched && !isActive && !hasError && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
                )}
                {hasError && !isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 검색바 ── */}
      <div className="relative w-full mb-8 sm:mb-12">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-14 pr-6 py-5 border-2 border-gray-100 dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg shadow-sm transition-all font-bold"
          placeholder={`${activeTab} 데이터에서 검색...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── 카드 그리드 ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-2 border-gray-50 dark:border-gray-700 animate-pulse h-[400px]">
                <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/2 mb-6"></div>
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg w-full mb-4"></div>
                <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl w-full mb-6"></div>
            </div>
          ))}
        </div>
      ) : currentError ? (
        <div className="text-center py-24 bg-red-50 dark:bg-red-900/10 rounded-[3rem] border-2 border-red-100 dark:border-red-900/30 flex flex-col items-center gap-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-xl font-black text-red-600 dark:text-red-400">
             {currentError}
          </h2>
          <p className="text-gray-500 max-w-md mx-auto font-medium">
            정부 사이트의 보안 강화로 인해 일시적으로 접속이 차단되었거나 수집 경로가 변경되었을 수 있습니다. 잠시 후 [재수집] 버튼을 눌러주세요.
          </p>
          <button 
            onClick={() => fetchSource(activeTab, true)} 
            className="mt-4 px-8 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all active:scale-95"
          >
            지금 다시 시도
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-400 dark:text-gray-500 font-black text-xl">
             수집된 데이터가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-gray-800 rounded-[2.5rem] p-7 sm:p-9 border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-500 flex flex-col relative overflow-hidden"
            >
                <div className="flex items-center justify-between mb-6 relative">
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full">
                    {item.ministry}
                  </span>
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/30 px-3 py-1.5 rounded-lg">
                    {item.date}
                  </span>
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors h-[3.5rem]" title={item.title}>
                  {item.title}
                </h3>

                {/* ✨ 알맹이 정보 섹션 */}
                <div className="grid grid-cols-1 gap-3 mb-8 bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 relative group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold w-12 shrink-0">대상</span>
                        <span className="text-sm text-gray-800 dark:text-gray-200 font-black line-clamp-1 truncate">{item.almaengi?.target || '전체'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CircleDollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold w-12 shrink-0">예산</span>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-black">{item.almaengi?.budget || '상세확인'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CalendarClock className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold w-12 shrink-0">마감</span>
                        <span className="text-sm text-red-600 dark:text-red-400 font-black">{item.almaengi?.deadline || '상시'}</span>
                    </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 line-clamp-3 leading-relaxed flex-grow font-medium" title={item.description}>
                  {item.description}
                </p>

                <div className="space-y-3 mt-auto relative">
                  <button
                    onClick={() => copyPrompt()}
                    className="w-full flex items-center justify-center gap-2.5 py-4.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.25rem] text-base font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-200 dark:shadow-none min-h-[58px]"
                  >
                    <Copy className="w-5 h-5 shrink-0" />
                    📝 원고 작성 프롬프트 복사
                  </button>

                  <button
                    onClick={() => window.open(item.link, '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-[1.25rem] text-sm font-bold transition-all border border-gray-100 dark:border-gray-700"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    공식기관 원문 보기
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      <div className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl font-black text-base transition-all duration-300 z-50 whitespace-nowrap border-4 border-white/10 dark:border-black/5",
        toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}>
        {toast.msg}
      </div>
    </div>
  );
}
