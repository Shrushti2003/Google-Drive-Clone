export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg border border-white/10 bg-white/[0.06] shadow-[0_20px_70px_rgba(0,0,0,.25)] ${className}`} />;
}
