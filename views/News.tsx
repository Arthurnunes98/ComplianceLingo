import React, { useEffect, useState } from 'react';
import { fetchComplianceNews, NewsData, NewsItem } from '../services/geminiService';
import { Newspaper, ExternalLink, RefreshCw, Globe, AlertTriangle, TrendingUp, Info, Tag } from 'lucide-react';
import Button from '../components/Button';

const News: React.FC = () => {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const newsData = await fetchComplianceNews();
      setData(newsData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch news. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getCategoryColor = (category: string) => {
      const c = category.toLowerCase();
      if (c.includes('gdpr') || c.includes('privacy')) return 'text-purple-600 bg-purple-50';
      if (c.includes('aml') || c.includes('money')) return 'text-emerald-600 bg-emerald-50';
      if (c.includes('cyber') || c.includes('tech')) return 'text-blue-600 bg-blue-50';
      return 'text-indigo-600 bg-indigo-50';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
             <Newspaper className="text-indigo-600" size={32} /> Compliance Briefing
           </h2>
           <p className="text-slate-500 mt-2 max-w-xl">
             Curated regulatory updates and news from the last 7 days. 
             Analyzed by AI for English learners.
           </p>
        </div>
        <Button onClick={loadNews} isLoading={loading} variant="secondary" className="shadow-sm">
           <RefreshCw size={16} /> Refresh Feed
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-center gap-3">
           <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-64 flex flex-col animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded mb-2"></div>
                <div className="h-6 w-1/2 bg-slate-200 rounded mb-4"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full bg-slate-100 rounded"></div>
                  <div className="h-4 w-full bg-slate-100 rounded"></div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Content */}
      {data && (
        <div className="space-y-10">
           
           {/* News Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((item: NewsItem, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getImpactColor(item.impact)}`}>
                       {item.impact} Impact
                    </span>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                       <Tag size={12} /> {item.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-3 leading-snug group-hover:text-indigo-700 transition-colors">
                    {item.headline}
                  </h3>
                  
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                    {item.summary}
                  </p>
                  
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} /> Analysis
                    </span>
                    <span className="font-mono">{item.dateContext}</span>
                  </div>
                </div>
              ))}
           </div>

           {/* Sources Section */}
           {data.sources.length > 0 && (
             <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                 <Globe size={16} /> Verified Sources & Further Reading
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {data.sources.map((source, idx) => (
                   <a 
                     key={idx}
                     href={source.uri}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                   >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-medium text-slate-700 text-sm truncate group-hover:text-indigo-700">
                          {source.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {new URL(source.uri).hostname.replace('www.', '')}
                        </p>
                      </div>
                   </a>
                 ))}
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default News;