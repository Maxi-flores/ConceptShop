export default function OnboardingSteps({ steps, currentStep }) {
  return (
    <div className="flex flex-wrap gap-3">
      {steps.map((step, index) => {
        const active = index === currentStep
        const complete = index < currentStep

        return (
          <div
            key={step}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
              active
                ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                : complete
                  ? 'border-accent-emerald/20 bg-accent-emerald/10 text-accent-emerald'
                  : 'border-surface-border bg-surface-darker/60 text-slate-500'
            }`}
          >
            {step}
          </div>
        )
      })}
    </div>
  )
}
