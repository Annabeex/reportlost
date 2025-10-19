'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = { title: string; text?: string };

export default function ShareButton({ title, text = '' }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const url = useMemo(() => window.location.href, []);
  const enc = (s: string) => encodeURIComponent(s);

  // Close the menu on outside click / ESC
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const openPopup = (href: string) => {
    const w = 680;
    const h = 600;
    const y = window.top ? (window.top.outerHeight - h) / 2 + window.top.screenY : 0;
    const x = window.top ? (window.top.outerWidth - w) / 2 + window.top.screenX : 0;
    window.open(
      href,
      'share',
      `popup=yes,toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=1,width=${w},height=${h},top=${y},left=${x}`,
    );
  };

  // Platform URLs
  const shareToFacebook = () => {
    // Facebook ne permet pas de pré-remplir un message; il partage l'URL et lit tes balises OG.
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`);
    setOpen(false);
  };

  const shareToX = () => {
    openPopup(`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`);
    setOpen(false);
  };

  const shareByEmail = () => {
    const subject = title;
    const body = `${text ? text + '\n\n' : ''}${url}`;
    window.location.href = `mailto:?subject=${enc(subject)}&body=${enc(body)}`;
    setOpen(false);
  };

  const shareBySMS = () => {
    // iOS utilise `&body=`, Android plutôt `?body=` — on essaie d'être large.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const sep = isIOS ? '&' : '?';
    const body = `${title} — ${url}`;
    window.location.href = `sms:${sep}body=${enc(body)}`;
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // petit feedback visuel
      const btn = document.getElementById('share-copy-toast');
      if (btn) {
        btn.classList.remove('opacity-0');
        setTimeout(() => btn.classList.add('opacity-0'), 1400);
      } else {
        alert('Link copied!');
      }
    } catch {
      alert('Copy failed');
    }
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center rounded-lg bg-[#226638] text-white px-5 py-2.5 font-semibold shadow hover:brightness-110"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Share this report
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <button
            role="menuitem"
            onClick={shareToFacebook}
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
          >
            Share on Facebook
          </button>
          <button
            role="menuitem"
            onClick={shareToX}
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
          >
            Share on X
          </button>
          <button
            role="menuitem"
            onClick={shareByEmail}
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
          >
            Share by Email
          </button>
          <button
            role="menuitem"
            onClick={shareBySMS}
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
          >
            Share by SMS
          </button>
          <button
            role="menuitem"
            onClick={copyLink}
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
          >
            Copy link
          </button>
        </div>
      )}

      {/* Toast copie */}
      <div
        id="share-copy-toast"
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-3 py-1 text-xs text-white opacity-0 transition-opacity"
      >
        Link copied ✓
      </div>
    </div>
  );
}
