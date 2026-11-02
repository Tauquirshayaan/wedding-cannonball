// v1 logs locally; events are forwarded to the portal where it has an equivalent.
type Props = Record<string, string | number | boolean>;
const start = Date.now();
const log: { e: string; t: number; p?: Props }[] = [];

export const Analytics = {
  track(e: string, p?: Props) {
    log.push({ e, t: Date.now() - start, p });
    if (log.length > 500) log.shift();
    if (import.meta.env.DEV) console.debug('[analytics]', e, p ?? '');
  },
  sessionLength() { return Math.round((Date.now() - start) / 1000); },
  dump() { return log.slice(); },
};

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => Analytics.track('session_length', { seconds: Analytics.sessionLength() }));
}
