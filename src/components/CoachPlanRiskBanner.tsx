import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react';
import {
  EGRESS_CRITICAL_GB,
  EGRESS_SOFT_TARGET_GB,
  EGRESS_WARN_GB,
  FREE_EGRESS_GB,
  getCoachEgressReport,
  getLocalEgressEstimate,
  getPlanRiskLevel,
  saveCoachEgressReport,
  type PlanRiskLevel,
} from '../utils/photoEgressCache';

const USAGE_URL = 'https://supabase.com/dashboard/org/_/usage';

const LEVEL_COPY: Record<
  PlanRiskLevel,
  { title: string; body: string; tone: string; border: string; bg: string }
> = {
  ok: {
    title: 'Plan health looks fine',
    body: `Free egress limit is ${FREE_EGRESS_GB} GB/mo. Update the number from Supabase Usage when you check it.`,
    tone: 'var(--txt-mid)',
    border: 'var(--hair)',
    bg: 'var(--surface-1)',
  },
  watch: {
    title: 'Keep an eye on bandwidth',
    body: `You’re climbing toward the Free ${FREE_EGRESS_GB} GB egress cap. Avoid bulk photo browsing and clear finished clients’ photos.`,
    tone: 'var(--orange)',
    border: 'rgba(255, 149, 0, 0.45)',
    bg: 'rgba(255, 149, 0, 0.08)',
  },
  warn: {
    title: 'Warning — egress getting high',
    body: `Past ~${EGRESS_WARN_GB} GB, Free Fair Use can restrict the app (clients get errors). Check Usage and cut photo traffic.`,
    tone: 'var(--orange)',
    border: 'rgba(255, 106, 85, 0.55)',
    bg: 'rgba(255, 106, 85, 0.12)',
  },
  critical: {
    title: 'Critical — about to hit Free limit',
    body: `Near ${EGRESS_CRITICAL_GB}+ GB egress. On Free, Supabase can drop API requests until the next cycle. Act now: fewer photo loads, delete ended-client photos, or stay on Pro.`,
    tone: 'var(--red)',
    border: 'rgba(255, 45, 85, 0.65)',
    bg: 'rgba(255, 45, 85, 0.14)',
  },
};

/**
 * Coach-only banner: warns before Free-plan egress Fair Use kills the app again.
 * Uses the GB you paste from Supabase Usage (+ local photo-fetch signal).
 */
export const CoachPlanRiskBanner: React.FC = () => {
  const [report, setReport] = useState(() => getCoachEgressReport());
  const [draft, setDraft] = useState(() =>
    report ? String(report.egressGb) : ''
  );
  const [expanded, setExpanded] = useState(false);
  const local = useMemo(() => getLocalEgressEstimate(), [report]);

  const level = getPlanRiskLevel({
    reportedEgressGb: report?.egressGb ?? null,
    localFetchedMb: local.fetchedMb,
  });
  const copy = LEVEL_COPY[level];
  const Icon = level === 'ok' ? CheckCircle2 : level === 'critical' ? ShieldAlert : AlertTriangle;

  // Always show when warn/critical; collapse ok/watch unless expanded or no report this month
  const needsAttention = level === 'warn' || level === 'critical';
  const showFull = needsAttention || expanded || !report;

  const save = () => {
    const n = Number(String(draft).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return;
    const next = saveCoachEgressReport(n);
    setReport(next);
    setDraft(String(next.egressGb));
    setExpanded(false);
  };

  if (!showFull && level === 'ok' && report) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full mb-4 rounded-xl px-3 py-2.5 text-left min-h-11 flex items-center gap-2"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hair)',
          color: 'var(--txt-mid)',
          touchAction: 'manipulation',
        }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--green)' }} />
        <span className="text-xs sm:text-sm">
          Egress logged: <span className="font-semibold tnum" style={{ color: 'var(--txt-hi)' }}>{report.egressGb} GB</span>
          {' · '}Free limit {FREE_EGRESS_GB} GB — tap to update
        </span>
      </button>
    );
  }

  return (
    <div
      className="mb-4 rounded-2xl p-3 sm:p-4 space-y-3"
      style={{ background: copy.bg, border: `1px solid ${copy.border}` }}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: copy.tone }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold font-display" style={{ color: 'var(--txt-hi)' }}>
            {copy.title}
          </p>
          <p className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: 'var(--txt-mid)' }}>
            {copy.body}
          </p>
          {report && (
            <p className="text-[11px] mt-1.5 tnum" style={{ color: copy.tone }}>
              Last logged: {report.egressGb} GB · soft target under {EGRESS_SOFT_TARGET_GB} GB
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <label className="block flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>
            Egress from Supabase Usage (GB)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. 2.4"
            className="mt-1 w-full min-h-11 rounded-xl px-3 text-[color:var(--txt-hi)]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', fontSize: 16 }}
          />
        </label>
        <button
          type="button"
          onClick={save}
          className="min-h-11 px-4 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--grad-red)', touchAction: 'manipulation' }}
        >
          Save
        </button>
        <a
          href={USAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--hair)',
            color: 'var(--txt-hi)',
            touchAction: 'manipulation',
          }}
        >
          Open Usage
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {!report && (
        <p className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>
          Tip: paste the Egress number from the org Usage page once a week so this banner can warn you before clients get locked out.
        </p>
      )}
    </div>
  );
};

export default CoachPlanRiskBanner;
