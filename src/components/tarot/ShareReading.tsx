import { useEffect, useId, useRef, useState } from 'react';
import { SITE_URL } from '../../config/site';
import { copyLink, getBrowserDeps, performShare, type ShareOutcome } from '../../utils/shareActions';
import { buildShareText, buildShareUrl, resolveShareOrigin, type SharedReading } from '../../utils/shareReading';

const MESSAGE_MS = 2500;

export default function ShareReading({ reading }: { reading: SharedReading }) {
  const [message, setMessage] = useState('');
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => { if (manualUrl) input.current?.select(); }, [manualUrl]);

  function say(text: string, autoClear = false) {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    if (autoClear) timer.current = setTimeout(() => setMessage(''), MESSAGE_MS);
  }

  async function run(action: (url: string) => Promise<ShareOutcome>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      const url = buildShareUrl(reading, resolveShareOrigin(SITE_URL, window.location.origin));
      const outcome = await action(url);
      if (!mounted.current) return;
      if (outcome === 'manual') {
        setManualUrl(url);
        say('Copy this link to share your reading.');
      } else if (outcome === 'copied') {
        setManualUrl(null);
        say('Link copied!', true);
      } else if (outcome === 'shared') {
        setManualUrl(null);
        say('Share opened successfully.', true);
      }
      // 'cancelled': the user closed the share sheet, so nothing changes and nothing is shown.
    } catch {
      if (mounted.current) say('Sharing did not work this time. Please try again.');
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  // The share call happens synchronously inside the click, so it keeps the user-gesture permission.
  const share = () => run((url) => performShare(getBrowserDeps(), { ...buildShareText(reading), url }));
  const copy = () => run((url) => copyLink(getBrowserDeps(), url));

  return <div className="share-reading" aria-busy={busy}>
    <div className="share-buttons">
      <button type="button" className="button button-primary" aria-disabled={busy} onClick={share}>Share My Reading <span aria-hidden="true">↗</span></button>
      <button type="button" className="button button-quiet" aria-disabled={busy} onClick={copy}>Copy Link</button>
    </div>
    {manualUrl && <div className="share-manual">
      <label htmlFor={inputId} className="sr-only">Link to your reading</label>
      <input ref={input} id={inputId} type="text" readOnly value={manualUrl} onFocus={(event) => event.currentTarget.select()} />
      <p>Press Ctrl+C or ⌘+C to copy.</p>
    </div>}
    <p className="share-status" role="status" aria-live="polite">{message}</p>
  </div>;
}
