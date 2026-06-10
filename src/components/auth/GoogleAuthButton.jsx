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
        <>
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21.35 11.1H12v3.7h5.38c-.23 1.23-.97 2.27-2.02 2.97v2.47h3.28c1.92-1.77 3.03-4.38 3.03-7.47 0-.72-.06-1.42-.32-2.14Z"
              fill="#4285F4"
            />
            <path
              d="M12 22c2.73 0 5.02-.9 6.69-2.44l-3.28-2.47c-.91.61-2.08.98-3.41.98-2.62 0-4.84-1.77-5.63-4.15H2.92v2.58A10 10 0 0 0 12 22Z"
              fill="#34A853"
            />
            <path
              d="M6.37 13.92A5.99 5.99 0 0 1 6 12c0-.67.12-1.32.37-1.92V7.5H2.92A10 10 0 0 0 2 12c0 1.61.39 3.13.92 4.5l3.45-2.58Z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.98c1.49 0 2.82.52 3.87 1.54l2.9-2.9A9.88 9.88 0 0 0 12 2a10 10 0 0 0-9.08 5.5l3.45 2.58C7.16 7.75 9.38 5.98 12 5.98Z"
              fill="#EA4335"
            />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
