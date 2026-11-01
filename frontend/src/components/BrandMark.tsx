export default function BrandMark() {
  return (
    <svg className="brand-symbol" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="brand-metal" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#edaa64" />
          <stop offset=".55" stopColor="#c56a28" />
          <stop offset="1" stopColor="#a95220" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#brand-metal)"
        strokeWidth="4.4"
        strokeLinecap="round"
      >
        <path d="M8 19A17 17 0 0 1 36 10" />
        <path d="M40 29A17 17 0 0 1 12 38" />
        <path d="m10 29 7-8 7 7 7-8 7 1" />
      </g>
      <path d="m35 4 6 9-11 1ZM13 44l-6-9 11-1Z" fill="url(#brand-metal)" />
    </svg>
  );
}
