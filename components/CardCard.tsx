
import React from 'react';
import { PokemonCard } from '../types';

interface CardCardProps {
  card: PokemonCard;
  onRemove?: (id: string) => void;
}

const CardCard: React.FC<CardCardProps> = ({ card, onRemove }) => {
  return (
    <div className="relative group bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
      <div className="aspect-[3/4] overflow-hidden relative">
        <img 
          src={card.imageUrl} 
          alt={card.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
           <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">
            ${card.price.toFixed(2)}
          </span>
          <span className="bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
            {card.condition}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold truncate text-slate-100">{card.name}</h3>
        <p className="text-[10px] text-slate-400 flex justify-between mt-1">
          <span>{card.set}</span>
          <span>#{card.number}</span>
        </p>
      </div>
      {onRemove && (
        <button 
          onClick={() => onRemove(card.id)}
          className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default CardCard;
