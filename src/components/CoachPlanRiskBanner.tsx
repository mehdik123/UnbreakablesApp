import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import { getLocalEgressEstimate, type PlanRiskLevel } from '../utils/photoEgressCache';
import {
  buildUsageSuggestions,
  EGRESS_PLAYBOOK,
  EGRESS_SOFT_TARGET_GB,
  egressLevel,
  FREE_DB_MB,
  FREE_EGRESS_GB,
  FREE_STORAGE_MB,
  getCoachPlanUsageReport,
  meterLevel,
  DB_CRITICAL_PCT,
  DB_WARN_PCT,
  STORAGE_CRITICAL_PCT,
  STORAGE_WARN_PCT,
  overallPlanLevel,
  saveCoachPlanUsageReport,
  scanStorageUsage,
  type CoachPlanUsageReport,
} from '../utils/planUsageMonitor';

const USAGE_URL = 'https://supabase.com/dashboard/org/_/usage';

const LEVEL_STYLE: Record<
  PlanRiskLevel,
  { tone: string; border: string; bg: string; bar: string }
> = {
  ok: {
    tone: 'var(--green)',
    border: 'var(--hair)',
    bg: 'var(--surface-1)',
    bar: 'var(--green)',
  },
  watch: {
    tone: 'var(--orange)',
    border: 'rgba(255, 149, 0, 0.45)',
    bg: 'rgba(255, 149, 0, 0.08)',
    bar: 'var(--orange)',
  },
  warn: {
    tone: 'var(--orange)',
    border: 'rgba(255, 106, 85, 0.55)',
    bg: 'rgba(255, 106, 85, 0.12)',
    bar: 'var(--coral)',
  },
  critical: {
    tone: 'var(--red)',
    border: 'rgba(255, 45, 85, 0.65)',
    bg: 'rgba(255, 45, 85, 0.14)',
    bar: 'var(--red)',
  },
};

function parseNum(raw: string): number | null {
  const n = Number(String(raw).replace(',', '.').trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function formatAgo(iso: string | undefined): string {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

const MeterBar: React.FC<{
  label: string;
  icon: React.ReactNode;
  usedLabel: string;
  limitLabel: string;
  pct: number;
  level: PlanRiskLevel;
  hint?: string;
}> = ({ label, icon, usedLabel, limitLabel, pct, level, hint }) => {
  const style = LEVEL_STYLE[level];
  const width = Math.min(100, Math.max(0, pct * 100));
  return (
    <div
      className="rounded-xl p-3 min-w-0"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="shrink-0" style={{ color: style.tone }}>
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>
          {label}
        </span>
        <span className="ml-auto text-[11px] font-semibold tnum" style={{ color: style.tone }}>
          {Math.round(width)}%
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--surface-3)' }}
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} usage`}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${width}%`, background: style.bar }}
        />
      </div>
      <p className="mt-2 text-sm font-display tnum" style={{ color: 'var(--txt-hi)' }}>
        {usedLabel}
        <span style={{ color: 'var(--txt-lo)' }}> / {limitLabel}</span>
      </p>
      {hint && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--txt-mid)' }}>
          {hint}
        </p>
      )}
    </div>
  );
};

/**
 * Coach-only Free-plan health: egress / DB / file storage meters + instant suggestions.
 * Official billing numbers are pasted from Supabase Usage (API doesn’t expose them to the app).
 * Storage can be scanned from the weekly-photos bucket metadata.
 */
export const CoachPlanRiskBanner: React.FC = () => {
  const [report, setReport] = useState<CoachPlanUsageReport | null>(() => getCoachPlanUsageReport());
  const [egressDraft, setEgressDraft] = useState(() =>
    report?.egressGb != null ? String(report.egressGb) : ''
  );
  const [dbDraft, setDbDraft] = useState(() => (report?.dbMb != null ? String(report.dbMb) : ''));
  const [storageDraft, setStorageDraft] = useState(() =>
    report?.storageMb != null ? String(report.storageMb) : ''
  );
  const [expanded, setExpanded] = useState(false);
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [local, setLocal] = useState(() => getLocalEgressEstimate());
  const [tick, setTick] = useState(0);

  const refreshLocal = useCallback(() => {
    setLocal(getLocalEgressEstimate());
    setReport(getCoachPlanUsageReport());
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const id = window.setInterval(refreshLocal, 12_000);
    return () => window.clearInterval(id);
  }, [refreshLocal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const scan = await scanStorageUsage(false);
      if (cancelled || !scan) return;
      setReport(getCoachPlanUsageReport());
      setStorageDraft(scan.mb.toFixed(1));
      setScanNote(
        scan.fromCache
          ? `Storage scan cached · ${scan.fileCount} files`
          : `Storage scanned · ${scan.fileCount} files`
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const level = useMemo(() => overallPlanLevel(report), [report, tick, local.fetchedMb]);
  const style = LEVEL_STYLE[level];
  const suggestions = useMemo(() => buildUsageSuggestions(report), [report, tick, local.fetchedMb]);

  const eLv = egressLevel(report?.egressGb, local.fetchedMb);
  const dLv = meterLevel(report?.dbMb, FREE_DB_MB, DB_WARN_PCT, DB_CRITICAL_PCT);
  const sLv = meterLevel(report?.storageMb, FREE_STORAGE_MB, STORAGE_WARN_PCT, STORAGE_CRITICAL_PCT);

  const egressUsed = report?.egressGb ?? null;
  const egressPct = egressUsed != null ? egressUsed / FREE_EGRESS_GB : local.fetchedMb / 1024 / FREE_EGRESS_GB;
  const dbPct = report?.dbMb != null ? report.dbMb / FREE_DB_MB : 0;
  const storagePct = report?.storageMb != null ? report.storageMb / FREE_STORAGE_MB : 0;

  const needsAttention = level === 'warn' || level === 'critical';
  const showFull = needsAttention || expanded || !report?.egressGb;

  const saveAll = () => {
    const next = saveCoachPlanUsageReport({
      egressGb: parseNum(egressDraft),
      dbMb: parseNum(dbDraft),
      storageMb: parseNum(storageDraft),
    });
    setReport(next);
    if (next.egressGb != null) setEgressDraft(String(next.egressGb));
    if (next.dbMb != null) setDbDraft(String(next.dbMb));
    if (next.storageMb != null) setStorageDraft(String(Number(next.storageMb.toFixed(1))));
    setExpanded(false);
  };

  const rescanStorage = async () => {
    setScanning(true);
    setScanNote(null);
    try {
      const scan = await scanStorageUsage(true);
      if (!scan) {
        setScanNote('Storage scan unavailable (check Supabase connection).');
        return;
      }
      setReport(getCoachPlanUsageReport());
      setStorageDraft(scan.mb.toFixed(1));
      setScanNote(`Scanned ${scan.fileCount} files · ${scan.mb.toFixed(1)} MB`);
    } finally {
      setScanning(false);
    }
  };

  const Icon = level === 'ok' ? CheckCircle2 : level === 'critical' ? ShieldAlert : AlertTriangle;

  if (!showFull && level === 'ok' && report?.egressGb != null) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full mb-4 rounded-xl px-3 py-2.5 text-left min-h-11 flex items-center gap-2 touch-manipulation"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hair)',
          color: 'var(--txt-mid)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--green)' }} />
        <span className="text-xs sm:text-sm">
          Free plan OK · egress{' '}
          <span className="font-semibold tnum" style={{ color: 'var(--txt-hi)' }}>
            {report.egressGb} GB
          </span>
          {report.dbMb != null && (
            <>
              {' · '}DB{' '}
              <span className="font-semibold tnum" style={{ color: 'var(--txt-hi)' }}>
                {report.dbMb} MB
              </span>
            </>
          )}
          {report.storageMb != null && (
            <>
              {' · '}files{' '}
              <span className="font-semibold tnum" style={{ color: 'var(--txt-hi)' }}>
                {report.storageMb.toFixed(0)} MB
              </span>
            </>
          )}
          <span style={{ color: 'var(--txt-lo)' }}> — tap to update</span>
        </span>
      </button>
    );
  }

  return (
    <div
      className="mb-4 rounded-2xl p-3 sm:p-4 space-y-3"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: style.tone }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold font-display" style={{ color: 'var(--txt-hi)' }}>
            Free plan usage monitor
          </p>
          <p className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: 'var(--txt-mid)' }}>
            Live local photo traffic + meters vs Free caps. Paste official Usage numbers for truth —
            Supabase doesn’t expose billing egress to the app.
          </p>
          {report?.updatedAt && (
            <p className="text-[11px] mt-1 tnum" style={{ color: 'var(--txt-lo)' }}>
              Last sync {formatAgo(report.updatedAt)} · soft egress target {EGRESS_SOFT_TARGET_GB} GB
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <MeterBar
          label="Egress"
          icon={<Wifi className="w-4 h-4" />}
          usedLabel={
            egressUsed != null
              ? `${egressUsed.toFixed(2)} GB`
              : `~${(local.fetchedMb / 1024).toFixed(2)} GB local`
          }
          limitLabel={`${FREE_EGRESS_GB} GB`}
          pct={egressPct}
          level={eLv}
          hint={
            egressUsed == null
              ? `This browser only: ${local.fetchedMb.toFixed(0)} MB fetched · ${local.cacheHits} cache hits`
              : `Local photo fetch: ${local.fetchedMb.toFixed(0)} MB · ${local.cacheHits} cache hits`
          }
        />
        <MeterBar
          label="Database"
          icon={<Database className="w-4 h-4" />}
          usedLabel={report?.dbMb != null ? `${report.dbMb.toFixed(1)} MB` : '—'}
          limitLabel={`${FREE_DB_MB} MB`}
          pct={dbPct}
          level={dLv}
          hint="Paste from Reports → Disk → Database (not WAL)"
        />
        <MeterBar
          label="File storage"
          icon={<HardDrive className="w-4 h-4" />}
          usedLabel={report?.storageMb != null ? `${report.storageMb.toFixed(1)} MB` : '—'}
          limitLabel={`${FREE_STORAGE_MB} MB`}
          pct={storagePct}
          level={sLv}
          hint={scanNote || 'Scan bucket or paste from Usage → Storage Size'}
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>
          Instant suggestions
        </p>
        <ul className="space-y-1.5">
          {suggestions.slice(0, 4).map((s) => (
            <li
              key={s.id}
              className="rounded-xl px-3 py-2 text-xs sm:text-sm leading-snug"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--hair)',
                color: 'var(--txt-mid)',
              }}
            >
              <span className="font-semibold" style={{ color: LEVEL_STYLE[s.level].tone }}>
                {s.title}
              </span>
              <span className="block mt-0.5" style={{ color: 'var(--txt-mid)' }}>
                {s.action}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="block min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>
            Egress (GB)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={egressDraft}
            onChange={(e) => setEgressDraft(e.target.value)}
            placeholder="1.30"
            className="mt-1 w-full min-h-11 rounded-xl px-3 text-[color:var(--txt-hi)] touch-manipulation"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', fontSize: 16 }}
          />
        </label>
        <label className="block min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>
            Database (MB)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={dbDraft}
            onChange={(e) => setDbDraft(e.target.value)}
            placeholder="40"
            className="mt-1 w-full min-h-11 rounded-xl px-3 text-[color:var(--txt-hi)] touch-manipulation"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', fontSize: 16 }}
          />
        </label>
        <label className="block min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>
            Storage (MB)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={storageDraft}
            onChange={(e) => setStorageDraft(e.target.value)}
            placeholder="122"
            className="mt-1 w-full min-h-11 rounded-xl px-3 text-[color:var(--txt-hi)] touch-manipulation"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', fontSize: 16 }}
          />
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
        <button
          type="button"
          onClick={saveAll}
          className="min-h-11 px-4 rounded-xl text-sm font-semibold text-white touch-manipulation"
          style={{ background: 'var(--grad-red)', WebkitTapHighlightColor: 'transparent' }}
        >
          Save meters
        </button>
        <button
          type="button"
          onClick={rescanStorage}
          disabled={scanning}
          className="min-h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 touch-manipulation disabled:opacity-60"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--hair)',
            color: 'var(--txt-hi)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          Scan storage
        </button>
        <a
          href={USAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 touch-manipulation"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--hair)',
            color: 'var(--txt-hi)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Open Usage
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <button
        type="button"
        onClick={() => setPlaybookOpen((v) => !v)}
        className="w-full text-left min-h-11 rounded-xl px-3 py-2 text-xs font-semibold touch-manipulation"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--hair)',
          color: 'var(--txt-hi)',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-expanded={playbookOpen}
      >
        How to stay under {FREE_EGRESS_GB} GB egress {playbookOpen ? '▾' : '▸'}
      </button>
      {playbookOpen && (
        <ul className="space-y-1.5 px-1">
          {EGRESS_PLAYBOOK.map((line) => (
            <li key={line} className="text-xs leading-snug" style={{ color: 'var(--txt-mid)' }}>
              · {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoachPlanRiskBanner;
