import React, { useEffect, useMemo, useState } from 'react';
import { dbListIngredients, dbAddIngredient, dbUpdateIngredient, dbDeleteIngredient } from '../lib/db';
import { ArrowLeft, Search, Calculator, Check, X, Pencil, Trash2 } from 'lucide-react';

const IngredientsManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', kcal: 0, protein: 0, fat: 0, carbs: 0 });
  const [autoCalc, setAutoCalc] = useState(true);

  const load = async () => {
    const { data } = await dbListIngredients();
    if (data) setItems(data);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm({ name: '', kcal: 0, protein: 0, fat: 0, carbs: 0 }); };
  const startEdit = (it: any) => { setEditing(it); setForm({ name: it.name, kcal: it.kcal, protein: it.protein, fat: it.fat, carbs: it.carbs }); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await dbUpdateIngredient(editing.id, form);
    } else {
      await dbAddIngredient(form);
    }
    await load();
    startNew();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete ingredient?')) return;
    await dbDeleteIngredient(id);
    await load();
  };

  // Debounce search input to avoid re-render spam
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filtered = useMemo(
    () => items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const calculateKcal = (p: number, f: number, c: number) => Math.round(p * 4 + c * 4 + f * 9);

  const onMacroChange = (key: 'protein' | 'fat' | 'carbs', value: number) => {
    const next = { ...form, [key]: value } as any;
    if (autoCalc) {
      next.kcal = calculateKcal(next.protein, next.fat, next.carbs);
    }
    setForm(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/60">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Ingredients</h2>
            <p className="text-slate-400 text-sm">{items.length} total items</p>
          </div>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e)=>setSearchInput(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Editor Card */}
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">{editing ? 'Edit Ingredient' : 'Add Ingredient'}</h3>
            <div className="flex items-center space-x-2 text-slate-300">
              <Calculator className="w-4 h-4" />
              <label className="text-xs">Auto-calc kcal</label>
              <button
                onClick={() => setAutoCalc(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoCalc ? 'bg-red-500' : 'bg-slate-600'}`}
                aria-label="Toggle auto calculate kcal"
              >
                <span className={`absolute top-0.5 ${autoCalc ? 'right-0.5' : 'left-0.5'} w-4 h-4 rounded-full bg-white`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <input
              value={form.name}
              onChange={e=>setForm({...form, name:e.target.value})}
              placeholder="Name"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
            <div className="grid grid-cols-4 gap-2">
              <input type="number" value={form.kcal} onChange={e=>setForm({...form, kcal: Number(e.target.value)})} placeholder="KCal" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400" />
              <input type="number" value={form.protein} onChange={e=>onMacroChange('protein', Number(e.target.value))} placeholder="Protein" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400" />
              <input type="number" value={form.fat} onChange={e=>onMacroChange('fat', Number(e.target.value))} placeholder="Fat" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400" />
              <input type="number" value={form.carbs} onChange={e=>onMacroChange('carbs', Number(e.target.value))} placeholder="Carbs" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400" />
            </div>
            {autoCalc && (
              <div className="text-xs text-slate-400">KCal auto-calculated from macros (P×4 + C×4 + F×9)</div>
            )}
            <div className="flex space-x-2">
              <button onClick={save} className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition">
                {editing? 'Update':'Create'}
              </button>
              <button onClick={startNew} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition">Clear</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="md:col-span-2 bg-slate-800/60 rounded-xl border border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-slate-200">
              <thead className="sticky top-0 bg-slate-900/70 backdrop-blur border-b border-slate-700/60">
                <tr className="text-left text-slate-300">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">KCal</th>
                  <th className="p-3 font-medium">P</th>
                  <th className="p-3 font-medium">F</th>
                  <th className="p-3 font-medium">C</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => {
                  const macroKcal = calculateKcal(it.protein || 0, it.fat || 0, it.carbs || 0) || 1;
                  const pPct = Math.max(0, Math.min(100, Math.round(((it.protein || 0) * 4 / macroKcal) * 100)));
                  const fPct = Math.max(0, Math.min(100, Math.round(((it.fat || 0) * 9 / macroKcal) * 100)));
                  const cPct = Math.max(0, Math.min(100, 100 - pPct - fPct));
                  return (
                    <tr key={it.id} className="border-t border-slate-700/60 hover:bg-slate-800/60 transition">
                      <td className="p-3 align-middle">
                        <div className="font-medium text-white">{it.name}</div>
                        <div className="mt-1 h-1.5 rounded bg-slate-700/50 overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${pPct}%` }} />
                          <div className="h-full bg-amber-500" style={{ width: `${fPct}%` }} />
                          <div className="h-full bg-emerald-500" style={{ width: `${cPct}%` }} />
                        </div>
                      </td>
                      <td className="p-3">{it.kcal}</td>
                      <td className="p-3">{it.protein}</td>
                      <td className="p-3">{it.fat}</td>
                      <td className="p-3">{it.carbs}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <button onClick={()=>startEdit(it)} className="px-2 py-1.5 rounded bg-blue-600/90 hover:bg-blue-600 text-white text-xs inline-flex items-center space-x-1">
                            <Pencil className="w-3.5 h-3.5" /><span>Edit</span>
                          </button>
                          <button onClick={()=>remove(it.id)} className="px-2 py-1.5 rounded bg-red-600/90 hover:bg-red-600 text-white text-xs inline-flex items-center space-x-1">
                            <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientsManager;



