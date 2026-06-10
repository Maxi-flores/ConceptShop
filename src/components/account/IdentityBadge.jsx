import { getAccountTierLabel, getUserDisplayName, getUserEmail } from '../../utils/profile'

const getInitials = (name) => {
  const value = String(name || '').trim()
  if (!value) return 'CS'

  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

export default function IdentityBadge({
  profile,
  user,
  compact = false,
  showEmail = true,
  className = ''
}) {
  const displayName = getUserDisplayName(profile, user)
  const email = getUserEmail(profile, user)
  const tierLabel = getAccountTierLabel(profile)
  const initials = getInitials(displayName || email)

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0">
        <div className={`truncate font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
          {displayName}
        </div>
        {showEmail && email && (
          <div className="truncate text-xs text-slate-400">{email}</div>
        )}
        <div className="mt-1 inline-flex rounded-full border border-surface-border bg-surface-darker/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-gold">
          {tierLabel}
        </div>
      </div>
    </div>
  )
}
