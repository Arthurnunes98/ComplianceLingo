import React, { useEffect, useState } from 'react';
import { fetchComplianceNews, NewsData } from '../services/geminiService';
import { Newspaper, ExternalLink, RefreshCw, Globe, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
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
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4 animate-pulse">
            <div className="h-8 w-1/3 bg-slate-100 rounded"></div>
            <div className="h-4 w-full bg-slate-100 rounded"></div>
            <div className="h-4 w-full bg-slate-100 rounded"></div>
            <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
            <div className="h-8 w-1/4 bg-slate-100 rounded mt-8"></div>
            <div className="h-4 w-full bg-slate-100 rounded"></div>
            <div className="h-4 w-full bg-slate-100 rounded"></div>
        </div>
      )}

      {/* Content */}
      {data && (
        <div className="space-y-10">
           
           <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <div className="prose prose-slate max-w-none whitespace-pre-wrap font-sans leading-relaxed text-slate-700">
                {data.content}
              </div>
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