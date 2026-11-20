// Wordmark provisional de Spotea: un spot luminoso dentro de una órbita abierta.
export function SpoteaLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 132 40" role="img" aria-label="Spotea" className={className}>
      <text x="0" y="31" fill="currentColor" fontFamily="inherit" fontSize="34" fontWeight="800" letterSpacing="-1">sp</text>
      <circle cx="53" cy="22" r="10" fill="none" stroke="#a99aff" strokeWidth="4" strokeDasharray="50 13" transform="rotate(-40 53 22)" strokeLinecap="round" />
      <circle cx="53" cy="22" r="3.5" fill="#c7ff70" />
      <text x="68" y="31" fill="currentColor" fontFamily="inherit" fontSize="34" fontWeight="800" letterSpacing="-1">tea</text>
    </svg>
  );
}
