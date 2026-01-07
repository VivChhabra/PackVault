
import React, { useState } from 'react';
import { PokemonCard } from '../types';

interface AutoBinderModalProps {
  collection: PokemonCard[];
  onClose: () => void;
  onCreate: (name: string, filteredIds: string[]) => void;
}

const AutoBinderModal: React.FC<AutoBinderModalProps> = ({ collection, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(10);

  const filtered = collection.filter(c => c.price >= min && c.price <= max);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Auto-Create Binder</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Binder Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. $5 Value Binder"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Min Price ($)</label>
              <input 
                type="number" 
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Price ($)</label>
              <input 
                type="number" 
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-sm text-slate-300">
              Found <span className="text-blue-400 font-bold">{filtered.length}</span> cards in your inventory matching this range.
            </p>
          </div>
        </div>
        <div className="p-6 bg-slate-800/20 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onCreate(name || `${min}-${max} Binder`, filtered.map(c => c.id))}
            disabled={filtered.length === 0}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            Create Binder
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoBinderModal;
