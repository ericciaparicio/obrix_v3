type LogoProps = {
  size?: number;
  showWordmark?: boolean;
};

export default function Logo({ size = 44, showWordmark = true }: LogoProps) {
  return (
    <div className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        role="img"
        aria-label="Obrix"
      >
        <rect width="56" height="56" rx="16" fill="#1a1a2e" />
        {/* Techo */}
        <path d="M28 12 L44 24 L40 24 L40 26 L16 26 L16 24 L12 24 Z" fill="#fff" />
        {/* Cuerpo de la casa */}
        <rect x="16" y="26" width="24" height="16" fill="#fff" />
        {/* Puerta (hueco de presupuesto/gasto) */}
        <rect x="24" y="32" width="8" height="10" fill="#1a1a2e" />
      </svg>
      {showWordmark && <span className="logo-wordmark">Obrix</span>}
    </div>
  );
}
