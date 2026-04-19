'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, ExternalLink, RefreshCw, Search } from 'lucide-react';
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

const CATEGORIES = ['전체보기', '📌 상세/신청 (알맹이)', '경제/부동산', '생활/복지', '지원사업', '기타 부처'];
const ALMAENGI_KEYWORDS = ["세부", "기준", "신청", "안내", "Q&A", "본격", "실시", "가이드"];

// 모든 탭에 공통 적용되는 블랙리스트 (단순 동정·행사 기사 제외)
const BLACKLIST_KEYWORDS = ["동정", "인사", "위촉", "표창", "간담회", "방문", "장관", "차관", "국무총리", "총리", "대통령", "기념식", "개최", "참석", "MOU", "업무협약", "발족"];

export default function Dashboard() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('전체보기');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });


  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2000);
  }, []);

  const fetchFeeds = useCallback(async (isManual = false) => {
    if (isManual) showToast('🔃 최신 공고를 통합 수집하고 있습니다...');
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

      // 날짜 기준 정렬
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setItems(combined);
      if (isManual) showToast(`✅ ${combined.length}개의 최신 정보 업데이트 완료!`);
    } catch (e) {
      console.warn('Fetch Exception:', e);
      if (isManual) showToast('⚠️ 데이터를 수집하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(MASTER_PROMPT).then(() => {
      showToast('하이엔드 v2 프롬프트가 복사되었습니다! 노트북LM에 PDF와 함께 넣어주세요.');
    });
  };


  const filteredItems = items.filter((item) => {
    const isBlocked = BLACKLIST_KEYWORDS.some((kw) => item.title.includes(kw));
    if (isBlocked) return false;

    let tabMatch = false;
    if (activeTab === '전체보기') {
      tabMatch = true;
    } else if (activeTab === '📌 상세/신청 (알맹이)') {
      tabMatch = ALMAENGI_KEYWORDS.some((keyword) => item.title.includes(keyword));
    } else {
      tabMatch = item.category === activeTab;
    }

    let searchMatch = true;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      searchMatch = item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.ministry.toLowerCase().includes(query) ||
                    !!(item.source && item.source.toLowerCase().includes(query));
    }

    return tabMatch && searchMatch;
  });


  return (
    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

      {/* ── 헤더 ── */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            정책/지원금 통합 모니터링
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400 font-medium sm:text-base sm:mt-2">
            7개 특화 사이트 + 부처 보도자료 실시간 통합 대시보드
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchFeeds(true)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 min-h-[48px]"
          >
            <RefreshCw className={cn("w-4 h-4 shrink-0", loading && "animate-spin")} />
            <span className="whitespace-nowrap">
              {loading ? '로딩 중...' : '🔄 통합 데이터 새로고침'}
            </span>
          </button>
        </div>
      </div>

      {/* ── 탭 + 검색 ── */}
      <div className="flex flex-col gap-3 mb-5 sm:mb-8">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 bg-white dark:bg-gray-800 p-1.5 rounded-2xl w-max min-w-full sm:w-fit shadow-sm border border-gray-100 dark:border-gray-700">
            {CATEGORIES.map((cat) => {
              const isHighlight = cat === '📌 상세/신청 (알맹이)';
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] shrink-0",
                    activeTab === cat
                      ? isHighlight
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : isHighlight
                        ? "text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 font-extrabold"
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
            placeholder="키워드 검색 (제목, 부처, 출처, 요약)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── 카드 그리드 ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse h-[300px]">
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
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-base sm:text-lg">
            해당 조건에 부합하는 자료가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 relative flex flex-col"
            >
                {item.isLocal && (
                  <div className="absolute -top-3 left-4 z-10">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-md border border-amber-200 shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                      🏅 지역특화
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1.5 rounded-lg",
                    item.category === '경제/부동산' ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400" :
                    item.category === '생활/복지' ? "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-400" :
                    item.category === '지원사업' ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400" :
                    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  )}>
                    {item.ministry}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                    {isNaN(new Date(item.date).getTime()) ? item.date : new Date(item.date).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors sm:text-lg sm:mb-3" title={item.title}>
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed flex-grow sm:mb-5" title={item.description}>
                  {item.description}
                </p>

                <div className="space-y-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 sm:pt-4 sm:space-y-2.5">
                  <button
                    onClick={() => copyPrompt()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-[0.97] min-h-[52px]"
                  >
                    <Copy className="w-4 h-4 shrink-0" />
                    📝 원고 작성 프롬프트 복사
                  </button>

                  <button
                    onClick={() => window.open(item.link, '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold transition-all active:scale-[0.97] min-h-[48px]"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    📄 원문 보기 (PDF 다운로드)
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      <div className={cn(
        "fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 sm:bottom-6 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm transition-all duration-300 z-50 whitespace-nowrap",
        toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      )}>
        {toast.msg}
      </div>
    </div>
  );
}
