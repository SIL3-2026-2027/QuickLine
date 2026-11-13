export default function Logo({ size = 'md', showText = true }) {
  const sizes = {
    sm: 'w-7 h-7 text-base',
    md: 'w-9 h-9 text-xl',
    lg: 'w-14 h-14 text-3xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2">
      {/* Logo rond avec dégradé tricolore */}
      <div className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-red-500/20 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-500 to-green-600"></div>
        <span className="relative z-10">Q</span>
      </div>
      {showText && (
        <span className={`font-black tracking-tight ${textSizes[size]}`}>
          Quick<span className="text-red-600">Line</span>
        </span>
      )}
    </div>
  );
}
