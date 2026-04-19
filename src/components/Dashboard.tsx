'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, ExternalLink, RefreshCw, Search, Building2, Landmark, Wallet } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MASTER_PROMPT } from '@/lib/constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
};

type TopTab = 'press' | 'subsidy';

const ALL_CATEGORIES = {
  press: ['전체보기', '📌 상세/신청 (알맹이)', '경제/부동산', '생활/복지', '기타 부처'],
  subsidy: ['전체보기', '📌 상세/신청 (알맹이)', '지원사업']
};

const ALMAENGI_KEYWORDS = ["세부", "기준", "신청", "안내", "Q&A", "본격", "실시", "가이드"];
const BLACKLIST_KEYWORDS = ["동정", "인사", "위촉", "표창", "간담회", "방문", "장관", "차관", "국무총리", "총리", "대통령", "기념식", "개최", "MOU", "업무협약", "발족"];

export default function Dashboard() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [topTab, setTopTab] = useState<TopTab>('press');
  const [activeTab, setActiveTab] = useState('전체보기');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2000);
  }, []);

  const fetchFeeds = useCallback(async (isManual = false) => {
    if (isManual) showToast('🔃 공식 기관의 최신 데이터를 수집하고 있습니다...');
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetch(`/api/rss?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/subsidy?t=${Date.now()}`, { cache: 'no-store' })
      ]);
      
      let combined: FeedItem[] = [];
      let anySuccess = false;

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.ok) {
            const json = await res.value.json();
            if (json.success && json.data) {
                combined = [...combined, ...json.data];
                anySuccess = true;
            }
        }
      }

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (anySuccess) {
          setItems(combined);
          if (isManual) showToast(`✅ ${combined.length}개의 공식 정보 업데이트 완료!`);
      } else {
          if (isManual) showToast('⚠️ 공식 사이트 연결이 일시적으로 원활하지 않습니다.');
      }
    } catch (e) {
      if (isManual) showToast('⚠️ 데이터를 수집하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // 상단 탭 변경 시 하위 카테고리 초기화
  const handleTopTabChange = (tab: TopTab) => {
    setTopTab(tab);
    setActiveTab('전체보기');
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(MASTER_PROMPT).then(() => {
      showToast('하이엔드 v2 프롬프트가 복사되었습니다!');
    });
  };

  const filteredItems = items.filter((item) => {
    // 1. 상단 탭 필터링
    if (topTab === 'press') {
        if (item.category === '지원사업') return false;
    } else {
        if (item.category !== '지원사업') return false;
    }

    // 2. 블랙리스트 필터링
    const isBlocked = BLACKLIST_KEYWORDS.some((kw) => item.title.includes(kw));
    if (isBlocked) return false;

    // 3. 하위 탭 필터링
    let tabMatch = false;
    if (activeTab === '전체보기') {
      tabMatch = true;
    } else if (activeTab === '📌 상세/신청 (알맹이)') {
      tabMatch = ALMAENGI_KEYWORDS.some((keyword) => item.title.includes(keyword));
    } else {
      tabMatch = item.category === activeTab;
    }

    // 4. 검색 필터링
    let searchMatch = true;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      searchMatch = item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.ministry.toLowerCase().includes(query);
    }

    return tabMatch && searchMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

      {/* ── 헤더 ── */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            공식 정책/지원금 모니터링
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400 font-medium sm:text-base">
            정부 부처 공식 보도자료 및 공인 지원사업 통합 대시보드
          </p>
        </div>

        <button
          onClick={() => fetchFeeds(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 min-h-[48px] shadow-sm"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          <span>{loading ? '데이터 수집 중...' : '통합 데이터 새로고침'}</span>
        </button>
      </div>

      {/* ── 상단 대분류 탭 ── */}
      <div className="flex grid grid-cols-2 gap-2 mb-6 p-1.5 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => handleTopTabChange('press')}
          className={cn(
            "flex items-center justify-center gap-2 py-4 rounded-xl text-base font-black transition-all",
            topTab === 'press' 
              ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Landmark className="w-5 h-5" />
          🏛️ 부처 공식 보도자료
        </button>
        <button
          onClick={() => handleTopTabChange('subsidy')}
          className={cn(
            "flex items-center justify-center gap-2 py-4 rounded-xl text-base font-black transition-all",
            topTab === 'subsidy' 
              ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-black/5" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Wallet className="w-5 h-5" />
          💰 정부 지원사업 공고
        </button>
      </div>

      {/* ── 하위 카테고리 + 검색 ── */}
      <div className="flex flex-col gap-3 mb-6 sm:mb-8">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 bg-white dark:bg-gray-800 p-1.5 rounded-2xl w-max min-w-full sm:w-fit shadow-sm border border-gray-100 dark:border-gray-700">
            {ALL_CATEGORIES[topTab].map((cat) => {
              const isHighlight = cat === '📌 상세/신청 (알맹이)';
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] shrink-0",
                    isActive
                      ? isHighlight
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                        : topTab === 'press' ? "bg-blue-600 text-white shadow-md" : "bg-purple-600 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm transition-all"
            placeholder={`${topTab === 'press' ? '보도자료' : '지원사업'} 키워드 검색...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── 카드 그리드 ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse h-[300px]">
              <div className="flex justify-between mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-1"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-5"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mb-6"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">
            해당 조건에 일치하는 공식 자료가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 relative flex flex-col"
            >
                {item.isLocal && (
                  <div className="absolute -top-3 left-4 z-10">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-md border border-amber-200 shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                      🏅 지역특화
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1.5 rounded-lg",
                    item.category === '경제/부동산' ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400" :
                    item.category === '생활/복지' ? "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-400" :
                    item.category === '지원사업' ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400" :
                    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  )}>
                    {item.ministry}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {item.date}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={item.title}>
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-grow" title={item.description}>
                  {item.description}
                </p>

                <div className="space-y-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => copyPrompt()}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.97] min-h-[52px] text-white",
                        topTab === 'press' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                    )}
                  >
                    <Copy className="w-4 h-4 shrink-0" />
                    📝 원고 작성 프롬프트 복사
                  </button>

                  <button
                    onClick={() => window.open(item.link, '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold transition-all active:scale-[0.97] min-h-[48px]"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    📄 공식 기관 원문 보기
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      <div className={cn(
        "fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm transition-all duration-300 z-50 whitespace-nowrap",
        toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      )}>
        {toast.msg}
      </div>
    </div>
  );
}
