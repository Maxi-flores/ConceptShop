export default function AlertCard({ tone = 'error', children }) {
  const tones = {
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-accent-gold/10 border-accent-gold/20 text-slate-200',
    success: 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald',
    info: 'bg-primary-500/10 border-primary-500/20 text-slate-200'
  }

  return (
    <div className={`rounded-xl border p-4 text-sm ${tones[tone] || tones.info}`}>
      {children}
    </div>
  )
}
