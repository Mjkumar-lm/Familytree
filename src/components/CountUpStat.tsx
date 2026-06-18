import { useEffect, useRef, useState } from "react";

interface CountUpStatProps {
  target: number | string;
  label: string;
  delay?: number;
}

export const CountUpStat = ({ target, label, delay = 0 }: CountUpStatProps) => {
  const [value, setValue] = useState<number | string>(typeof target === "number" ? 0 : target);
  const containerRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof target !== "number") return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();
          setTimeout(() => {
            const duration = 1600;
            const startTime = performance.now();
            const tick = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.round(eased * (target as number)));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }, delay);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, delay]);

  return (
    <div ref={containerRef} className="about-stat" data-reveal style={{ transitionDelay: `${delay / 1000}s` }}>
      <span className="about-stat-num">{value}</span>
      <span className="about-stat-label">{label}</span>
    </div>
  );
};
