import { useState } from 'react';

/**
 * Two small buttons that trigger a file download via the given async
 * exporter functions. Uses Tailwind utility classes only, with no external
 * CSS required for the component appearance.
 *
 * @param {(format: 'xlsx'|'pdf') => Promise<void>} onExport
 */
export default function ExportButtons({ onExport }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  async function handle(format) {
    setBusy(format);
    setError('');
    try {
      await onExport(format);
    } catch (err) {
      setError(err?.message ?? 'Export failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => handle('xlsx')}
        disabled={busy !== null}
        aria-busy={busy === 'xlsx'}
        className="font-mono text-xs tracking-[0.18em] uppercase border border-slate-400 text-slate-800 bg-white px-3 py-1.5 rounded-sm transition-colors hover:bg-slate-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy === 'xlsx' ? 'Preparing…' : '⇩ XLSX'}
      </button>
      <button
        type="button"
        onClick={() => handle('pdf')}
        disabled={busy !== null}
        aria-busy={busy === 'pdf'}
        className="font-mono text-xs tracking-[0.18em] uppercase border border-slate-400 text-slate-800 bg-white px-3 py-1.5 rounded-sm transition-colors hover:bg-slate-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy === 'pdf' ? 'Preparing…' : '⇩ PDF'}
      </button>
      {error && (
        <span className="text-sm text-red-600" aria-live="polite">
          {error}
        </span>
      )}
    </div>
  );
}
