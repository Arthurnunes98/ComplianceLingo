import React, { useState } from 'react';
import { translateTerm } from '../services/geminiService';
import { TranslationResult } from '../types';
import Button from '../components/Button';
import { Search, BookOpen, Volume2, ArrowRight } from 'lucide-react';

const Translator: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await translateTerm(input);
      setResult(data);
    } catch (err) {
      setError("Unable to translate at the moment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Compliance Lexicon</h2>
        <p className="text-slate-500">Translate specialized terms into context-aware Portuguese definitions.</p>
      </div>

      <form onSubmit={handleTranslate} className="relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a term (e.g., 'Due Diligence', 'Whistleblower')..."
            className="w-full pl-11 pr-4 py-4 rounded-xl border border-slate-200 shadow-sm bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
             <Button type="submit" isLoading={loading} disabled={!input.trim()} className="rounded-lg">
               Translate
             </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-indigo-900">{result.term}</h3>
              <p className="text-indigo-600 font-medium text-lg mt-1">{result.translation}</p>
            </div>
            <button 
              onClick={() => playAudio(result.term)}
              className="p-2 bg-white rounded-full text-indigo-600 hover:bg-indigo-100 shadow-sm transition-colors"
              title="Listen pronunciation"
            >
              <Volume2 size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider mb-2">
                <BookOpen size={14} /> Definition
              </div>
              <p className="text-slate-700 leading-relaxed">{result.definition}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider mb-3">
                <ArrowRight size={14} /> Usage Examples
              </div>
              <ul className="space-y-3">
                {result.examples.map((ex, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-indigo-400 font-bold select-none">{idx + 1}.</span>
                    <span>{ex}</span>
                    <button 
                      onClick={() => playAudio(ex)}
                      className="ml-auto text-slate-400 hover:text-indigo-500"
                    >
                      <Volume2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translator;
