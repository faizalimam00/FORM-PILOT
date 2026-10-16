import { useState } from 'react';
import type { ReactNode } from 'react';
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="currentColor" />
        <path
          d="M10 9h12M10 15h7M10 21h5m4 0 3 3 5-7"
          stroke="var(--logo-ink, white)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {!compact && <span>FormPilot</span>}
    </span>
  );
}
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  return (
    <button
      className="icon-button"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() => {
        const next =
          document.documentElement.dataset.theme === 'dark' ||
          (!document.documentElement.dataset.theme &&
            matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'light'
            : 'dark';
        document.documentElement.dataset.theme = next;
        setDark(next === 'dark');
      }}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" />
          </>
        ) : (
          <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
        )}
      </svg>
    </button>
  );
}
export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'error' | 'success' | 'warning';
}) {
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
