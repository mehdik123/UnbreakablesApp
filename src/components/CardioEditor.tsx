import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Check,
  Loader2,
  HeartPulse,
  Footprints,
  TreePine,
  Wind,
  Bike,
  Timer,
  Activity,
  BookmarkPlus,
  X,
} from 'lucide-react';
import { Client, CardioItem, CardioPlan, CardioTemplateData } from '../types';
import {
  CARDIO_MODALITIES,
  CARDIO_WHEN_OPTIONS,
  builtInTemplateData,
  getModalityMeta,
  itemFromTemplate,
  modalityIsSprints,
  modalityShowsDistance,
  modalityShowsIncline,
  normalizeCardioPlan,
} from '../data/cardioPresets';
import { dbResolveClientIdByName, dbGetCardioPlan, dbUpsertCardioPlan, dbListCardioTemplates, dbSaveCardioTemplate, dbDeleteCardioTemplate } from '../lib/db';

interface CardioEditorProps {
  client: Client;
  isDark?: boolean;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  TreePine,
  Wind,
  Bike,
  Timer,
  Activity,
};

const fieldStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hair)',
  color: 'var(--txt-hi)',
};

export const CardioEditor: React.FC<CardioEditorProps> = ({ client }) => {
  const [plan, setPlan] = useState<CardioPlan>({ items: [] });
  const [dbClientId, setDbClientId] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<{ id: string; name: string; template_json: CardioTemplateData }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saveTplItem, setSaveTplItem] = useState<CardioItem | null>(null);
  const [saveTplName, setSaveTplName] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [id, tplRes] = await Promise.all([
        dbResolveClientIdByName(client.name),
        dbListCardioTemplates(),
      ]);
      if (cancelled) return;
      setDbClientId(id);
      if (tplRes.data) setCustomTemplates(tplRes.data);

      let raw = client.cardioPlan;
      if (id) {
        const { data } = await dbGetCardioPlan(id);
        if (data) raw = data;
      }
      if (!cancelled) {
        setPlan(normalizeCardioPlan(raw));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client.name, client.cardioPlan]);

  function patchItem(id: string, patch: Partial<CardioItem>) {
    setPlan((p) => ({
      items: p.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    setSavedMsg('');
  }

  function addFromTemplate(data: CardioTemplateData) {
    setPlan((p) => ({ items: [...p.items, itemFromTemplate(data)] }));
    setShowAdd(false);
    setSavedMsg('');
  }

  function removeItem(id: string) {
    setPlan((p) => ({ items: p.items.filter((x) => x.id !== id) }));
    setSavedMsg('');
  }

  async function save() {
    setSaving(true);
    try {
      let id = dbClientId;
      if (!id) {
        id = await dbResolveClientIdByName(client.name);
        setDbClientId(id);
      }
      if (!id) {
        setSavedMsg('Client not found in database');
        return;
      }
      const { error } = await dbUpsertCardioPlan(id, plan);
      if (error) {
        const msg = String(error?.message || error?.hint || error);
        if (msg.includes('cardio_plans') || msg.includes('does not exist') || error?.code === '42P01') {
          setSavedMsg('Run create_cardio_plans_table.sql in Supabase');
        } else {
          setSavedMsg('Save failed — check console');
          console.error('Cardio save error:', error);
        }
      } else {
        setSavedMsg('Saved');
      }
    } catch (e) {
      setSavedMsg('Save failed');
      console.error('Cardio save error:', e);
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(''), 4000);
    }
  }

  async function handleSaveTemplate() {
    if (!saveTplItem || !saveTplName.trim()) return;
    setSavingTpl(true);
    const { name, id: _id, ...template } = saveTplItem;
    const { data, error } = await dbSaveCardioTemplate({
      name: saveTplName.trim(),
      template_json: { ...template, name: saveTplName.trim() },
    });
    if (!error && data) {
      setCustomTemplates((prev) => [data, ...prev]);
      setSaveTplItem(null);
      setSaveTplName('');
    }
    setSavingTpl(false);
  }

  async function deleteTemplate(tplId: string) {
    await dbDeleteCardioTemplate(tplId);
    setCustomTemplates((prev) => prev.filter((t) => t.id !== tplId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--red)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display" style={{ color: 'var(--txt-hi)' }}>
              Cardio
            </h2>
            <p className="text-xs" style={{ color: 'var(--txt-lo)' }}>
              Add templates for {client.name} — edit speed, time, times per week
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-red-500 to-rose-500 disabled:opacity-60 transition-all active:scale-95"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedMsg === 'Saved' ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {savedMsg || 'Save cardio'}
        </button>
      </div>

      {plan.items.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--surface-1)', border: '1px dashed var(--hair-strong)' }}
        >
          <HeartPulse className="w-8 h-8 mx-auto mb-3 opacity-50" style={{ color: 'var(--red)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--txt-hi)' }}>
            No cardio assigned yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--txt-lo)' }}>
            Pick a template below to add cardio for this client.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plan.items.map((item) => (
            <ItemEditorCard
              key={item.id}
              item={item}
              onPatch={(p) => patchItem(item.id, p)}
              onRemove={() => removeItem(item.id)}
              onSaveTemplate={() => {
                setSaveTplItem(item);
                setSaveTplName(item.name);
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAdd((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto justify-center"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)' }}
      >
        <Plus className="w-4 h-4" style={{ color: 'var(--red)' }} />
        {showAdd ? 'Hide templates' : 'Add from template'}
      </button>

      {showAdd && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--txt-lo)' }}>
              Built-in templates
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CARDIO_MODALITIES.filter((m) => m.id !== 'custom').map((m) => {
                const Icon = ICONS[m.icon] || Activity;
                return (
                  <button
                    key={m.id}
                    onClick={() => addFromTemplate(builtInTemplateData(m.id))}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all active:scale-95 bg-gradient-to-br ${m.gradient}`}
                  >
                    <Icon className="w-5 h-5 text-white shrink-0" />
                    <span className="text-sm font-semibold text-white">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {customTemplates.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--txt-lo)' }}>
                Your saved templates
              </p>
              <div className="space-y-2">
                {customTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
                  >
                    <button
                      onClick={() => addFromTemplate(tpl.template_json)}
                      className="flex-1 text-left text-sm font-semibold min-w-0 truncate"
                      style={{ color: 'var(--txt-hi)' }}
                    >
                      {tpl.name}
                    </button>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--surface-2)' }}
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: 'var(--red)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {saveTplItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-display" style={{ color: 'var(--txt-hi)' }}>
                Save as template
              </h3>
              <button onClick={() => setSaveTplItem(null)}>
                <X className="w-5 h-5" style={{ color: 'var(--txt-lo)' }} />
              </button>
            </div>
            <input
              value={saveTplName}
              onChange={(e) => setSaveTplName(e.target.value)}
              placeholder="Template name"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-4"
              style={fieldStyle}
            />
            <button
              onClick={handleSaveTemplate}
              disabled={savingTpl || !saveTplName.trim()}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-red-500 to-rose-500 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {savingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
              Save template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NumberField: React.FC<{
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  step?: number;
  suffix?: string;
}> = ({ label, value, onChange, step = 1, suffix }) => (
  <label className="block">
    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--txt-lo)' }}>
      {label}
    </span>
    <div className="flex items-center mt-1 rounded-lg overflow-hidden" style={fieldStyle}>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full bg-transparent px-2.5 py-2 text-sm outline-none"
      />
      {suffix && (
        <span className="px-2 text-[11px]" style={{ color: 'var(--txt-lo)' }}>
          {suffix}
        </span>
      )}
    </div>
  </label>
);

const ItemEditorCard: React.FC<{
  item: CardioItem;
  onPatch: (p: Partial<CardioItem>) => void;
  onRemove: () => void;
  onSaveTemplate: () => void;
}> = ({ item, onPatch, onRemove, onSaveTemplate }) => {
  const meta = getModalityMeta(item.modality);
  const Icon = ICONS[meta.icon] || Activity;
  const isSprints = modalityIsSprints(item.modality);

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.gradient} shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <input
            value={item.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            className="bg-transparent font-semibold text-sm outline-none min-w-0 flex-1"
            style={{ color: 'var(--txt-hi)' }}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onSaveTemplate}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--surface-2)' }}
            title="Save as template"
          >
            <BookmarkPlus className="w-4 h-4" style={{ color: 'var(--txt-mid)' }} />
          </button>
          <button onClick={onRemove} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
            <Trash2 className="w-4 h-4" style={{ color: 'var(--red)' }} />
          </button>
        </div>
      </div>

      {isSprints ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <NumberField label="Work" value={item.workSec} onChange={(v) => onPatch({ workSec: v })} suffix="sec" />
          <NumberField label="Rest" value={item.restSec} onChange={(v) => onPatch({ restSec: v })} suffix="sec" />
          <NumberField label="Rounds" value={item.rounds} onChange={(v) => onPatch({ rounds: v })} />
          <NumberField label="Speed" value={item.speedKmh} onChange={(v) => onPatch({ speedKmh: v })} step={0.5} suffix="km/h" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <NumberField label="Time" value={item.durationMin} onChange={(v) => onPatch({ durationMin: v ?? 0 })} suffix="min" />
          <NumberField label="Speed" value={item.speedKmh} onChange={(v) => onPatch({ speedKmh: v })} step={0.5} suffix="km/h" />
          {modalityShowsIncline(item.modality) && (
            <NumberField label="Incline" value={item.inclinePct} onChange={(v) => onPatch({ inclinePct: v })} suffix="%" />
          )}
          {modalityShowsDistance(item.modality) && (
            <NumberField label="Distance" value={item.distanceKm} onChange={(v) => onPatch({ distanceKm: v })} step={0.1} suffix="km" />
          )}
        </div>
      )}

      {isSprints && (
        <div className="mb-3">
          <NumberField label="Time" value={item.durationMin} onChange={(v) => onPatch({ durationMin: v ?? 0 })} suffix="min" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <NumberField label="Times / week" value={item.timesPerWeek} onChange={(v) => onPatch({ timesPerWeek: v ?? 1 })} />
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--txt-lo)' }}>
            When
          </span>
          <select
            value={item.when}
            onChange={(e) => onPatch({ when: e.target.value as CardioItem['when'] })}
            className="w-full mt-1 rounded-lg px-2 py-2 text-sm outline-none"
            style={fieldStyle}
          >
            {CARDIO_WHEN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        value={item.whenNote || ''}
        onChange={(e) => onPatch({ whenNote: e.target.value })}
        placeholder="Optional note (e.g. at the end of the session)"
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={fieldStyle}
      />
    </div>
  );
};

export default CardioEditor;
