import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false, className }) => {
  return (
    <div className={`brand-logo ${className || ''}`}>
      <svg viewBox="0 0 64 64" className={`brand-logo-mark ${compact ? 'h-8 w-8' : 'h-10 w-10'}`} aria-hidden="true">
        <circle cx="32" cy="32" r="29" className="brand-logo-ring" />
        <path
          d="M13 36C18 24 30 18 42 18C48 18 52 20 55 22L45 27C43 26 40 25 36 25C28 25 22 29 19 37H33L28 44H10L13 36Z"
          className="brand-logo-track"
        />
        <path d="M40 41H54L50 47H36L40 41Z" className="brand-logo-track brand-logo-track-secondary" />
        <circle cx="46.5" cy="25" r="4" className="brand-logo-apex" />
      </svg>

      {!compact ? (
        <div className="leading-none">
          <p className="brand-logo-word">
            F<span className="brand-logo-red">1</span>IQ
          </p>
          <p className="brand-logo-tag">Race Intelligence Platform</p>
        </div>
      ) : (
        <p className="font-f1-display text-xl font-semibold tracking-[0.14em] text-f1-text">
          F<span className="brand-logo-red">1</span>IQ
        </p>
      )}
    </div>
  );
};

export default BrandLogo;
