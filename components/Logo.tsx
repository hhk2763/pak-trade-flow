interface LogoProps {
  className?: string;
  hullColor?: string;
  accentColor?: string;
  showWordmark?: boolean;
}

// Recreated from website/logo.html and website/page.html's inline SVG mark.
// The wordmark is real HTML text here (not baked into the SVG <text> element
// like the original mockups) so it stays accessible and crisp at any size.
export function Logo({
  className = "",
  hullColor = "#0b1c30",
  accentColor = "#006a61",
  showWordmark = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-sm ${className}`}>
      <svg
        className="h-8 w-auto shrink-0"
        viewBox="80 270 860 370"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path fill={hullColor} d="M150 480 L180 620 L800 620 L880 480 Z" />
        <rect fill={hullColor} height="80" rx="4" width="120" x="220" y="400" />
        <rect fill={hullColor} height="60" rx="4" width="100" x="360" y="420" />
        <rect fill={hullColor} height="40" rx="4" width="80" x="480" y="440" />
        <path
          className="pulse-line"
          stroke={accentColor}
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          d="M100 530 L250 530 L280 480 L310 580 L340 530 L550 530 L580 440 L610 620 L640 530 L900 530"
        />
        <path fill={accentColor} d="M500 400 L750 300 L750 420 L720 420 L720 330 L530 410 Z" />
        <rect fill={accentColor} height="30" rx="2" width="60" x="720" y="420" />
      </svg>
      {showWordmark && (
        <span
          className="font-headline-sm text-headline-sm whitespace-nowrap"
          style={{ color: hullColor }}
        >
          PAK TRADE FLOW
        </span>
      )}
    </div>
  );
}
