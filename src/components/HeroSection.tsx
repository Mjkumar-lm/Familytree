import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export const HeroSection = ({ onScrollDown }: { onScrollDown: () => void }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={`hero ${visible ? "hero--visible" : ""}`}>
      <div className="hero-bg-pattern" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-mandala" aria-hidden="true">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
            <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 100 + 30 * Math.cos(angle);
              const y1 = 100 + 30 * Math.sin(angle);
              const x2 = 100 + 90 * Math.cos(angle);
              const y2 = 100 + 90 * Math.sin(angle);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />;
            })}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const cx = 100 + 60 * Math.cos(angle);
              const cy = 100 + 60 * Math.sin(angle);
              return <circle key={`dot-${i}`} cx={cx} cy={cy} r="3" fill="currentColor" opacity="0.25" />;
            })}
            <text x="100" y="108" textAnchor="middle" fontSize="28" fontFamily="Cinzel Decorative" fill="currentColor" opacity="0.7">&#x0950;</text>
          </svg>
        </div>

        <p className="hero-sanskrit">&#x0936;&#x094D;&#x0930;&#x0940; &#x0915;&#x0947;&#x0936;&#x094D;&#x0935;&#x093E;&#x0928;&#x093F;&#x092F;&#x093E; &#x0935;&#x0902;&#x0936;</p>
        <h1 className="hero-title">Keshwania's</h1>
        <div className="hero-divider" aria-hidden="true">
          <span />
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.6">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span />
        </div>
        <p className="hero-subtitle">Generations of an ancient lineage<br />preserved in one sacred family record</p>
      </div>

      <button className="hero-scroll-btn" onClick={onScrollDown} aria-label="Scroll to family archive">
        <span>Enter the Archive</span>
        <ChevronDown size={20} className="hero-scroll-icon" />
      </button>

      <div className="hero-corner hero-corner--tl" aria-hidden="true" />
      <div className="hero-corner hero-corner--tr" aria-hidden="true" />
      <div className="hero-corner hero-corner--bl" aria-hidden="true" />
      <div className="hero-corner hero-corner--br" aria-hidden="true" />
    </section>
  );
};
