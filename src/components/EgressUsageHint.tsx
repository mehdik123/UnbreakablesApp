import React, { useEffect, useState } from 'react';
import { getLocalEgressEstimate, EGRESS_SOFT_TARGET_GB, FREE_EGRESS_GB } from '../utils/photoEgressCache';

/** Coach-only soft meter for photo bandwidth (local estimate, not Supabase bill). */
export const EgressUsageHint: React.FC = () => {
  const [stats, setStats] = useState(() => getLocalEgressEstimate());

  useEffect(() => {
    const id = window.setInterval(() => setStats(getLocalEgressEstimate()), 8000);
    return () => window.clearInterval(id);
  }, []);

  const fetchedGb = stats.fetchedMb / 1024;
  const warn = fetchedGb >= EGRESS_SOFT_TARGET_GB * 0.5;

  return (
    <p className="text-[11px] leading-snug" style={{ color: warn ? 'var(--orange)' : 'var(--txt-lo)' }}>
      Photo bandwidth (this browser, {stats.monthKey}): ~{stats.fetchedMb.toFixed(1)} MB fetched ·{' '}
      {stats.cacheHits} cache hits. Free org limit is {FREE_EGRESS_GB} GB/mo — stay under ~
      {EGRESS_SOFT_TARGET_GB} GB total across all clients.
    </p>
  );
};

export default EgressUsageHint;
