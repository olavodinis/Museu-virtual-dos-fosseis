import React, { useState } from 'react';
import { Search, Sparkles, Plus, ThumbsUp, Compass, Filter, Calendar, TrendingUp, LogIn, LogOut, MapPin, School, Landmark } from 'lucide-react';
import { FossilExhibit } from '../types';

interface MuseumAtriumProps {
  exhibits: FossilExhibit[];
  onSelectExhibit: (exhibit: FossilExhibit) => void;
  onOpenAddModal: () => void;
  onGoogleSignIn: () => void;
  onGuestSignIn: (username: string) => void;
  onSignOut: () => void;
  user: { uid: string; displayName: string | null; photoURL: string | null } | null;
}

export default function MuseumAtrium({
  exhibits,
  onSelectExhibit,
  onOpenAddModal,
  onGoogleSignIn,
  onGuestSignIn,
  onSignOut,
  user,
}: MuseumAtriumProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eraFilter, setEraFilter] = useState<'all' | 'Paleozoico' | 'Mesozoico' | 'Cenozoico'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [guestName, setGuestName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  // Filter and sort logic
  const filteredExhibits = exhibits
    .filter((ex) => {
      const matchesSearch =
        ex.fossilName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEra = eraFilter === 'all' || ex.geologicEra === eraFilter;
      
      return matchesSearch && matchesEra;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return b.likesCount - a.likesCount;
      }
      // Sort newest (by date string or fallback id)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Calculate museum stats
  const totalSpecimens = exhibits.length;
  const totalLikes = exhibits.reduce((sum, curr) => sum + curr.likesCount, 0);
  const distinctGroups = new Set(exhibits.map((ex) => ex.groupName)).size;

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      onGuestSignIn(guestName.trim());
      setShowGuestForm(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-8 animate-fadeIn" id="museum-atrium-root">
      
      {/* 1. HERO FAÇADE BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-[#C2A26E]/20 bg-gradient-to-br from-[#141615] via-[#1A1C1B] to-[#141615] p-6 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6" id="museum-hero-banner">
        
        {/* Decorative Grid Graphic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#c2a26e05_1px,transparent_1px),linear-gradient(to_bottom,#c2a26e05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none select-none"></div>

        <div className="space-y-4 max-w-2xl text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C2A26E]/10 border border-[#C2A26E]/30 text-[10px] font-mono text-[#C2A26E] rounded-full tracking-widest uppercase">
            <Landmark className="w-3.5 h-3.5" /> Galeria Paleontológica • Curadoria
          </div>
          
          <h1 className="text-3xl md:text-5xl font-serif italic text-white tracking-tight leading-none">
            Museu Virtual <span className="bg-gradient-to-r from-[#C2A26E] via-amber-100 to-[#C2A26E] bg-clip-text text-transparent not-italic font-bold font-serif">dos Fósseis</span>
          </h1>
          
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg">
            Explora alguns fósseis criados em 3D e curados por equipas de estudantes de Ciências Naturais! Analisa factos científicos, responde aos testes práticos e regista a tua descoberta!
          </p>
        </div>

        {/* STATS BOARDS PANEL */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 w-full md:w-auto max-w-md z-10 font-mono">
          <div className="p-4 bg-[#1A1C1B] border border-[#C2A26E]/20 rounded-2xl text-center shadow-md">
            <span className="text-[9px] text-[#C2A26E]/60 block uppercase tracking-widest mb-1">Espécimes</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-[#C2A26E] block">{totalSpecimens}</span>
          </div>
          <div className="p-4 bg-[#1A1C1B] border border-[#C2A26E]/20 rounded-2xl text-center shadow-md">
            <span className="text-[9px] text-[#C2A26E]/60 block uppercase tracking-widest mb-1">Incentivos</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-[#C2A26E] block">{totalLikes}</span>
          </div>
          <div className="p-4 bg-[#1A1C1B] border border-[#C2A26E]/20 rounded-2xl text-center shadow-md">
            <span className="text-[9px] text-[#C2A26E]/60 block uppercase tracking-widest mb-1">Escolas</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-[#C2A26E] block">{distinctGroups}</span>
          </div>
        </div>

      </div>

      {/* 2. CURATOR CONTROL & AUTH PANEL */}
      <div className="bg-[#141615] border border-[#C2A26E]/25 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg" id="museum-curator-auth-panel">
        
        {user ? (
          /* Logged In */
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Curador'} className="w-10 h-10 rounded-full border-2 border-[#C2A26E]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1A1C1B] border-2 border-[#C2A26E] flex items-center justify-center text-[#C2A26E] text-xs font-mono font-bold">
                {user.displayName?.substring(0, 2).toUpperCase() || 'CU'}
              </div>
            )}
            <div className="text-left">
              <span className="text-[10px] text-[#C2A26E]/70 font-mono block uppercase tracking-wider">Paleontólogo de Serviço</span>
              <span className="text-xs font-semibold text-[#E5E7EB] font-sans block">{user.displayName}</span>
            </div>
            <button
              id="sign-out-btn"
              onClick={onSignOut}
              className="ml-2 text-[10px] font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer uppercase tracking-wider"
            >
              Terminar Sessão
            </button>
          </div>
        ) : (
          /* Not Logged In options */
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="text-left mr-2">
              <span className="text-xs font-semibold text-slate-200 block">Desejas expor um fóssil neste panteão?</span>
              <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Identifica o teu grupo escolar ou visitante:</span>
            </div>

            {showGuestForm ? (
              <form onSubmit={handleGuestSubmit} className="flex items-center gap-1.5 animate-fadeIn">
                <input
                  type="text"
                  placeholder="Ex: Grupo 04 - 10º Ano Évora"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="px-3 py-1.5 bg-[#0F1110] border border-[#C2A26E]/30 rounded-xl text-xs text-[#E5E7EB] placeholder-slate-600 focus:outline-none focus:border-[#C2A26E]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-white hover:bg-[#C2A26E] text-black text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuestForm(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="google-login-btn"
                  onClick={onGoogleSignIn}
                  className="px-4 py-2 bg-[#1A1C1B] border border-[#C2A26E]/20 hover:bg-[#C2A26E]/10 text-[#E5E7EB] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[#C2A26E]" /> Google Login
                </button>
                <button
                  id="guest-login-btn"
                  onClick={() => setShowGuestForm(true)}
                  className="px-4 py-2 bg-[#1A1C1B] border border-[#C2A26E]/20 hover:bg-[#C2A26E]/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <School className="w-4 h-4 text-[#C2A26E]" /> Identificar Turma
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Button: Register new exhibit */}
        <button
          id="btn-register-new-fossil"
          onClick={onOpenAddModal}
          className="w-full md:w-auto px-6 py-3 bg-white hover:bg-[#C2A26E] text-black font-bold font-mono tracking-widest uppercase rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3px]" /> Carregar Projeto
        </button>

      </div>

      {/* 3. FILTERS, SEARCH & ORDERING PANEL */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#141615]/60 p-4 border border-[#C2A26E]/15 rounded-2xl shadow-inner" id="museum-filters-container">
        
        {/* Search input bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#C2A26E]/60">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="fossil-search-bar"
            type="text"
            placeholder="Procurar espécimes ou turmas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0F1110] border border-[#C2A26E]/20 rounded-xl text-xs text-[#E5E7EB] placeholder-slate-600 focus:outline-none focus:border-[#C2A26E] transition-colors"
          />
        </div>

        {/* Era categories pill filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs font-mono">
          <button
            id="filter-era-all"
            onClick={() => setEraFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${eraFilter === 'all' ? 'bg-[#C2A26E]/10 border border-[#C2A26E]/40 text-[#C2A26E] font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Todos os Espécimes
          </button>
          <button
            id="filter-era-paleo"
            onClick={() => setEraFilter('Paleozoico')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${eraFilter === 'Paleozoico' ? 'bg-[#C2A26E]/15 border border-[#C2A26E]/40 text-[#C2A26E] font-semibold' : 'text-slate-400 hover:text-[#C2A26E]/80'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2A26E]"></span>
            Paleozoico
          </button>
          <button
            id="filter-era-meso"
            onClick={() => setEraFilter('Mesozoico')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${eraFilter === 'Mesozoico' ? 'bg-[#C2A26E]/25 border border-[#C2A26E]/50 text-white font-semibold' : 'text-slate-400 hover:text-[#C2A26E]/80'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2A26E] animate-pulse"></span>
            Mesozoico
          </button>
          <button
            id="filter-era-ceno"
            onClick={() => setEraFilter('Cenozoico')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${eraFilter === 'Cenozoico' ? 'bg-[#C2A26E]/15 border border-[#C2A26E]/40 text-[#C2A26E] font-semibold' : 'text-slate-400 hover:text-[#C2A26E]/80'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2A26E]"></span>
            Cenozoico
          </button>
        </div>

        {/* Sorting selector */}
        <div className="flex items-center gap-2 text-xs font-mono w-full md:w-auto justify-end">
          <span className="text-slate-500">ORDENAÇÃO:</span>
          <button
            id="sort-btn-newest"
            onClick={() => setSortBy('newest')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${sortBy === 'newest' ? 'text-[#C2A26E] font-bold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Recentes
          </button>
          <button
            id="sort-btn-popular"
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${sortBy === 'popular' ? 'text-[#C2A26E] font-bold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Populares
          </button>
        </div>

      </div>

      {/* 4. GALLERY EXHIBITION GRID */}
      {filteredExhibits.length === 0 ? (
        <div className="text-center py-16 bg-[#141615] border border-[#C2A26E]/15 rounded-3xl" id="empty-gallery-indicator">
          <Compass className="w-12 h-12 text-[#C2A26E]/40 mx-auto mb-3 animate-spin" style={{ animationDuration: '25s' }} />
          <h3 className="text-sm font-serif italic text-slate-300">Nenhum fóssil exposto</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            Não foram encontrados trabalhos científicos com esta combinação. Sê o pioneiro e regista o primeiro!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="exhibition-cards-grid">
          {filteredExhibits.map((ex) => {
            // Get unique badge colors based on era
            const eraColor = ex.geologicEra === 'Paleozoico' ? 'border-[#C2A26E]/20 bg-amber-950/20 text-amber-400' :
                             ex.geologicEra === 'Mesozoico' ? 'border-[#C2A26E]/40 bg-[#C2A26E]/10 text-[#C2A26E]' :
                             'border-[#C2A26E]/20 bg-sky-950/20 text-sky-400';

            return (
              <div
                key={ex.id}
                id={`fossil-card-${ex.id}`}
                onClick={() => onSelectExhibit(ex)}
                className="group relative rounded-2xl bg-[#141615] border border-[#C2A26E]/20 hover:border-[#C2A26E]/45 shadow-lg overflow-hidden flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-[#C2A26E]/5 duration-300 cursor-pointer"
              >
                
                {/* Visual Thumbnail Stage header */}
                <div className="h-44 bg-[#0F1110] relative overflow-hidden flex items-center justify-center border-b border-[#C2A26E]/15 p-4">
                  
                  {/* Procedural Grid Accent */}
                  <div className="absolute inset-0 bg-[radial-gradient(#c2a26e0b_1.2px,transparent_1.2px)] bg-[size:16px_16px] pointer-events-none select-none"></div>

                  {/* Concentric Orbits - Artistic theme */}
                  <div className="absolute w-28 h-28 rounded-full border border-[#C2A26E]/5 flex items-center justify-center animate-spin-slow pointer-events-none">
                    <div className="w-22 h-22 rounded-full border border-dashed border-[#C2A26E]/10"></div>
                  </div>

                  {/* Fossil Representative Icon/Shape */}
                  <div className="text-5xl select-none filter drop-shadow-[0_0_15px_rgba(194,162,110,0.35)] transform transition-transform group-hover:scale-115 duration-500 flex flex-col items-center gap-1.5 z-10">
                    {ex.fossilType === 'AMMONITE' && '🐚'}
                    {ex.fossilType === 'TRILOBITE' && '🐜'}
                    {ex.fossilType === 'MEGALODON_TOOTH' && '🦷'}
                    {ex.fossilType === 'LEAF_IMPRINT' && '🌿'}
                    {ex.fossilType === 'AMBER_INSECT' && '💎'}
                    {ex.fossilType === 'DINOSAUR_BONE' && '🦴'}
                    
                    <span className="text-[8px] uppercase tracking-[0.25em] font-mono text-slate-500 font-bold">
                      {ex.fossilType.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Geological Era badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${eraColor}`}>
                      {ex.geologicEra}
                    </span>
                  </div>

                  {/* Likes counter badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 border border-[#C2A26E]/20 text-[10px] font-mono text-slate-300 px-2 py-0.5 rounded-full z-20">
                    <ThumbsUp className="w-3 h-3 text-[#C2A26E] fill-[#C2A26E]/10" />
                    <span>{ex.likesCount}</span>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-5 flex-grow space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-serif italic text-white group-hover:text-[#C2A26E] transition-colors line-clamp-1">
                      {ex.fossilName}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ex.description}
                    </p>
                  </div>

                  {/* Bottom details */}
                  <div className="pt-3 border-t border-[#C2A26E]/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-[#C2A26E]" />
                      <span className="line-clamp-1 max-w-[140px] text-slate-400 font-medium">{ex.groupName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400/80" />
                      <span className="line-clamp-1 max-w-[80px] text-slate-400">{ex.location.split(',')[0]}</span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
