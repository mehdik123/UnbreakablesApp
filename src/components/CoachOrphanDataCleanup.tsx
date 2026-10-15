import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import {
  dbFindOrphanedClientData,
  dbPurgeOrphanedClientData,
  type OrphanClientDataReport,
} from '../lib/db';

/**
 * One-shot cleanup for leftovers from clients deleted before full wipe existed.
 * Future deletes already call wipeClientRelatedData inside dbDeleteClient.
 */
export const CoachOrphanDataCleanup: React.FC = () => {
  const [report, setReport] = useState<OrphanClientDataReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = async () => {
    setScanning(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: err } = await dbFindOrphanedClientData();
      if (err || !data) {
        setError(err?.message || 'Scan failed');
        setReport(null);
        return;
      }
      setReport(data);
      if (data.orphanClientIds.length === 0) {
        setMessage(`No orphan data found across ${data.liveClientCount} live clients.`);
      } else {
        setMessage(
          `Found ${data.orphanClientIds.length} deleted client id(s) with leftover data.`
        );
      }
    } finally {
      setScanning(false);
    }
  };

  const purge = async () => {
    if (!report?.orphanClientIds.length) return;
    if (
      !window.confirm(
        `Permanently delete leftover data for ${report.orphanClientIds.length} removed client(s)?\n\nThis clears orphaned meals, workouts, photos, logs, and storage files. Live clients are not touched.`
      )
    ) {
      return;
    }
    setPurging(true);
    setError(null);
    try {
      const { data, error: err } = await dbPurgeOrphanedClientData(report.orphanClientIds);
      if (err && !data) {
        setError(err.message || 'Purge failed');
        return;
      }
      const purged = data?.purged ?? 0;
      const failed = data?.failed?.length ?? 0;
      setMessage(
        failed
          ? `Purged ${purged} orphan id(s); ${failed} had partial errors (see console).`
          : `Purged ${purged} orphan id(s). Re-scan to confirm.`
      );
      // Re-scan so the coach sees a clean result
      const again = await dbFindOrphanedClientData();
      setReport(again.data);
    } finally {
      setPurging(false);
    }
  };

  const tableEntries = report ? Object.entries(report.byTable) : [];

  return (
    <div
      className="mb-4 rounded-2xl p-3 sm:p-4 space-y-3"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hair)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <Trash2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--txt-mid)' }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold font-display" style={{ color: 'var(--txt-hi)' }}>
            Orphan client data cleanup
          </p>
          <p className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: 'var(--txt-mid)' }}>
            Clients deleted before full wipe may have left plans, photos, or logs behind. Scan finds
            those leftovers; purge removes them. New deletes already wipe everything automatically.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={scan}
          disabled={scanning || purging}
          className="min-h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--hair)',
            color: 'var(--txt-hi)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {scanning ? 'Scanning…' : 'Scan for leftovers'}
        </button>
        <button
          type="button"
          onClick={purge}
          disabled={purging || scanning || !report?.orphanClientIds.length}
          className="min-h-11 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
          style={{
            background: 'var(--grad-red)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {purging
            ? 'Purging…'
            : `Purge orphans${report?.orphanClientIds.length ? ` (${report.orphanClientIds.length})` : ''}`}
        </button>
      </div>

      {message && (
        <p
          className="text-xs sm:text-sm flex items-start gap-2 leading-snug"
          style={{ color: report?.orphanClientIds.length ? 'var(--orange)' : 'var(--green)' }}
        >
          {report?.orphanClientIds.length ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{message}</span>
        </p>
      )}
      {error && (
        <p className="text-xs sm:text-sm" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      {tableEntries.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--txt-lo)' }}>
            Tables with orphan client ids
          </p>
          <ul className="space-y-1">
            {tableEntries.map(([table, count]) => (
              <li key={table} className="text-xs tnum flex justify-between gap-2" style={{ color: 'var(--txt-mid)' }}>
                <span>{table}</span>
                <span style={{ color: 'var(--txt-hi)' }}>{count}</span>
              </li>
            ))}
          </ul>
          {report && report.storageFolderIds.length > 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--txt-mid)' }}>
              Storage folders without a client: {report.storageFolderIds.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CoachOrphanDataCleanup;
