import { useCallback, useRef, useState } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  lightX: number;
  lightY: number;
}

const defaultState: TiltState = { rotateX: 0, rotateY: 0, lightX: 50, lightY: 50 };

export function useMouseTilt(maxTilt = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>(defaultState);
  const raf = useRef<number>(0);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setTilt({
        rotateX: (0.5 - y) * maxTilt,
        rotateY: (x - 0.5) * maxTilt,
        lightX: x * 100,
        lightY: y * 100,
      });
    });
  }, [maxTilt]);

  const onMouseLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setTilt(defaultState);
  }, []);

  return { ref, tilt, onMouseMove, onMouseLeave };
}
