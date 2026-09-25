/**
 * Web Share / clipboard fallback chain with injected dependencies, so every branch is testable
 * without a browser. `getBrowserDeps()` adapts the real environment for the UI.
 */

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

export interface ShareDeps {
  share?: (payload: SharePayload) => Promise<void>;
  canShare?: (payload: SharePayload) => boolean;
  writeClipboard?: (text: string) => Promise<void>;
  /** Legacy synchronous copy (document.execCommand). Returns whether the copy worked. */
  execCopy?: (text: string) => boolean;
}

/** 'manual' means nothing could copy automatically; show the link so the user can copy it. */
export type CopyOutcome = 'copied' | 'manual';
export type ShareOutcome = 'shared' | 'cancelled' | CopyOutcome;

export function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError';
}

export async function copyLink(deps: ShareDeps, url: string): Promise<CopyOutcome> {
  if (deps.writeClipboard) {
    try {
      await deps.writeClipboard(url);
      return 'copied';
    } catch {
      // Fall through to the legacy path.
    }
  }
  if (deps.execCopy) {
    try {
      if (deps.execCopy(url)) return 'copied';
    } catch {
      // Fall through to manual copy.
    }
  }
  return 'manual';
}

export async function performShare(deps: ShareDeps, payload: SharePayload): Promise<ShareOutcome> {
  let canShare = Boolean(deps.share);
  if (canShare && deps.canShare) {
    try { canShare = deps.canShare(payload); } catch { canShare = false; }
  }
  if (deps.share && canShare) {
    try {
      await deps.share(payload);
      return 'shared';
    } catch (error) {
      if (isAbortError(error)) return 'cancelled';
    }
  }
  return copyLink(deps, payload.url);
}

/** The slice of Document used by the legacy copy path (execCommand is deprecated but still the only option without the Clipboard API). */
interface LegacyCopyDocument {
  body: { appendChild(node: unknown): unknown; removeChild(node: unknown): unknown } | null;
  createElement(tag: 'textarea'): { value: string; style: Record<string, string>; setAttribute(name: string, value: string): void; select(): void; setSelectionRange(start: number, end: number): void };
  execCommand(command: 'copy'): boolean;
}

interface BrowserEnv {
  navigator?: Pick<Navigator, 'share' | 'canShare' | 'clipboard'>;
  document?: LegacyCopyDocument;
}

export function getBrowserDeps(env: BrowserEnv = globalThis as BrowserEnv): ShareDeps {
  const nav = env.navigator;
  const doc = env.document;
  const body = doc?.body;
  const deps: ShareDeps = {};
  if (nav && typeof nav.share === 'function') {
    deps.share = (payload) => nav.share(payload);
    if (typeof nav.canShare === 'function') deps.canShare = (payload) => nav.canShare(payload);
  }
  if (nav?.clipboard && typeof nav.clipboard.writeText === 'function') {
    const clipboard = nav.clipboard;
    deps.writeClipboard = (text) => clipboard.writeText(text);
  }
  if (doc && body && typeof doc.execCommand === 'function') {
    deps.execCopy = (text) => {
      const field = doc.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      body.appendChild(field);
      try {
        field.select();
        field.setSelectionRange(0, text.length);
        return doc.execCommand('copy');
      } finally {
        body.removeChild(field);
      }
    };
  }
  return deps;
}
