import React, { useState } from 'react';
import { ThumbsUp, Calendar, MapPin, User, Award, BookOpen, Clock, ArrowLeft, HelpCircle, RefreshCw, Sparkles } from 'lucide-react';
import { FossilExhibit } from '../types';
import FossilCanvas3D from './FossilCanvas3D';

interface FossilDetailViewProps {
  fossil: FossilExhibit;
  onBack: () => void;
  onLike: (fossilId: string) => void;
  isLikedByUser: boolean;
}

export default function FossilDetailView({ fossil, onBack, onLike, isLikedByUser }: FossilDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'facts' | 'process' | 'curiosities' | 'quiz'>('facts');

  // Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedAnswer !== null) return; // Prevent double clicking
    setSelectedAnswer(optionIdx);
    
    const correctIdx = fossil.quizQuestions[currentQuizIndex].answerIndex;
    if (optionIdx === correctIdx) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuizIndex < fossil.quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const currentQuestion = fossil.quizQuestions[currentQuizIndex];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6" id="fossil-detail-view-root">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="btn-back-to-lobby"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#C2A26E] bg-[#141615] border border-[#C2A26E]/25 rounded-xl hover:bg-[#C2A26E]/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5px]" /> Voltar ao Átrio
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#C2A26E]/60 uppercase tracking-widest hidden md:inline">ID EXPOSIÇÃO: {fossil.id}</span>
          {fossil.createdBy === 'system' && (
            <span className="px-2.5 py-0.5 bg-[#C2A26E]/10 border border-[#C2A26E]/30 text-[10px] font-mono text-[#C2A26E] rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Curadoria Oficial
            </span>
          )}
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT SIDE: Large 3D Stage & Core Stats */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          
          {/* Canvas Box */}
          <div className="aspect-[4/3] w-full min-h-[380px] lg:min-h-[460px] relative rounded-2xl overflow-hidden border border-[#C2A26E]/20">
            <FossilCanvas3D
              fossilType={fossil.fossilType}
              color={fossil.color}
              wearFactor={fossil.wearFactor}
              size={fossil.size}
              ridges={fossil.ridges}
              fossilName={fossil.fossilName}
            />
          </div>

          {/* Social Appreciation Card */}
          <div className="bg-[#141615] border border-[#C2A26E]/20 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div className="space-y-1 pr-2">
              <h4 className="text-xs font-serif font-semibold text-slate-200">Gostou deste trabalho escolar?</h4>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                Deixe o seu incentivo para o grupo {fossil.groupName}!
              </p>
            </div>
            
            <button
              id={`like-btn-${fossil.id}`}
              onClick={() => onLike(fossil.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold font-mono uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer ${
                isLikedByUser
                  ? 'bg-[#C2A26E]/20 border-[#C2A26E] text-[#C2A26E]'
                  : 'bg-[#1A1C1B] border-[#C2A26E]/25 text-slate-300 hover:text-[#C2A26E] hover:bg-[#C2A26E]/10'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLikedByUser ? 'fill-[#C2A26E] text-[#C2A26E]' : ''}`} />
              <span>{fossil.likesCount} Gostos</span>
            </button>
          </div>

          {/* Physical specs of the fossil */}
          <div className="grid grid-cols-3 gap-3 bg-[#141615]/40 rounded-2xl p-4 border border-[#C2A26E]/10 text-center font-mono text-[10px] tracking-wider">
            <div className="p-2 bg-[#0F1110] rounded-xl border border-[#C2A26E]/15">
              <span className="text-[#C2A26E]/60 block mb-0.5 uppercase">Escala</span>
              <span className="text-slate-200 font-semibold">{fossil.size.toFixed(1)}x real</span>
            </div>
            <div className="p-2 bg-[#0F1110] rounded-xl border border-[#C2A26E]/15">
              <span className="text-[#C2A26E]/60 block mb-0.5 uppercase">Erosão</span>
              <span className="text-slate-200 font-semibold">{Math.round(fossil.wearFactor * 100)}%</span>
            </div>
            <div className="p-2 bg-[#0F1110] rounded-xl border border-[#C2A26E]/15">
              <span className="text-[#C2A26E]/60 block mb-0.5 uppercase">Registo</span>
              <span className="text-slate-200 font-semibold text-[9px] uppercase">{new Date(fossil.createdAt).toLocaleDateString('pt-PT')}</span>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE: Presentation Content & Interactive Tabs */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Main Title Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                fossil.geologicEra === 'Paleozoico' ? 'bg-amber-950/20 text-amber-400 border-amber-900/40' :
                fossil.geologicEra === 'Mesozoico' ? 'bg-[#C2A26E]/10 text-[#C2A26E] border-[#C2A26E]/35' :
                'bg-sky-950/20 text-sky-400 border-sky-900/40'
              }`}>
                Era {fossil.geologicEra}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#141615] border border-[#C2A26E]/20 text-[10px] text-slate-300 font-mono tracking-wider uppercase">
                {fossil.age}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-serif italic text-white tracking-tight leading-tight" id="fossil-detail-title">
              {fossil.fossilName}
            </h1>

            {/* Student Group Tag and Place */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 bg-[#141615] px-3 py-1.5 rounded-lg border border-[#C2A26E]/15">
                <User className="w-4 h-4 text-[#C2A26E]" />
                <span>Apresentado por: <strong className="text-white font-serif italic">{fossil.groupName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#141615] px-3 py-1.5 rounded-lg border border-[#C2A26E]/15">
                <MapPin className="w-4 h-4 text-rose-400/80" />
                <span>Local Descoberta: <strong className="text-white">{fossil.location}</strong></span>
              </div>
            </div>
          </div>

          {/* Core Description paragraph */}
          <div className="bg-[#141615]/40 border border-[#C2A26E]/15 rounded-2xl p-5 shadow-inner">
            <h3 className="text-[10px] font-mono text-[#C2A26E] uppercase tracking-widest font-bold mb-2">Resumo da Apresentação</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {fossil.description}
            </p>
          </div>

          {/* Interactive presentation tab selector */}
          <div className="border-b border-[#C2A26E]/10 flex items-center gap-1 overflow-x-auto text-xs font-mono">
            <button
              id="tab-facts"
              onClick={() => setActiveTab('facts')}
              className={`px-4 py-2.5 border-b-2 font-bold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === 'facts' ? 'border-[#C2A26E] text-[#C2A26E] bg-[#C2A26E]/5' : 'border-transparent text-slate-500 hover:text-[#C2A26E]'}`}
            >
              Ficha Científica
            </button>
            <button
              id="tab-process"
              onClick={() => setActiveTab('process')}
              className={`px-4 py-2.5 border-b-2 font-bold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === 'process' ? 'border-[#C2A26E] text-[#C2A26E] bg-[#C2A26E]/5' : 'border-transparent text-slate-500 hover:text-[#C2A26E]'}`}
            >
              Processo Fossilização
            </button>
            <button
              id="tab-curiosities"
              onClick={() => setActiveTab('curiosities')}
              className={`px-4 py-2.5 border-b-2 font-bold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === 'curiosities' ? 'border-[#C2A26E] text-[#C2A26E] bg-[#C2A26E]/5' : 'border-transparent text-slate-500 hover:text-[#C2A26E]'}`}
            >
              Curiosidades
            </button>
            <button
              id="tab-quiz"
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2.5 border-b-2 font-bold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === 'quiz' ? 'border-[#C2A26E] text-[#C2A26E] bg-[#C2A26E]/5' : 'border-transparent text-slate-500 hover:text-[#C2A26E]'}`}
            >
              Quiz Interativo ({fossil.quizQuestions?.length || 0})
            </button>
          </div>

          {/* Tab Content display box */}
          <div className="min-h-[240px] bg-[#141615] border border-[#C2A26E]/20 rounded-2xl p-6 shadow-xl" id="tab-content-box">
            
            {/* TAB 1: Scientific Facts */}
            {activeTab === 'facts' && (
              <div className="space-y-4" id="tab-content-facts">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-[#C2A26E]" />
                  <h3 className="font-serif italic text-slate-200 text-base">Factos Científicos Verificados</h3>
                </div>

                {fossil.scientificFacts && fossil.scientificFacts.length > 0 ? (
                  <ul className="space-y-3">
                    {fossil.scientificFacts.map((fact, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-3 leading-relaxed">
                        <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#C2A26E]"></span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic font-mono uppercase tracking-wider">O grupo de alunos não registou factos científicos.</p>
                )}
              </div>
            )}

            {/* TAB 2: Fossilization process Timeline steps */}
            {activeTab === 'process' && (
              <div className="space-y-4" id="tab-content-process">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-[#C2A26E]" />
                  <h3 className="font-serif italic text-slate-200 text-base">Caminho do Tempo: Como se formou?</h3>
                </div>

                {fossil.fossilizationProcess && fossil.fossilizationProcess.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-[#C2A26E]/15 space-y-5 ml-2 pt-1">
                    {fossil.fossilizationProcess.map((stepTxt, idx) => (
                      <div key={idx} className="relative group/step">
                        {/* Circle dot */}
                        <div className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-[#0F1110] border-2 border-[#C2A26E] flex items-center justify-center text-[8px] font-mono font-bold text-[#C2A26E] group-hover/step:bg-[#C2A26E] group-hover/step:text-black transition-colors duration-300">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {stepTxt}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic font-mono uppercase tracking-wider">O processo de fossilização não foi registado.</p>
                )}
              </div>
            )}

            {/* TAB 3: Curiosities */}
            {activeTab === 'curiosities' && (
              <div className="space-y-4" id="tab-content-curiosities">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-[#C2A26E]" />
                  <h3 className="font-serif italic text-slate-200 text-base">Sabias que...?</h3>
                </div>

                {fossil.curiosities && fossil.curiosities.length > 0 ? (
                  <ul className="space-y-4">
                    {fossil.curiosities.map((cur, idx) => (
                      <li key={idx} className="p-4 bg-[#0F1110] rounded-xl border border-[#C2A26E]/15 flex items-start gap-4">
                        <span className="text-base font-serif italic text-[#C2A26E] font-bold select-none">{idx + 1}</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {cur}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic font-mono uppercase tracking-wider">Nenhuma curiosidade registada para este exemplar.</p>
                )}
              </div>
            )}

            {/* TAB 4: Student Made Interactive Quiz */}
            {activeTab === 'quiz' && (
              <div className="space-y-4" id="tab-content-quiz">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#C2A26E]" />
                    <h3 className="font-serif italic text-slate-200 text-base">Quiz Interativo dos Alunos</h3>
                  </div>
                  {!quizCompleted && fossil.quizQuestions?.length > 0 && (
                    <span className="text-[9px] font-mono text-slate-500 tracking-wider">
                      PERGUNTA {currentQuizIndex + 1} DE {fossil.quizQuestions.length}
                    </span>
                  )}
                </div>

                {(!fossil.quizQuestions || fossil.quizQuestions.length === 0) ? (
                  <p className="text-xs text-slate-500 italic font-mono uppercase tracking-wider">Este fóssil não tem perguntas de quiz configuradas.</p>
                ) : quizCompleted ? (
                  /* Quiz End screen */
                  <div className="text-center py-6 space-y-4" id="quiz-complete-screen">
                    <div className="w-16 h-16 bg-[#C2A26E]/10 border-2 border-[#C2A26E]/40 rounded-full flex items-center justify-center mx-auto text-[#C2A26E] text-xl font-serif font-bold">
                      {quizScore}/{fossil.quizQuestions.length}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-serif font-semibold text-slate-200">Visita Científica Concluída!</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                        {quizScore === fossil.quizQuestions.length
                          ? "Incrível! Demonstrou total proficiência na apresentação científica dos alunos."
                          : "Bom esforço! Volte a ler a ficha e os factos para obter a pontuação máxima!"}
                      </p>
                    </div>
                    <button
                      id="btn-retry-quiz"
                      onClick={handleResetQuiz}
                      className="px-5 py-2 bg-[#1A1C1B] border border-[#C2A26E]/25 hover:bg-[#C2A26E]/10 text-[#C2A26E] font-bold font-mono uppercase tracking-widest text-xs rounded-xl flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Repetir Quiz
                    </button>
                  </div>
                ) : (
                  /* Live question sheet */
                  <div className="space-y-4" id="quiz-question-active">
                    <p className="text-xs font-semibold text-slate-100 leading-relaxed bg-[#0F1110] p-3 rounded-xl border border-[#C2A26E]/15">
                      {currentQuestion.question}
                    </p>

                    {/* Options Stack */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {currentQuestion.options.map((option, idx) => {
                        let btnStyle = "bg-[#1A1C1B] border-[#C2A26E]/15 text-slate-300 hover:bg-[#C2A26E]/5 hover:text-white";
                        
                        // After selection highlight results
                        if (selectedAnswer !== null) {
                          if (idx === currentQuestion.answerIndex) {
                            // The correct option glows green
                            btnStyle = "bg-emerald-950/40 border-emerald-700 text-emerald-400";
                          } else if (idx === selectedAnswer) {
                            // The wrong chosen option glows red
                            btnStyle = "bg-rose-950/40 border-rose-800 text-rose-400";
                          } else {
                            // Unselected choices get faded
                            btnStyle = "bg-black/20 border-black/40 text-slate-600 cursor-not-allowed";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            id={`quiz-opt-btn-${idx}`}
                            disabled={selectedAnswer !== null}
                            onClick={() => handleAnswerSelect(idx)}
                            className={`w-full py-2.5 px-4 text-xs font-medium rounded-xl border text-left transition-all flex items-center justify-between ${btnStyle} cursor-pointer`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-[9px] font-mono text-[#C2A26E]/80 font-bold bg-[#0F1110] px-1.5 py-0.5 rounded border border-[#C2A26E]/10">{String.fromCharCode(65 + idx)}</span>
                              <span>{option}</span>
                            </span>
                            
                            {/* Feedback badges */}
                            {selectedAnswer !== null && idx === currentQuestion.answerIndex && (
                              <span className="text-[8px] uppercase tracking-wider font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 animate-pulse">Correto</span>
                            )}
                            {selectedAnswer !== null && idx === selectedAnswer && idx !== currentQuestion.answerIndex && (
                              <span className="text-[8px] uppercase tracking-wider font-mono text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900">Incorreto</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Scientific explanation overlay */}
                    {selectedAnswer !== null && (
                      <div className="p-4 bg-[#0F1110] border border-[#C2A26E]/20 rounded-xl space-y-2.5 animate-fadeIn" id="quiz-explanation-box">
                        <span className="text-[9px] font-mono font-bold text-[#C2A26E] uppercase tracking-widest block">Explicação Científica</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {currentQuestion.explanation}
                        </p>
                        
                        <button
                          id="btn-quiz-next"
                          onClick={handleNextQuestion}
                          className="px-5 py-2 bg-white hover:bg-[#C2A26E] text-black font-mono font-bold uppercase tracking-widest rounded-lg text-xs flex items-center gap-1 ml-auto mt-2 transition-colors cursor-pointer"
                        >
                          {currentQuizIndex < fossil.quizQuestions.length - 1 ? 'Seguinte' : 'Ver Resultados'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
