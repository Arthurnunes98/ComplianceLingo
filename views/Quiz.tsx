import React, { useState } from 'react';
import { Note, QuizQuestion, QuizState } from '../types';
import { generateQuizFromNotes } from '../services/geminiService';
import Button from '../components/Button';
import { BrainCircuit, CheckCircle, XCircle, Trophy, BarChart3 } from 'lucide-react';

interface QuizProps {
  notes: Note[];
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const Quiz: React.FC<QuizProps> = ({ notes }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  
  const [quizState, setQuizState] = useState<QuizState>({
    isActive: false,
    score: 0,
    currentQuestionIndex: 0,
    questions: [],
    showResults: false,
    answers: []
  });

  const startQuiz = async () => {
    if (notes.length === 0) {
        setError("You need to create some notes first before generating a quiz.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const questions = await generateQuizFromNotes(notes, difficulty);
      setQuizState({
        isActive: true,
        score: 0,
        currentQuestionIndex: 0,
        questions,
        showResults: false,
        answers: new Array(questions.length).fill(-1)
      });
    } catch (e) {
      setError("Failed to generate quiz. Please try again or add more content to your notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestionIndex] = optionIndex;
    
    setQuizState(prev => ({ ...prev, answers: newAnswers }));
  };

  const nextQuestion = () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let score = 0;
    quizState.questions.forEach((q, idx) => {
        if (quizState.answers[idx] === q.correctAnswerIndex) score++;
    });
    setQuizState(prev => ({ ...prev, showResults: true, score, isActive: false }));
  };

  const reset = () => {
    setQuizState({
        isActive: false,
        score: 0,
        currentQuestionIndex: 0,
        questions: [],
        showResults: false,
        answers: []
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500 animate-pulse">
        <BrainCircuit size={48} className="mb-4 text-indigo-500" />
        <p className="text-lg font-medium">Analyzing your notes...</p>
        <p className="text-sm">Generating custom {difficulty.toLowerCase()} questions.</p>
      </div>
    );
  }

  // Results View
  if (quizState.showResults) {
    const percentage = Math.round((quizState.score / quizState.questions.length) * 100);
    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
                <div className="inline-flex p-4 bg-yellow-100 rounded-full text-yellow-600 mb-4">
                    <Trophy size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
                <div className="text-slate-500 mb-6 flex flex-col items-center gap-1">
                   <p>You scored <span className="font-bold text-indigo-600">{percentage}%</span> on {difficulty} difficulty.</p>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-4 mb-8 overflow-hidden max-w-md mx-auto">
                    <div 
                        className={`h-full transition-all duration-1000 ${percentage >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <Button onClick={reset} variant="secondary">Back to Menu</Button>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Review Answers</h3>
                {quizState.questions.map((q, idx) => {
                    const userAnswer = quizState.answers[idx];
                    const isCorrect = userAnswer === q.correctAnswerIndex;
                    return (
                        <div key={q.id} className={`bg-white p-6 rounded-xl border ${isCorrect ? 'border-emerald-200' : 'border-rose-200'} shadow-sm`}>
                             <div className="flex gap-3 mb-3">
                                 {isCorrect ? <CheckCircle className="text-emerald-500 shrink-0" /> : <XCircle className="text-rose-500 shrink-0" />}
                                 <h4 className="font-semibold text-slate-800">{q.question}</h4>
                             </div>
                             <div className="pl-9 text-sm space-y-2">
                                 <p className="text-slate-500">Correct: <span className="font-medium text-emerald-600">{q.options[q.correctAnswerIndex]}</span></p>
                                 {!isCorrect && <p className="text-rose-600">You chose: {q.options[userAnswer]}</p>}
                                 <div className="mt-3 p-3 bg-slate-50 rounded text-slate-600 italic border-l-2 border-indigo-200">
                                     💡 {q.explanation}
                                 </div>
                             </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  }

  // Active Quiz View
  if (quizState.isActive && quizState.questions.length > 0) {
    const currentQ = quizState.questions[quizState.currentQuestionIndex];
    const hasAnswered = quizState.answers[quizState.currentQuestionIndex] !== -1;

    return (
        <div className="max-w-2xl mx-auto mt-8">
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Question {quizState.currentQuestionIndex + 1} / {quizState.questions.length}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider border ${
                    difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                    {difficulty} Mode
                </span>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 leading-relaxed">
                    {currentQ.question}
                </h3>
                <div className="space-y-3">
                    {currentQ.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                quizState.answers[quizState.currentQuestionIndex] === idx
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-medium'
                                    : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
                            }`}
                        >
                            <span className="inline-block w-6 h-6 text-center leading-6 rounded-full bg-white border border-slate-200 text-xs mr-3 text-slate-400">
                                {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <Button 
                    onClick={nextQuestion} 
                    disabled={!hasAnswered}
                    className="w-32"
                >
                    {quizState.currentQuestionIndex === quizState.questions.length - 1 ? 'Finish' : 'Next'}
                </Button>
            </div>
        </div>
    );
  }

  // Empty State / Start
  return (
    <div className="max-w-md mx-auto text-center py-12 space-y-6">
       <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
           <BrainCircuit size={40} />
       </div>
       <div>
           <h2 className="text-2xl font-bold text-slate-800">Ready to test yourself?</h2>
           <p className="text-slate-500 mt-2">
               We will generate a personalized quiz based on your study notes to identify weak spots.
           </p>
       </div>
       
       <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left space-y-2">
           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               <BarChart3 size={14} /> Difficulty Level
           </label>
           <div className="flex gap-2">
               {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                   <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                            difficulty === level 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                   >
                       {level}
                   </button>
               ))}
           </div>
           <p className="text-xs text-slate-400 mt-2">
               {difficulty === 'Easy' && "Basic definitions and simple vocabulary."}
               {difficulty === 'Medium' && "Standard scenario-based questions."}
               {difficulty === 'Hard' && "Complex scenarios and nuanced differences."}
           </p>
       </div>

       {error && (
        <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
            {error}
        </div>
       )}

       <Button onClick={startQuiz} className="w-full justify-center py-4 text-lg shadow-indigo-200 shadow-xl">
           Generate Quiz
       </Button>
       
       <p className="text-xs text-slate-400">
           {notes.length} notes available for quiz generation.
       </p>
    </div>
  );
};

export default Quiz;
