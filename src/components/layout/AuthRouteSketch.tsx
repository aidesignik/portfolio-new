export function AuthRouteSketch({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M40 40 C 160 80, 60 180, 180 220 S 340 320, 220 400 S 80 480, 260 560"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeDasharray="6 10"
        strokeLinecap="round"
      />
      <circle cx="40" cy="40" r="6" fill="white" fillOpacity="0.6" />
      <circle cx="180" cy="220" r="6" fill="white" fillOpacity="0.6" />
      <circle cx="220" cy="400" r="6" fill="white" fillOpacity="0.6" />
      <circle cx="260" cy="560" r="8" fill="white" fillOpacity="0.9" />

      <g
        transform="translate(226 520)"
        stroke="white"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="0" y="0" width="68" height="34" rx="6" />
        <line x1="0" y1="14" x2="68" y2="14" />
        <line x1="18" y1="0" x2="18" y2="14" />
        <line x1="36" y1="0" x2="36" y2="14" />
        <line x1="54" y1="0" x2="54" y2="14" />
        <circle cx="16" cy="40" r="6" fill="#18181b" />
        <circle cx="52" cy="40" r="6" fill="#18181b" />
      </g>

      <rect x="300" y="60" width="18" height="18" rx="3" stroke="white" strokeOpacity="0.15" />
      <rect x="330" y="130" width="14" height="14" rx="3" stroke="white" strokeOpacity="0.12" />
      <rect x="60" y="300" width="16" height="16" rx="3" stroke="white" strokeOpacity="0.12" />
      <rect x="320" y="440" width="20" height="20" rx="4" stroke="white" strokeOpacity="0.15" />
    </svg>
  );
}
