const borderMap = {
  blue: 'border-blue-500',
  green: 'border-emerald-500',
  yellow: 'border-amber-500',
  red: 'border-rose-500',
  purple: 'border-purple-500',
  sky: 'border-sky-500',
};

const iconBgMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
  purple: 'bg-purple-50 text-purple-600',
  sky: 'bg-sky-50 text-sky-600',
};

export default function StatsCard({ title, value, icon, color = 'blue' }) {
  const borderClass = borderMap[color] || borderMap.blue;
  const iconClass = iconBgMap[color] || iconBgMap.blue;

  return (
    <div className={`flex items-center gap-4 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${borderClass}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${iconClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="text-2xl font-display font-bold text-slateink-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}
