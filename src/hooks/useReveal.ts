import { useEffect, useRef, useState } from 'react';

/**
 * Revela um elemento quando ele entra na viewport.
 * Retorna ref + flag `visible`.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15 }
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      });
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}
