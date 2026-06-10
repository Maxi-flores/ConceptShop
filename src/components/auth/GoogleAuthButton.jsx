export default function GoogleAuthButton({
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  label = 'Google',
  loadingLabel = 'Google...'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-3 rounded-lg border border-surface-border bg-surface-darker/60 px-4 py-3 font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        loadingLabel
      ) : (
          <span>{label}</span>
      )}
    </button>
  )
}
