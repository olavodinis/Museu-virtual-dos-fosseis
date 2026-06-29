import React, { useState } from 'react';
import { Wand2, Sparkles, Plus, Trash2, ArrowRight, ArrowLeft, Check, Loader2, X, Compass } from 'lucide-react';
import { FossilExhibit, FossilCategory, QuizQuestion } from '../types';
import FossilCanvas3D from './FossilCanvas3D';

interface AddFossilModalProps {
  onClose: () => void;
  onSave: (fossil: Omit<FossilExhibit, 'id' | 'likesCount' | 'createdBy' | 'createdAt'>) => void;
  userId: string;
}

const PRESET_COLORS = [
  { name: 'Cinzento Calcário', hex: '#8a8885' },
  { name: 'Siena Queimada', hex: '#a8764e' },
  { name: 'Xisto Escuro', hex: '#403d39' },
  { name: 'Limonite Dourada', hex: '#c79c53' },
  { name: 'Âmbar Translúcido', hex: '#ffaa00' },
  { name: 'Branco Giz', hex: '#e3dfd8' },
];

export default function AddFossilModal({ onClose, onSave, userId }: AddFossilModalProps) {
  const [step, setStep] = useState<number>(1);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form State
  const [fossilName, setFossilName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [geologicEra, setGeologicEra] = useState<'Paleozoico' | 'Mesozoico' | 'Cenozoico'>('Mesozoico');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  // 3D Parameters State
  const [fossilType, setFossilType] = useState<FossilCategory>('AMMONITE');
  const [color, setColor] = useState('#8a8885');
  const [wearFactor, setWearFactor] = useState(0.2);
  const [size, setSize] = useState(1.0);
  const [ridges, setRidges] = useState(16);

  // Lists States
  const [scientificFacts, setScientificFacts] = useState<string[]>(['', '', '', '']);
  const [fossilizationProcess, setFossilizationProcess] = useState<string[]>(['', '', '', '', '']);
  const [curiosities, setCuriosities] = useState<string[]>(['', '', '']);

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      question: '',
      options: ['', '', '', ''],
      answerIndex: 0,
      explanation: '',
    },
    {
      question: '',
      options: ['', '', '', ''],
      answerIndex: 0,
      explanation: '',
    },
  ]);

  // AI Assistant Trigger
  const handleAICuration = async () => {
    if (!fossilName.trim()) {
      setAiError('Por favor, introduza o nome do fóssil para que o paleontólogo IA possa ajudar!');
      return;
    }

    setLoadingAI(true);
    setAiError(null);

    try {
      const response = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fossilName }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor de IA.');
      }

      const data = await response.json();

      // Autocomplete fields from AI response
      if (data.fossilName) setFossilName(data.fossilName);
      if (data.geologicEra) setGeologicEra(data.geologicEra);
      if (data.age) setAge(data.age);
      if (data.location) setLocation(data.location);
      if (data.description) setDescription(data.description);
      if (data.fossilType) setFossilType(data.fossilType);
      if (data.color) setColor(data.color);
      if (data.scientificFacts) setScientificFacts(data.scientificFacts);
      if (data.fossilizationProcess) setFossilizationProcess(data.fossilizationProcess);
      if (data.curiosities) setCuriosities(data.curiosities);
      if (data.quizQuestions) setQuizQuestions(data.quizQuestions);

      // Simple visual notification
      setAiError('✨ Curadoria preenchida com sucesso pelo Paleontólogo IA!');
    } catch (err) {
      console.error(err);
      setAiError('Não foi possível obter dados da IA. Por favor, preencha manualmente.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSave = () => {
    // Validate required fields
    if (!fossilName || !groupName || !age || !location || !description) {
      alert('Por favor, preencha todas as informações básicas do Passo 1!');
      setStep(1);
      return;
    }

    onSave({
      fossilName,
      groupName,
      geologicEra,
      age,
      location,
      description,
      fossilType,
      color,
      wearFactor,
      size,
      ridges,
      scientificFacts: scientificFacts.filter(f => f.trim() !== ''),
      fossilizationProcess: fossilizationProcess.filter(p => p.trim() !== ''),
      curiosities: curiosities.filter(c => c.trim() !== ''),
      quizQuestions: quizQuestions.filter(q => q.question.trim() !== ''),
    });
  };

  const handleFactChange = (index: number, val: string) => {
    const updated = [...scientificFacts];
    updated[index] = val;
    setScientificFacts(updated);
  };

  const handleProcessChange = (index: number, val: string) => {
    const updated = [...fossilizationProcess];
    updated[index] = val;
    setFossilizationProcess(updated);
  };

  const handleCuriosityChange = (index: number, val: string) => {
    const updated = [...curiosities];
    updated[index] = val;
    setCuriosities(updated);
  };

  const handleQuizQuestionChange = (qIndex: number, field: string, value: any) => {
    const updated = [...quizQuestions];
    if (field === 'question' || field === 'explanation' || field === 'answerIndex') {
      (updated[qIndex] as any)[field] = value;
    }
    setQuizQuestions(updated);
  };

  const handleQuizOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[oIndex] = value;
    setQuizQuestions(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F1110]/80 backdrop-blur-md flex items-center justify-center p-4" id="add-fossil-modal-overlay">
      <div className="bg-[#0F1110] border border-[#C2A26E]/25 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" id="add-fossil-modal-content">
        
        {/* Header */}
        <div className="p-6 border-b border-[#C2A26E]/20 flex items-center justify-between bg-[#141615]">
          <div>
            <span className="text-[10px] font-mono text-[#C2A26E] uppercase tracking-widest block font-bold">Laboratório de Curadoria Escolar</span>
            <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C2A26E]" />
              Registar Nova Apresentação de Fóssil
            </h2>
          </div>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#C2A26E]/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Tab Indicators */}
        <div className="px-6 py-3 bg-[#141615]/50 border-b border-[#C2A26E]/10 flex items-center justify-between overflow-x-auto text-xs font-medium font-mono">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${step === 1 ? 'border-[#C2A26E] text-[#C2A26E] font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <span className="px-1.5 py-0.5 rounded bg-[#0F1110] border border-[#C2A26E]/20 text-[#C2A26E] text-[10px]">01</span>
              Dados de Campo
            </button>
            <span className="text-[#C2A26E]/20">/</span>
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${step === 2 ? 'border-[#C2A26E] text-[#C2A26E] font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <span className="px-1.5 py-0.5 rounded bg-[#0F1110] border border-[#C2A26E]/20 text-[#C2A26E] text-[10px]">02</span>
              Investigação Científica
            </button>
            <span className="text-[#C2A26E]/20">/</span>
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${step === 3 ? 'border-[#C2A26E] text-[#C2A26E] font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <span className="px-1.5 py-0.5 rounded bg-[#0F1110] border border-[#C2A26E]/20 text-[#C2A26E] text-[10px]">03</span>
              Quiz de Exploração
            </button>
            <span className="text-[#C2A26E]/20">/</span>
            <button
              onClick={() => setStep(4)}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${step === 4 ? 'border-[#C2A26E] text-[#C2A26E] font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <span className="px-1.5 py-0.5 rounded bg-[#0F1110] border border-[#C2A26E]/20 text-[#C2A26E] text-[10px]">04</span>
              Design Fóssil 3D
            </button>
          </div>
          <span className="text-slate-500 hidden md:inline uppercase tracking-widest text-[10px]">PASSO {step} DE 4</span>
        </div>

        {/* Modal Body Grid */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-[#0F1110]/40 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          
          {/* LEFT SIDE (Live 3D Preview Panel in step 4 or context info) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="h-full min-h-[300px] lg:min-h-0 bg-[#141615] rounded-2xl border border-[#C2A26E]/20 p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-2 right-2 z-10">
                <span className="px-2.5 py-1 bg-[#0F1110]/95 text-[9px] text-[#C2A26E] font-mono border border-[#C2A26E]/25 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                  <Compass className="w-3 h-3 animate-pulse" /> Antevisão Realista 3D
                </span>
              </div>

              {/* 3D Canvas Box */}
              <div className="flex-grow w-full relative">
                <FossilCanvas3D
                  fossilType={fossilType}
                  color={color}
                  wearFactor={wearFactor}
                  size={size}
                  ridges={ridges}
                  fossilName={fossilName || "Fóssil Desconhecido"}
                />
              </div>

              {/* 3D Specs Summary */}
              <div className="mt-3 bg-[#0F1110] p-3 rounded-xl border border-[#C2A26E]/15 text-[10px] font-mono grid grid-cols-2 gap-2 text-slate-400">
                <div>
                  <span className="text-[#C2A26E]/60">MOLDE GEOMÉTRICO:</span> <span className="text-white font-semibold">{fossilType}</span>
                </div>
                <div>
                  <span className="text-[#C2A26E]/60">PIGMENTAÇÃO:</span> <span className="text-slate-200" style={{ color: color }}>{color}</span>
                </div>
                <div>
                  <span className="text-[#C2A26E]/60">EROSÃO / DESGASTE:</span> <span className="text-slate-200">{(wearFactor * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-[#C2A26E]/60">PUNÇÃO CIENTÍFICA:</span> <span className="text-[#C2A26E]">Estudante</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (Step Content Fields) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-y-auto pr-1">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5" id="step-1-container">
                <div className="bg-[#141615] border border-[#C2A26E]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-xs font-mono font-bold text-[#C2A26E] uppercase tracking-wider flex items-center gap-1.5 justify-center md:justify-start">
                      <Wand2 className="w-4 h-4" />
                      Paleontólogo IA
                    </h3>
                    <p className="text-xs text-slate-400">
                      Introduza o nome de um espécime e a IA recolhe factos científicos e monta as perguntas!
                    </p>
                  </div>
                  <button
                    id="ai-curate-btn"
                    type="button"
                    onClick={handleAICuration}
                    disabled={loadingAI || !fossilName}
                    className="w-full md:w-auto px-4 py-2 bg-white hover:bg-[#C2A26E] disabled:bg-slate-800 disabled:text-slate-500 text-black font-mono font-bold uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg cursor-pointer"
                  >
                    {loadingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        A Curar...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Autopreencher IA
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <div className={`p-3 rounded-xl text-xs ${aiError.startsWith('✨') ? 'bg-emerald-950/20 border border-emerald-800/40 text-emerald-400' : 'bg-rose-950/20 border border-rose-800/40 text-rose-300'}`}>
                    {aiError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Nome do Fóssil <span className="text-rose-400">*</span></label>
                    <input
                      id="input-fossil-name"
                      type="text"
                      placeholder="Ex: T-Rex, Amonite Gigante, Trilobite..."
                      value={fossilName}
                      onChange={(e) => setFossilName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Identificação da Turma <span className="text-rose-400">*</span></label>
                    <input
                      id="input-group-name"
                      type="text"
                      placeholder="Ex: Grupo 4 - 7º Ano A"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Era Geológica <span className="text-rose-400">*</span></label>
                    <select
                      id="input-geologic-era"
                      value={geologicEra}
                      onChange={(e) => setGeologicEra(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                    >
                      <option value="Paleozoico">Paleozoico (541 Ma - 252 Ma)</option>
                      <option value="Mesozoico">Mesozoico (252 Ma - 66 Ma)</option>
                      <option value="Cenozoico">Cenozoico (66 Ma - Presente)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Idade Estimada <span className="text-rose-400">*</span></label>
                    <input
                      id="input-age"
                      type="text"
                      placeholder="Ex: 115 milhões de anos (Cretáceo)"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Local de Descoberta <span className="text-rose-400">*</span></label>
                    <input
                      id="input-location"
                      type="text"
                      placeholder="Ex: Peniche, Portugal"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Resumo Curatorial do Espécime <span className="text-rose-400">*</span></label>
                  <textarea
                    id="input-description"
                    rows={4}
                    placeholder="Descreva o espécime, o seu habitat geográfico ancestral, alimentação ou relevância paleoclimática..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Scientific Content */}
            {step === 2 && (
              <div className="space-y-5" id="step-2-container">
                {/* Scientific Facts Bullet Points */}
                <div className="space-y-2">
                  <h3 className="text-xs font-serif italic text-[#C2A26E] text-sm">Factos Científicos Verificados (Mínimo de 4)</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {scientificFacts.map((fact, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] font-mono text-[#C2A26E] bg-[#141615] px-2.5 py-1.5 rounded-lg border border-[#C2A26E]/20">FACTO {idx + 1}</span>
                        <input
                          type="text"
                          placeholder="Ex: Este grupo possuía garras afiadas no primeiro membro..."
                          value={fact}
                          onChange={(e) => handleFactChange(idx, e.target.value)}
                          className="flex-grow px-3 py-2 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fossilization Process (5 Steps) */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-serif italic text-[#C2A26E] text-sm">Linha do Tempo de Formação (Mínimo de 5 Etapas)</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {fossilizationProcess.map((stepTxt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] font-mono text-[#C2A26E] bg-[#141615] px-2.5 py-1.5 rounded-lg border border-[#C2A26E]/20">ETAPA {idx + 1}</span>
                        <input
                          type="text"
                          placeholder={`Etapa ${idx + 1}: Ex: Morte do espécime e soterramento rápido no lodo...`}
                          value={stepTxt}
                          onChange={(e) => handleProcessChange(idx, e.target.value)}
                          className="flex-grow px-3 py-2 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curiosities */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-serif italic text-[#C2A26E] text-sm">Curiosidades Paleontológicas (3 Destaques)</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {curiosities.map((cur, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] font-mono text-[#C2A26E] bg-[#141615] px-2.5 py-1.5 rounded-lg border border-[#C2A26E]/20">NOTA {idx + 1}</span>
                        <input
                          type="text"
                          placeholder="Ex: Na Idade Média acreditava-se que eram línguas de serpente fossilizadas..."
                          value={cur}
                          onChange={(e) => handleCuriosityChange(idx, e.target.value)}
                          className="flex-grow px-3 py-2 bg-[#141615] border border-[#C2A26E]/20 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Interactive Quiz Builder */}
            {step === 3 && (
              <div className="space-y-6" id="step-3-container">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono text-[#C2A26E] uppercase tracking-widest font-semibold">Criação do Quiz para Visitantes</h3>
                  <span className="text-[9px] text-[#C2A26E]/60 font-mono uppercase tracking-wider">Configure 2 Questões</span>
                </div>

                {quizQuestions.map((qq, qIdx) => (
                  <div key={qIdx} className="p-4 bg-[#141615] border border-[#C2A26E]/20 rounded-2xl space-y-3.5 shadow-lg">
                    <span className="text-[10px] font-mono text-[#C2A26E] font-bold uppercase tracking-wider">Questão {qIdx + 1}</span>
                    
                    {/* Question text */}
                    <input
                      type="text"
                      placeholder="Ex: Que tipo de animal primitivo representavam as trilobites?"
                      value={qq.question}
                      onChange={(e) => handleQuizQuestionChange(qIdx, 'question', e.target.value)}
                      className="w-full px-3 py-2 bg-[#0F1110] border border-[#C2A26E]/20 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-[#C2A26E] transition-colors"
                    />

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {qq.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuizQuestionChange(qIdx, 'answerIndex', oIdx)}
                            className={`px-2 py-1 text-[10px] font-mono rounded font-bold transition-colors cursor-pointer ${qq.answerIndex === oIdx ? 'bg-[#C2A26E] text-black' : 'bg-[#0F1110] text-[#C2A26E] border border-[#C2A26E]/20'}`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </button>
                          <input
                            type="text"
                            placeholder={`Opção ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={(e) => handleQuizOptionChange(qIdx, oIdx, e.target.value)}
                            className="flex-grow px-3 py-1.5 bg-[#0F1110] border border-[#C2A26E]/15 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#C2A26E] transition-colors"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Scientific Explanation */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#C2A26E]/60 font-mono block uppercase">Explicação Científica de Apoio</span>
                      <input
                        type="text"
                        placeholder="Ex: As trilobites eram artrópodes fósseis relacionados com as aranhas e crustáceos actuais..."
                        value={qq.explanation}
                        onChange={(e) => handleQuizQuestionChange(qIdx, 'explanation', e.target.value)}
                        className="w-full px-3 py-2 bg-[#0F1110] border border-[#C2A26E]/15 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#C2A26E] transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 4: 3D Fossil Customization */}
            {step === 4 && (
              <div className="space-y-5" id="step-4-container">
                <h3 className="text-xs font-mono text-[#C2A26E] uppercase tracking-widest font-semibold">Configurador e Escultor Fóssil 3D</h3>

                {/* Model Template Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Template de Geometria Tridimensional</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { type: 'AMMONITE', label: '🐚 Amonite' },
                      { type: 'TRILOBITE', label: '🐜 Trilobite' },
                      { type: 'MEGALODON_TOOTH', label: '🦷 Dente Tubarão' },
                      { type: 'LEAF_IMPRINT', label: '🌿 Imbricação Folha' },
                      { type: 'AMBER_INSECT', label: '💎 Inseto em Âmbar' },
                      { type: 'DINOSAUR_BONE', label: '🦴 Osso Dinossauro' },
                    ].map((btn) => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => setFossilType(btn.type as FossilCategory)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer ${fossilType === btn.type ? 'bg-[#C2A26E]/10 border-[#C2A26E] text-[#C2A26E] shadow-md' : 'bg-[#141615] border-[#C2A26E]/15 text-slate-400 hover:text-slate-200'}`}
                      >
                        <span>{btn.label}</span>
                        {fossilType === btn.type && <span className="w-1.5 h-1.5 rounded-full bg-[#C2A26E] animate-pulse"></span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">Coloração da Rocha / Matriz Mineral</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setColor(preset.hex)}
                        className={`px-2.5 py-1 text-[10px] font-medium font-mono rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${color.toLowerCase() === preset.hex.toLowerCase() ? 'bg-[#C2A26E]/15 border-[#C2A26E] text-[#C2A26E]' : 'bg-[#141615] border-[#C2A26E]/15 text-slate-400 hover:text-slate-300'}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-black/40" style={{ backgroundColor: preset.hex }}></span>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders Grid */}
                <div className="space-y-4 pt-2">
                  
                  {/* Wear Factor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Desgaste por Erosão</span>
                      <span className="font-mono text-[#C2A26E]">{(wearFactor * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.05"
                      value={wearFactor}
                      onChange={(e) => setWearFactor(parseFloat(e.target.value))}
                      className="w-full accent-[#C2A26E] bg-[#141615] h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      <span>Perfeito</span>
                      <span>Corroído</span>
                    </div>
                  </div>

                  {/* Size scale */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Tamanho Relativo (Escala)</span>
                      <span className="font-mono text-[#C2A26E]">{(size).toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={size}
                      onChange={(e) => setSize(parseFloat(e.target.value))}
                      className="w-full accent-[#C2A26E] bg-[#141615] h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      <span>Miniatura</span>
                      <span>Gigante</span>
                    </div>
                  </div>

                  {/* Detail level (ridges / chambers) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Segmentação Estrutural (Espires / Estrias)</span>
                      <span className="font-mono text-[#C2A26E]">{ridges} ondulações</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="40"
                      step="2"
                      value={ridges}
                      onChange={(e) => setRidges(parseInt(e.target.value))}
                      className="w-full accent-[#C2A26E] bg-[#141615] h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      <span>Liso</span>
                      <span>Denso</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-[#141615] border-t border-[#C2A26E]/20 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                id="btn-prev-step"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 text-slate-300 hover:text-white text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1 bg-[#0F1110] hover:bg-[#C2A26E]/10 rounded-xl border border-[#C2A26E]/25 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2px]" /> Anterior
              </button>
            ) : (
              <div className="w-10"></div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-modal"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#C2A26E]/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            
            {step < 4 ? (
              <button
                id="btn-next-step"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 bg-[#1A1C1B] border border-[#C2A26E]/25 hover:bg-[#C2A26E]/10 text-white text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1 rounded-xl transition-colors cursor-pointer"
              >
                Seguinte <ArrowRight className="w-4 h-4 stroke-[2px]" />
              </button>
            ) : (
              <button
                id="btn-save-fossil"
                onClick={handleSave}
                className="px-6 py-3 bg-white hover:bg-[#C2A26E] text-black text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 rounded-xl transition-colors shadow-lg cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3.5px]" /> Publicar Obra
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
