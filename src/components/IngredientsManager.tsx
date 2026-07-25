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
    <div className="coach-plan p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="coach-touch rounded-xl text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)]" title="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold font-display text-[color:var(--txt-hi)]">Ingredients</h2>
            <p className="text-[color:var(--txt-lo)] text-xs sm:text-sm">{items.length} total items</p>
          </div>
        </div>
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--txt-lo)] pointer-events-none" />
          <input
            value={searchInput}
            onChange={(e)=>setSearchInput(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full pl-10 pr-3 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]"
            style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Editor Card */}
        <div className="rounded-xl p-4 sm:p-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="text-[color:var(--txt-hi)] font-semibold">{editing ? 'Edit Ingredient' : 'Add Ingredient'}</h3>
            <div className="flex items-center gap-2 text-[color:var(--txt-mid)]">
              <Calculator className="w-4 h-4" />
              <label className="text-xs">Auto kcal</label>
              <button
                onClick={() => setAutoCalc(v => !v)}
                className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                style={{ background: autoCalc ? 'var(--red)' : 'var(--surface-3)' }}
                aria-label="Toggle auto calculate kcal"
              >
                <span className={`absolute top-1 ${autoCalc ? 'right-1' : 'left-1'} w-4 h-4 rounded-full bg-white`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <input
              value={form.name}
              onChange={e=>setForm({...form, name:e.target.value})}
              placeholder="Name"
              className="w-full px-3 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]"
              style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input type="number" value={form.kcal} onChange={e=>setForm({...form, kcal: Number(e.target.value)})} placeholder="KCal" className="px-3 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]" style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }} />
              <input type="number" value={form.protein} onChange={e=>onMacroChange('protein', Number(e.target.value))} placeholder="Protein" className="px-3 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]" style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }} />
              <input type="number" value={form.fat} onChange={e=>onMacroChange('fat', Number(e.target.value))} placeholder="Fat" className="px-3 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]" style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }} />
              <input type="number" value={form.carbs} onChange={e=>onMacroChange('carbs', Number(e.target.value))} placeholder="Carbs" className="px-3 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]" style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }} />
            </div>
            {autoCalc && (
              <div className="text-xs text-[color:var(--txt-lo)]">KCal auto-calculated from macros (P×4 + C×4 + F×9)</div>
            )}
            <div className="flex gap-2">
              <button onClick={save} className="coach-editor-btn coach-editor-btn--primary flex-1 justify-center">
                {editing? 'Update':'Create'}
              </button>
              <button onClick={startNew} className="coach-editor-btn flex-1 justify-center">Clear</button>
            </div>
          </div>
        </div>

        {/* List / table */}
        <div className="md:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
          {/* Mobile: stacked cards */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--hair)' }}>
            {filtered.map(it => (
              <div key={it.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[color:var(--txt-hi)] truncate">{it.name}</div>
                    <div className="text-xs text-[color:var(--txt-lo)] tnum mt-0.5">
                      {it.kcal} kcal · P {it.protein} · F {it.fat} · C {it.carbs}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>startEdit(it)} className="coach-touch rounded-lg text-[color:var(--blue)]" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={()=>remove(it.id)} className="coach-touch rounded-lg text-[color:var(--red)]" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Laptop: full table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-[color:var(--txt-mid)]">
              <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--hair)' }}>
                <tr className="text-left text-[color:var(--txt-lo)]">
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
                    <tr key={it.id} className="transition" style={{ borderTop: '1px solid var(--hair)' }}>
                      <td className="p-3 align-middle">
                        <div className="font-medium text-[color:var(--txt-hi)]">{it.name}</div>
                        <div className="mt-1 h-1.5 rounded overflow-hidden flex" style={{ background: 'var(--surface-3)' }}>
                          <div className="h-full" style={{ width: `${pPct}%`, background: 'var(--blue)' }} />
                          <div className="h-full" style={{ width: `${fPct}%`, background: 'var(--orange)' }} />
                          <div className="h-full" style={{ width: `${cPct}%`, background: 'var(--green)' }} />
                        </div>
                      </td>
                      <td className="p-3 tnum">{it.kcal}</td>
                      <td className="p-3 tnum">{it.protein}</td>
                      <td className="p-3 tnum">{it.fat}</td>
                      <td className="p-3 tnum">{it.carbs}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={()=>startEdit(it)} className="px-2 py-1.5 rounded text-white text-xs inline-flex items-center gap-1" style={{ background: 'var(--blue)' }}>
                            <Pencil className="w-3.5 h-3.5" /><span>Edit</span>
                          </button>
                          <button onClick={()=>remove(it.id)} className="px-2 py-1.5 rounded text-white text-xs inline-flex items-center gap-1" style={{ background: 'var(--red)' }}>
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



