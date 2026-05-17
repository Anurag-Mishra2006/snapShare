
export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {/* Camera body */}
        <rect x="2" y="10" width="22" height="18" rx="3" stroke="white" strokeWidth="1.8"/>
        {/* Lens */}
        <circle cx="13" cy="19" r="5" stroke="white" strokeWidth="1.8"/>
        <circle cx="13" cy="19" r="2" fill="white" opacity="0.6"/>
        {/* Notch */}
        <rect x="6" y="6" width="7" height="5" rx="1.5" stroke="white" strokeWidth="1.8"/>
        {/* Share lines */}
        <line x1="25" y1="14" x2="31" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="25" y1="19" x2="31" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="25" y1="24" x2="31" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Share dots */}
        <circle cx="33" cy="11" r="2" stroke="white" strokeWidth="1.5"/>
        <circle cx="33" cy="19" r="2" stroke="white" strokeWidth="1.5"/>
        <circle cx="33" cy="27" r="2" stroke="white" strokeWidth="1.5"/>
      </svg>

      {/* Wordmark */}
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-white tracking-tight">Snap</span>
        <span className="text-xl font-light text-white/60 tracking-tight">Share</span>
      </div>
    </div>
  )
}