'use client';

import { useEffect } from 'react';

export function LandingTracker() {
  useEffect(() => {
    // Don't track in development if desired (keep for now to test)
    const track = async (event: string, page: string) => {
      try {
        const url = new URL(window.location.href);
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            page,
            referrer: document.referrer || null,
            utm_source: url.searchParams.get('utm_source') || null,
            utm_medium: url.searchParams.get('utm_medium') || null,
            utm_campaign: url.searchParams.get('utm_campaign') || null,
          }),
        });
      } catch {
        // Silently fail — don't break UX for analytics
      }
    };

    // Track initial page view
    track('page_view', window.location.pathname);

    // Track scroll depth milestones
    let scrollMilestones = new Set<number>();
    const handleScroll = () => {
      const scrollPct = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      [25, 50, 75, 100].forEach((milestone) => {
        if (scrollPct >= milestone && !scrollMilestones.has(milestone)) {
          scrollMilestones.add(milestone);
          track(`scroll_${milestone}`, window.location.pathname);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}
