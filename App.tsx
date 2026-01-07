import React, { useState, useEffect } from 'react';
import { PokemonCard, Binder, Trade, AppState } from './types';
import { loadState, saveState } from './services/storage';
import { searchPokemonCard } from './services/pokemonTcgService';
import { convertPrice } from './services/currency';
import Navigation from './components/Navigation';
import AutoBinderModal from './components/AutoBinderModal';

// Trade Item Component
const TradeItem: React.FC<{
  trade: Trade;
  netProfit: number;
  givenCards: PokemonCard[];
  receivedCards: PokemonCard[];
  currency: string;
  onUpdateNotes: (notes: string) => void;
  onClick: () => void;
}> = ({ trade, netProfit, givenCards, receivedCards, currency, onUpdateNotes, onClick }) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(trade.notes || '');
  const cardBackUrl = "https://images.pokemontcg.io/swsh1/1_hires.png";

  return (
    <div 
      onClick={onClick}
      className="bg-[#1a252b] p-6 rounded-2xl border-2 border-white/5 shadow-2xl hover:border-white/10 transition-colors cursor-pointer active:scale-98"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="font-black text-xs uppercase tracking-widest">{trade.partnerName || 'Show Guest'}</span>
          <span className="text-[10px] font-bold opacity-30 mt-1">{new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className={`text-lg font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} {currency}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 my-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] font-black opacity-40 uppercase">Out</div>
          <div className="flex flex-wrap gap-1 max-w-[120px]">
            {givenCards.slice(0, 3).map(card => (
              <img key={card.id} src={card.imageUrl} className="w-8 h-11 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = cardBackUrl; }} />
            ))}
            {givenCards.length > 3 && (
              <div className="w-8 h-11 bg-black/30 rounded flex items-center justify-center text-[8px] font-black">
                +{givenCards.length - 3}
              </div>
            )}
          </div>
          <div className="text-[9px] font-black opacity-50">{givenCards.length} cards</div>
        </div>
        
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 opacity-60">
          <path d="M8 3l-4 4 4 4M16 21l4-4-4-4M4 7h16M4 17h16" />
        </svg>
        
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] font-black opacity-40 uppercase">In</div>
          <div className="flex flex-wrap gap-1 max-w-[120px]">
            {receivedCards.slice(0, 3).map((card, idx) => (
              <img key={idx} src={card.imageUrl} className="w-8 h-11 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = cardBackUrl; }} />
            ))}
            {receivedCards.length > 3 && (
              <div className="w-8 h-11 bg-black/30 rounded flex items-center justify-center text-[8px] font-black">
                +{receivedCards.length - 3}
              </div>
            )}
          </div>
          <div className="text-[9px] font-black opacity-50">{receivedCards.length} cards</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => {
                onUpdateNotes(notesValue);
                setEditingNotes(false);
              }}
              placeholder="Add notes..."
              className="w-full bg-black/30 rounded-lg p-2 text-[10px] font-black outline-none border border-white/5 focus:bg-black/50 resize-none text-white"
              rows={2}
              autoFocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateNotes(notesValue);
                setEditingNotes(false);
              }}
              className="text-[9px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity"
            >
              Save
            </button>
          </div>
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEditingNotes(true);
            }}
            className="text-[10px] font-black opacity-40 hover:opacity-60 cursor-pointer min-h-[20px] transition-opacity text-center"
          >
            {trade.notes || 'Tap to add notes...'}
          </div>
        )}
      </div>
    </div>
  );
};

type View = 'title' | 'app';

const CARD_BACK_URL = "https://images.pokemontcg.io/swsh1/1_hires.png";
const LOGO_URL = "https://i.imgur.com/JFZhE1P.png";
const INVENTORY_ICON = "https://i.imgur.com/vB6EKE8.png";

const App: React.FC = () => {
  const [view, setView] = useState<View>('title');
  const [activeTab, setActiveTab] = useState('collection');
  const [state, setState] = useState<AppState>(loadState());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<PokemonCard>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Modals state
  const [showAutoBinder, setShowAutoBinder] = useState(false);
  const [showManualBinder, setShowManualBinder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newBinderName, setNewBinderName] = useState('');
  const [addingCardToBinders, setAddingCardToBinders] = useState<Partial<PokemonCard> | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editingBinder, setEditingBinder] = useState<Binder | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  
  // Received Search within Trade
  const [recvSearchQuery, setRecvSearchQuery] = useState('');
  const [recvSearchResults, setRecvSearchResults] = useState<Partial<PokemonCard>[]>([]);
  const [isRecvSearching, setIsRecvSearching] = useState(false);

  const [tradeForm, setTradeForm] = useState<{
    partner: string;
    notes: string;
    cashGiven: number;
    cashReceived: number;
    givingIds: string[];
    receivingCards: Partial<PokemonCard>[];
  }>({
    partner: '', notes: '', cashGiven: 0, cashReceived: 0, givingIds: [], receivingCards: []
  });

  // Automatically save state whenever it changes for persistent local tracking
  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setSearchPage(1);
    setHasMoreResults(false);
    
    try {
      const result = await searchPokemonCard(searchQuery, state.currency, 1, 15); // Load 15 cards per page
      setSearchResults(result.cards);
      setHasMoreResults(result.hasMore);
      setSearchPage(1);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      // Minimal UX: show the real reason instead of silently showing "No results".
      alert(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const loadMoreResults = async () => {
    if (isLoadingMore || !hasMoreResults || !searchQuery) return;
    setIsLoadingMore(true);
    try {
      const result = await searchPokemonCard(searchQuery, state.currency, searchPage + 1, 15);
      setSearchResults(prev => [...prev, ...result.cards]);
      setHasMoreResults(result.hasMore);
      setSearchPage(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    if (activeTab !== 'market' || !hasMoreResults || isLoadingMore || !searchQuery) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreResults && !isLoadingMore) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMoreResults, isLoadingMore, activeTab, searchQuery, searchPage]);

  const handleRecvSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recvSearchQuery) return;
    setIsRecvSearching(true);
    try {
      const result = await searchPokemonCard(recvSearchQuery, state.currency, 1, 20);
      setRecvSearchResults(result.cards);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setIsRecvSearching(false);
    }
  };

  const finalizeAddCard = (binderId?: string) => {
    if (!addingCardToBinders) return;
    const newCard = { ...addingCardToBinders, id: `card-${Date.now()}` } as PokemonCard;
    
    setState(prev => {
      const updatedCollection = [newCard, ...prev.collection];
      const updatedBinders = binderId 
        ? prev.binders.map(b => b.id === binderId ? { ...b, cardIds: [...b.cardIds, newCard.id] } : b)
        : prev.binders;
      
      return {
        ...prev,
        collection: updatedCollection,
        binders: updatedBinders
      };
    });

    setAddingCardToBinders(null);
    setSearchResults([]);
    setSearchQuery('');
    setActiveTab('collection');
  };

  const removeCard = (id: string) => {
    setState(prev => ({
      ...prev,
      collection: prev.collection.filter(c => c.id !== id),
      binders: prev.binders.map(b => ({ ...b, cardIds: b.cardIds.filter(cid => cid !== id) }))
    }));
  };

  const createBinder = (name: string, cardIds: string[] = [], minPrice?: number, maxPrice?: number) => {
    const newBinder: Binder = { 
      id: `binder-${Date.now()}`, 
      name: name || "New Binder", 
      cardIds, 
      color: 'blue',
      minPrice,
      maxPrice
    };
    setState(prev => ({ ...prev, binders: [newBinder, ...prev.binders] }));
    setShowAutoBinder(false); 
    setShowManualBinder(false); 
    setNewBinderName(''); 
    setActiveTab('binders');
  };

  const changeCurrency = (curr: AppState['currency']) => {
    setState(prev => {
      const oldCurrency = prev.currency;
      // Convert all existing card prices to new currency
      const convertedCollection = prev.collection.map(card => ({
        ...card,
        price: convertPrice(card.price, oldCurrency, curr)
      }));
      
      // Convert trade cash amounts
      const convertedTrades = prev.trades.map(trade => ({
        ...trade,
        cashGiven: convertPrice(trade.cashGiven, trade.currency, curr),
        cashReceived: convertPrice(trade.cashReceived, trade.currency, curr),
        currency: curr
      }));
      
      return {
        ...prev,
        currency: curr,
        collection: convertedCollection,
        trades: convertedTrades
      };
    });
    setShowSettings(false);
  };

  const toggleCardForTrade = (id: string) => {
    setTradeForm(prev => ({
      ...prev,
      givingIds: prev.givingIds.includes(id) 
        ? prev.givingIds.filter(gid => gid !== id) 
        : [...prev.givingIds, id]
    }));
  };

  const addReceivedCardToTrade = (card: Partial<PokemonCard>) => {
    setTradeForm(prev => ({
      ...prev,
      receivingCards: [...prev.receivingCards, card]
    }));
    setRecvSearchResults([]);
    setRecvSearchQuery('');
  };

  const removeReceivedCardFromTrade = (idx: number) => {
    setTradeForm(prev => ({
      ...prev,
      receivingCards: prev.receivingCards.filter((_, i) => i !== idx)
    }));
  };

  const finishTrade = () => {
    const tradeId = `trade-${Date.now()}`;
    
    // Get full card data for cards being traded away (before they're removed)
    const givenCards: PokemonCard[] = state.collection
      .filter(c => tradeForm.givingIds.includes(c.id))
      .map(c => ({ ...c })); // Create copies to preserve data
    
    const finalizedReceived: PokemonCard[] = tradeForm.receivingCards.map(rc => ({
      ...rc, 
      id: `card-recv-${Math.random().toString(36).substr(2, 9)}`, 
      lastUpdated: new Date().toISOString(), 
      condition: 'NM'
    })) as PokemonCard[];

    const newTrade: Trade = {
      id: tradeId, 
      date: new Date().toISOString(), 
      givenCardIds: tradeForm.givingIds,
      givenCards: givenCards, // Store full card data
      receivedCards: finalizedReceived,
      cashGiven: tradeForm.cashGiven, 
      cashReceived: tradeForm.cashReceived, 
      partnerName: tradeForm.partner, 
      notes: tradeForm.notes, 
      currency: state.currency
    };
    
    setState(prev => {
      const remainingCollection = prev.collection.filter(c => !tradeForm.givingIds.includes(c.id));
      const updatedCollection = [...finalizedReceived, ...remainingCollection];

      const updatedBinders = prev.binders.map(b => {
        const matchingReceivedIds = finalizedReceived
          .filter(card => 
            (b.minPrice !== undefined && (card.price || 0) >= b.minPrice) && 
            (b.maxPrice !== undefined && (card.price || 0) <= b.maxPrice)
          )
          .map(c => c.id);

        const filteredCardIds = b.cardIds.filter(cid => !tradeForm.givingIds.includes(cid));
        return { 
          ...b, 
          cardIds: [...filteredCardIds, ...matchingReceivedIds] 
        };
      });

      return {
        ...prev,
        collection: updatedCollection,
        binders: updatedBinders,
        trades: [newTrade, ...prev.trades]
      };
    });
    
    setTradeForm({
      partner: '', notes: '', cashGiven: 0, cashReceived: 0, givingIds: [], receivingCards: []
    });
    setShowTradeModal(false);
    setActiveTab('trades');
  };

  const handleFabClick = () => {
    if (activeTab === 'collection') setActiveTab('market');
    else if (activeTab === 'binders') setShowAutoBinder(true);
    else if (activeTab === 'trades') setShowTradeModal(true);
  };

  const totalValue = state.collection.reduce((sum, c) => sum + (c.price || 0), 0);

  if (view === 'title') {
    return (
      <div className="min-h-screen auth-bg flex flex-col items-center justify-center p-8 text-white">
        <div className="flex flex-col items-center justify-between w-full h-screen max-w-md">
          <div className="flex-1 flex items-center justify-center pt-20 animate-in fade-in duration-700">
            <img src={LOGO_URL} alt="PackVault Logo" className="w-64 h-64 sm:w-80 sm:h-80 object-contain pixelated mx-auto drop-shadow-2xl" />
          </div>
          <div className="w-full px-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '200ms'}}>
            <button 
              onClick={() => setView('app')} 
              className="w-full py-5 px-8 bg-[#2a110d] text-white font-black text-2xl sm:text-3xl rounded-full border-4 border-white shadow-lg hover:scale-105 active:scale-95 transition-all touch-manipulation"
            >
              PackVault
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen main-bg text-white pb-40 relative overflow-x-hidden">
      <button onClick={() => setShowSettings(true)} className="absolute top-4 left-4 sm:top-8 sm:left-8 w-10 h-10 sm:w-12 sm:h-12 opacity-40 hover:opacity-100 active:opacity-100 transition-all z-10 touch-manipulation">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
      </button>

      <button onClick={() => setActiveTab('market')} className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 opacity-40 hover:opacity-100 active:opacity-100 transition-all hover:scale-110 z-10 touch-manipulation">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
      </button>

      <main className="px-4 sm:px-6 pt-16 sm:pt-20">
        {activeTab === 'collection' && (
          <section className="flex flex-col items-center animate-in fade-in duration-500">
            {/* Minimal Header with correct icon and smaller value text */}
            <div className="flex flex-col items-center mb-12 text-center">
               <div className="header-pill py-2.5 px-6">
                  <img src={INVENTORY_ICON} alt="Inventory" className="w-6 h-6 object-contain pixelated" />
                  <span className="text-2xl font-black tracking-tighter">${totalValue.toFixed(2)}</span>
                  <span className="text-[10px] font-black opacity-30 uppercase ml-1">{state.currency}</span>
               </div>
               <span className="text-[9px] font-black uppercase opacity-20 tracking-[0.3em] mt-2">Vault Value</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-md no-scrollbar">
              {state.collection.length > 0 ? (
                state.collection.map(card => (
                  <div key={card.id} className="bg-[#1a252b] aspect-[3.2/4] rounded-2xl overflow-hidden relative group border-2 border-white/5 shadow-2xl transition-transform hover:scale-[1.02]">
                    <img src={card.imageUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                    <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-lg">
                       <span className="font-black text-[10px] uppercase text-white">${(card.price || 0).toFixed(2)}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeCard(card.id); }} className="absolute top-3 left-3 bg-red-600/90 rounded-full w-6 h-6 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-20 opacity-10 italic uppercase tracking-[0.2em] font-black">Collection Empty</div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'binders' && (
          <section className="flex flex-col items-center animate-in fade-in duration-500">
            <div className="header-pill mb-12">
              <div className="icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Binders</span>
                <span className="text-3xl font-black leading-none">{state.binders.length}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mb-8 w-full max-w-md px-4">
              <button 
                onClick={() => setShowManualBinder(true)}
                className="bg-[#7A3126] border-2 border-white/20 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#8b3a2e] transition-all active:scale-95 shadow-lg text-white"
              >
                Create Binder
              </button>
              <button 
                onClick={() => setShowAutoBinder(true)}
                className="bg-[#7A3126] border-2 border-white/20 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#8b3a2e] transition-all active:scale-95 shadow-lg text-white"
              >
                Auto-Create Binder
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-md">
              {state.binders.length > 0 ? (
                state.binders.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => setEditingBinder(b)}
                    className="bg-[#1a252b] aspect-[3.2/4] rounded-2xl flex flex-col items-center justify-center p-6 border-2 border-white/10 shadow-2xl group transition-all hover:bg-[#212d33] cursor-pointer active:scale-95"
                  >
                    <span className="font-black text-sm uppercase text-center truncate w-full tracking-tighter group-hover:scale-105 transition-transform">{b.name}</span>
                    <span className="text-[11px] font-black opacity-30 mt-3 uppercase tracking-widest">{b.cardIds.length} cards</span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 opacity-10 italic uppercase tracking-[0.2em]">No Binders</div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'trades' && (
          <section className="flex flex-col items-center animate-in fade-in duration-500 w-full max-w-md">
            <div className="header-pill mb-12">
              <div className="icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6"><path d="M16 3l4 4-4 4M8 21l-4-4 4-4M20 7H4M4 17h16" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Trades</span>
                <span className="text-3xl font-black leading-none">{state.trades.length}</span>
              </div>
            </div>
            <div className="space-y-6 w-full">
              {state.trades.length > 0 ? (() => {
                // Group trades by date
                const grouped = state.trades.reduce((acc, trade) => {
                  const date = new Date(trade.date).toLocaleDateString();
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(trade);
                  return acc;
                }, {} as Record<string, typeof state.trades>);

                return Object.entries(grouped).map(([date, trades]) => (
                  <div key={date} className="space-y-4">
                    <div className="text-[9px] font-black uppercase opacity-30 tracking-widest px-2">{date}</div>
                    {trades.map(t => {
                      // Use stored givenCards if available, otherwise try to find in collection
                      const givenCards = t.givenCards || state.collection.filter(c => t.givenCardIds.includes(c.id));
                      const givenValue = givenCards.reduce((sum, c) => sum + (c.price || 0), 0);
                      const receivedValue = t.receivedCards.reduce((sum, c) => sum + (c.price || 0), 0);
                      const netProfit = (t.cashReceived - t.cashGiven) + (receivedValue - givenValue);
                      
                      const updateNotes = (newNotes: string) => {
                        setState(prev => ({
                          ...prev,
                          trades: prev.trades.map(tr => 
                            tr.id === t.id ? { ...tr, notes: newNotes } : tr
                          )
                        }));
                      };

                      return (
                        <TradeItem 
                          key={t.id} 
                          trade={t} 
                          netProfit={netProfit}
                          givenCards={givenCards}
                          receivedCards={t.receivedCards}
                          currency={state.currency}
                          onUpdateNotes={updateNotes}
                          onClick={() => setViewingTrade(t)}
                        />
                      );
                    })}
                  </div>
                ));
              })() : (
                <div className="text-center py-10 opacity-10 italic uppercase tracking-[0.2em]">No Trades Recorded</div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'market' && (
          <section className="space-y-6 sm:space-y-8 max-w-md mx-auto relative min-h-[60vh] animate-in fade-in duration-500">
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter ml-1 drop-shadow-xl">Market</h2>
            <form onSubmit={handleSearch} className="relative z-10">
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Scan cards..." 
                className="input-field shadow-2xl"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity" disabled={isSearching}>{isSearching ? '...' : 'GO'}</button>
            </form>
            
            {isSearching && (
              <div className="flex flex-col items-center py-24 gap-8">
                <div className="loading-pulse"></div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[13px] font-black uppercase tracking-[0.3em] opacity-50 animate-pulse">Scanning Prices...</span>
                </div>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-4 pb-28">
                {searchResults.map((result, idx) => (
                  <div key={result.id || idx} className="bg-[#1a252b] rounded-2xl p-4 flex gap-5 items-center border-2 border-white/5 hover:border-white/20 transition-all shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300" style={{animationDelay: `${idx * 20}ms`}}>
                    <div className="relative">
                       <img src={result.imageUrl} className="w-14 h-20 object-cover rounded-lg shadow-xl" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-black text-[12px] truncate uppercase tracking-tighter leading-tight mb-1">{result.name}</h3>
                      <div className="flex items-center gap-2">
                         <span className="text-xl font-black text-white leading-none">
                           ${(result.price || 0).toFixed(2)}
                         </span>
                         <span className="text-[9px] font-black opacity-40 uppercase bg-black/30 px-1.5 py-0.5 rounded tracking-tighter">{result.rarity}</span>
                      </div>
                      <div className="text-[10px] font-black opacity-30 uppercase tracking-tighter truncate mt-2">{result.set} • #{result.number}</div>
                    </div>
                    <button onClick={() => setAddingCardToBinders(result)} className="bg-white text-black w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-slate-100 touch-manipulation">+</button>
                  </div>
                ))}
                
                {/* Infinite scroll sentinel */}
                {hasMoreResults && (
                  <div id="scroll-sentinel" className="flex justify-center py-8">
                    {isLoadingMore ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="loading-pulse"></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50">Loading more...</span>
                      </div>
                    ) : (
                      <div className="h-4"></div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery && (
              <div className="text-center py-20 opacity-40 italic uppercase tracking-[0.2em] text-sm">
                No results found
              </div>
            )}
          </section>
        )}
      </main>

      <div className="fab touch-manipulation" onClick={handleFabClick}>
         <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" className="w-6 h-6"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Settings Modal (Currency Selection) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-6 backdrop-blur-lg">
          <div className="bg-[#7A3126] border-2 border-white/20 rounded-[2.5rem] w-full max-w-xs p-10 text-center shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black uppercase mb-8 tracking-tighter italic">Settings</h2>
            <div className="space-y-4 mb-10">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest block mb-4">Select Currency</label>
              {(['USD', 'CAD', 'EUR', 'GBP'] as const).map(curr => (
                <button 
                  key={curr}
                  onClick={() => changeCurrency(curr)}
                  className={`w-full p-4 rounded-xl font-black transition-all border-2 ${state.currency === curr ? 'bg-white text-black border-white shadow-xl' : 'bg-black/20 text-white border-white/5 hover:border-white/20'}`}
                >
                  {curr}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className="text-[11px] font-black uppercase opacity-40 tracking-[0.2em] hover:opacity-100 transition-opacity">Close Settings</button>
          </div>
        </div>
      )}

      {showAutoBinder && (
        <AutoBinderModal 
          collection={state.collection} 
          onClose={() => setShowAutoBinder(false)} 
          onCreate={createBinder} 
        />
      )}

      {showManualBinder && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-lg">
          <div className="bg-[#7A3126] border-2 border-white/20 rounded-[2.5rem] w-full max-w-xs p-10 text-center shadow-2xl animate-in zoom-in duration-300 relative">
            <button 
              onClick={() => {
                setShowManualBinder(false);
                setNewBinderName('');
              }}
              className="absolute top-4 right-4 text-3xl opacity-40 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black uppercase mb-8 tracking-tighter italic">New Binder</h2>
            <input type="text" placeholder="Binder Name..." value={newBinderName} onChange={e => setNewBinderName(e.target.value)} className="w-full bg-black/30 rounded-xl h-14 px-5 font-black mb-10 border-none outline-none text-white focus:bg-black/50 transition-colors" />
            <button onClick={() => createBinder(newBinderName)} className="ref-button bg-white text-black border-none px-14 py-4 text-sm font-black tracking-widest uppercase">Create Binder</button>
          </div>
        </div>
      )}

      {showTradeModal && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-start justify-center p-6 backdrop-blur-lg overflow-y-auto">
          <div className="bg-[#7A3126] border-2 border-white/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300 mb-20">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">New Trade</h2>
              <button onClick={() => setShowTradeModal(false)} className="text-3xl opacity-40 hover:opacity-100 transition-opacity">✕</button>
            </div>
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Deal Details</h3>
                <input type="text" placeholder="Partner Name" onChange={e => setTradeForm(p => ({...p, partner: e.target.value}))} className="w-full bg-black/30 rounded-xl h-12 px-5 font-black outline-none border border-white/5 focus:bg-black/50 transition-colors" />
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Financials</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Cash In (+)</label>
                    <input type="number" placeholder="0.00" onChange={e => setTradeForm(p => ({...p, cashReceived: Number(e.target.value)}))} className="w-full bg-black/30 rounded-xl h-12 px-5 font-black outline-none border border-emerald-500/20 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Cash Out (-)</label>
                    <input type="number" placeholder="0.00" onChange={e => setTradeForm(p => ({...p, cashGiven: Number(e.target.value)}))} className="w-full bg-black/30 rounded-xl h-12 px-5 font-black outline-none border border-rose-500/20 text-rose-400" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Inventory Out</h3>
                  <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded">{tradeForm.givingIds.length} selected</span>
                </div>
                <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto no-scrollbar p-1">
                  {state.collection.map(card => {
                    const isSelected = tradeForm.givingIds.includes(card.id);
                    return (
                      <div 
                        key={card.id} 
                        onClick={() => toggleCardForTrade(card.id)}
                        className={`aspect-[3.2/4] rounded-lg overflow-hidden relative cursor-pointer border-2 transition-all ${isSelected ? 'border-white scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={card.imageUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                        {isSelected && (
                          <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                            <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Inventory In</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowTradeModal(false);
                      setActiveTab('market');
                      setSearchQuery(recvSearchQuery);
                    }}
                    className="text-[10px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Search in Market →
                  </button>
                </div>
                
                {/* Search incoming cards INSIDE the trade modal (doesn't change tabs) */}
                <form onSubmit={handleRecvSearch} className="relative">
                  <input 
                    type="text" 
                    value={recvSearchQuery} 
                    onChange={e => setRecvSearchQuery(e.target.value)}
                    placeholder="Search incoming cards..."
                    className="w-full bg-black/30 rounded-xl h-12 px-5 font-black outline-none border border-white/5 focus:bg-black/50 transition-colors"
                  />
                  <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs uppercase opacity-40 hover:opacity-100">
                    SEARCH
                  </button>
                </form>

                {recvSearchResults.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-2">
                    {recvSearchResults.map((res, i) => (
                      <div key={i} onClick={() => addReceivedCardToTrade(res)} className="flex-shrink-0 w-24 aspect-[3.2/4] bg-black/20 rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                        <img src={res.imageUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {tradeForm.receivingCards.map((rc, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded-xl flex items-center gap-4 animate-in slide-in-from-left-2">
                      <img src={rc.imageUrl} className="w-10 h-14 object-cover rounded-md" />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-black text-[10px] uppercase truncate">{rc.name}</p>
                        <p className="font-black text-emerald-400 text-xs">${rc.price?.toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeReceivedCardFromTrade(i)} className="text-red-400 font-black text-lg p-2">✕</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Notes</h3>
                <textarea
                  value={tradeForm.notes}
                  onChange={e => setTradeForm(p => ({...p, notes: e.target.value}))}
                  placeholder="Add notes about this trade..."
                  className="w-full bg-black/30 rounded-xl h-20 px-5 py-3 font-black outline-none border border-white/5 focus:bg-black/50 transition-colors resize-none text-white"
                  rows={3}
                />
              </section>

              <button onClick={finishTrade} className="ref-button w-full bg-white text-black border-none py-4 text-lg font-black tracking-[0.2em] shadow-2xl uppercase mt-8">Confirm Deal</button>
            </div>
          </div>
        </div>
      )}

      {addingCardToBinders && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-lg">
          <div className="bg-[#7A3126] border-2 border-white/20 rounded-[2.5rem] w-full max-w-xs p-10 shadow-2xl animate-in zoom-in duration-300">
             <h2 className="text-xl font-black uppercase mb-8 text-center tracking-tighter italic">Process Item</h2>
             <div className="flex flex-col items-center mb-8">
                <img src={addingCardToBinders.imageUrl} className="w-32 h-44 object-cover rounded-xl shadow-2xl mb-4" />
                <span className="font-black text-sm uppercase text-center leading-tight mb-1">{addingCardToBinders.name}</span>
                <span className="font-black text-emerald-400 text-lg">${addingCardToBinders.price?.toFixed(2)}</span>
             </div>
             
             <div className="space-y-3 mb-8 max-h-56 overflow-y-auto no-scrollbar">
                <label className="text-[10px] font-black opacity-40 uppercase text-center block tracking-widest">Assign to Binder</label>
                {state.binders.map(b => (
                  <button key={b.id} onClick={() => finalizeAddCard(b.id)} className="w-full p-4 bg-black/30 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-black/50 transition-all border border-white/5 active:scale-95">{b.name}</button>
                ))}
                <button onClick={() => finalizeAddCard()} className="w-full p-4 border-2 border-white/10 rounded-2xl font-black uppercase text-[10px] opacity-40 hover:opacity-100 transition-all tracking-widest">General Inventory</button>
             </div>
             <button onClick={() => setAddingCardToBinders(null)} className="w-full text-[11px] font-black uppercase opacity-20 hover:opacity-100 transition-opacity tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {editingBinder && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-start justify-center p-6 backdrop-blur-lg overflow-y-auto">
          <div className="bg-[#7A3126] border-2 border-white/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300 mb-20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Edit Binder</h2>
              <button onClick={() => setEditingBinder(null)} className="text-3xl opacity-40 hover:opacity-100 transition-opacity">✕</button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-black uppercase mb-4 tracking-tighter">{editingBinder.name}</h3>
              <p className="text-[11px] font-black opacity-50 uppercase tracking-widest">{editingBinder.cardIds.length} cards</p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Add Cards to Binder</h3>
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto no-scrollbar p-1">
                {state.collection
                  .filter(card => !editingBinder.cardIds.includes(card.id))
                  .map(card => {
                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          setState(prev => ({
                            ...prev,
                            binders: prev.binders.map(b =>
                              b.id === editingBinder.id
                                ? { ...b, cardIds: [...b.cardIds, card.id] }
                                : b
                            )
                          }));
                          setEditingBinder(prev => prev ? {
                            ...prev,
                            cardIds: [...prev.cardIds, card.id]
                          } : null);
                        }}
                        className="aspect-[3.2/4] rounded-lg overflow-hidden relative cursor-pointer border-2 border-transparent opacity-80 hover:opacity-100 hover:border-white/30 transition-all active:scale-95"
                      >
                        <img src={card.imageUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 hover:opacity-100 text-white font-black text-lg">+</span>
                        </div>
                      </div>
                    );
                  })}
                {state.collection.filter(card => !editingBinder.cardIds.includes(card.id)).length === 0 && (
                  <div className="col-span-3 text-center py-8 opacity-40 text-[10px] font-black uppercase tracking-widest">
                    All cards already in binder
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Cards in Binder</h3>
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto no-scrollbar p-1">
                {editingBinder.cardIds.length > 0 ? (
                  editingBinder.cardIds.map(cardId => {
                    const card = state.collection.find(c => c.id === cardId);
                    if (!card) return null;
                    return (
                      <div
                        key={cardId}
                        onClick={() => {
                          setState(prev => ({
                            ...prev,
                            binders: prev.binders.map(b =>
                              b.id === editingBinder.id
                                ? { ...b, cardIds: b.cardIds.filter(id => id !== cardId) }
                                : b
                            )
                          }));
                          setEditingBinder(prev => prev ? {
                            ...prev,
                            cardIds: prev.cardIds.filter(id => id !== cardId)
                          } : null);
                        }}
                        className="aspect-[3.2/4] rounded-lg overflow-hidden relative cursor-pointer border-2 border-white/30 hover:border-red-400/50 transition-all active:scale-95"
                      >
                        <img src={card.imageUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                        <div className="absolute inset-0 bg-black/0 hover:bg-red-500/30 transition-colors flex items-center justify-center">
                          <span className="opacity-0 hover:opacity-100 text-white font-black text-xl">✕</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-8 opacity-40 text-[10px] font-black uppercase tracking-widest">
                    No cards in binder
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setEditingBinder(null)} 
              className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-100 transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {viewingTrade && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-start justify-center p-6 backdrop-blur-lg overflow-y-auto">
          <div className="bg-[#7A3126] border-2 border-white/20 rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in duration-300 mb-20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Trade Details</h2>
              <button onClick={() => setViewingTrade(null)} className="text-3xl opacity-40 hover:opacity-100 transition-opacity">✕</button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">{viewingTrade.partnerName || 'Show Guest'}</h3>
                  <p className="text-[11px] font-black opacity-50 mt-1">{new Date(viewingTrade.date).toLocaleString()}</p>
                </div>
                {(() => {
                  const givenCards = viewingTrade.givenCards || state.collection.filter(c => viewingTrade.givenCardIds.includes(c.id));
                  const givenValue = givenCards.reduce((sum, c) => sum + (c.price || 0), 0);
                  const receivedValue = viewingTrade.receivedCards.reduce((sum, c) => sum + (c.price || 0), 0);
                  const netProfit = (viewingTrade.cashReceived - viewingTrade.cashGiven) + (receivedValue - givenValue);
                  return (
                    <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} {state.currency}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4">Cards Out ({viewingTrade.givenCards?.length || viewingTrade.givenCardIds.length})</h4>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto no-scrollbar">
                    {(viewingTrade.givenCards || state.collection.filter(c => viewingTrade.givenCardIds.includes(c.id))).map(card => (
                      <div key={card.id} className="bg-black/20 rounded-lg overflow-hidden">
                        <img src={card.imageUrl} className="w-full h-auto object-cover" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                        <div className="p-2">
                          <p className="text-[9px] font-black uppercase truncate">{card.name}</p>
                          <p className="text-[8px] font-black opacity-50">${(card.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4">Cards In ({viewingTrade.receivedCards.length})</h4>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto no-scrollbar">
                    {viewingTrade.receivedCards.map((card, idx) => (
                      <div key={idx} className="bg-black/20 rounded-lg overflow-hidden">
                        <img src={card.imageUrl} className="w-full h-auto object-cover" onError={(e) => { (e.target as HTMLImageElement).src = CARD_BACK_URL; }} />
                        <div className="p-2">
                          <p className="text-[9px] font-black uppercase truncate">{card.name}</p>
                          <p className="text-[8px] font-black opacity-50">${(card.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {viewingTrade.notes && (
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Notes</h4>
                  <p className="text-sm font-black opacity-80">{viewingTrade.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-black opacity-40 uppercase mb-1">Cash In</p>
                    <p className="text-emerald-400 font-black">+${viewingTrade.cashReceived.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black opacity-40 uppercase mb-1">Cash Out</p>
                    <p className="text-red-400 font-black">-${viewingTrade.cashGiven.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;