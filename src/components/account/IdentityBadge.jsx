import { getUserDisplayName, getUserEmail, getVisiblePlanLabel, getWorkspaceBrandLogo, getWorkspaceDisplayName } from '../../utils/profile'

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
  showWorkspaceName = true,
  className = ''
}) {
  const displayName = getUserDisplayName(profile, user)
  const email = getUserEmail(profile, user)
  const tierLabel = getVisiblePlanLabel(profile)
  const logoUrl = getWorkspaceBrandLogo(profile)
  const workspaceName = getWorkspaceDisplayName(profile)
  const initials = getInitials(displayName || email)

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-semibold text-white">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0">
        <div className={`truncate font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
          {displayName}
        </div>
        {showWorkspaceName && workspaceName && workspaceName !== displayName && (
          <div className="truncate text-xs text-slate-400">{workspaceName}</div>
        )}
        {showEmail && email && (
          <div className="truncate text-xs text-slate-400">{email}</div>
        )}
        <div className="mt-1 inline-flex rounded-full border border-surface-border bg-surface-darker/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-gold">
          {tierLabel}
        </div>
        {profile?.platformRole === 'platform_admin' && (
          <div className="mt-1 inline-flex rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-300">
            Platform Admin
          </div>
        )}
      </div>
    </div>
  )
}
