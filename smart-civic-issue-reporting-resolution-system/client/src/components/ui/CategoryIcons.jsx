export const categoryConfig = {
  Roads: { emoji: '🛣️', color: '#F59E0B', label: 'Roads' },
  Water: { emoji: '💧', color: '#3B82F6', label: 'Water' },
  Sanitation: { emoji: '🗑️', color: '#10B981', label: 'Sanitation' },
  Electricity: { emoji: '⚡', color: '#F97316', label: 'Electricity' },
  Drainage: { emoji: '🌊', color: '#06B6D4', label: 'Drainage' },
  Other: { emoji: '📍', color: '#6B7280', label: 'Other' },
};

export function getCategoryConfig(category) {
  return categoryConfig[category] || categoryConfig.Other;
}

export function CategoryEmoji({ category, size = 'text-2xl' }) {
  const config = getCategoryConfig(category);
  return <span className={size}>{config.emoji}</span>;
}

export function CategoryBadge({ category, className = '' }) {
  const config = getCategoryConfig(category);
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white ${className}`}
      style={{ backgroundColor: config.color }}
    >
      <span>{config.emoji}</span>
      <span>{category}</span>
    </div>
  );
}
