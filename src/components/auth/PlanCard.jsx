export default function PlanCard({ plan, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-5 text-left transition-all ${
        active
          ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_0_1px_rgba(14,165,233,0.25)]'
          : 'border-surface-border bg-surface-darker/60 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">{plan.title}</div>
          <div className="mt-1 text-sm text-slate-400">{plan.details}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-accent-gold">{plan.priceDisplay}</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{plan.badge}</div>
        </div>
      </div>
    </button>
  )
}
