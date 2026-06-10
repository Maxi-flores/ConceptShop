export default function OptionTile({ active = false, title, description, extra, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all ${
        active
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-surface-border bg-surface-darker/60 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="font-semibold text-white">{title}</div>
          {description && <div className="text-sm text-slate-400">{description}</div>}
          {children}
        </div>
        {extra && <div className="text-right text-sm text-accent-gold">{extra}</div>}
      </div>
    </button>
  )
}
