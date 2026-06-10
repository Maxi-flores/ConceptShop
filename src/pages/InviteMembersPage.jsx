import { useEffect, useMemo, useState } from 'react'
import { onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import AlertCard from '../components/auth/AlertCard'
import { buildInviteLink, createInviteRecord, revokeInviteRecord } from '../firebase/auth'
import { canManageInvites, getAccountTierDescription, getAccountTierLabel, getInviteCapacityLabel, getInvitePermissionMessage } from '../utils/profile'

const formatDate = (value) => {
  if (!value) return 'Not set'
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const getInviteScope = (profile, user) => {
  if (profile?.workspaceId) {
    return { field: 'workspaceId', value: profile.workspaceId }
  }

  return { field: 'createdByUid', value: user?.uid || '' }
}

const buildMailtoHref = ({ email, code, link, role, note }) => {
  const subject = encodeURIComponent("You're invited to ConceptSHOP")
  const body = encodeURIComponent([
    'Hi,',
    '',
    `You have been invited to ConceptSHOP as a ${role}.`,
    `Invite code: ${code}`,
    `Invite link: ${link}`,
    note ? `Note: ${note}` : null,
    '',
    'Open the link, sign in with the invited email address, and complete onboarding.'
  ].filter(Boolean).join('\n'))

  return `mailto:${email || ''}?subject=${subject}&body=${body}`
}

export default function InviteMembersPage() {
  const { user, profile, isAdmin, isPlatformAdmin } = useAuth()
  const [invites, setInvites] = useState([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [note, setNote] = useState('')
  const [generatedInvite, setGeneratedInvite] = useState(null)

  const inviteScope = useMemo(() => getInviteScope(profile, user), [profile, user])
  const activeInviteCount = useMemo(() => invites.filter((invite) => invite.status === 'pending' || invite.status === 'accepted').length, [invites])
  const isPlatformOverride = isPlatformAdmin || profile?.platformRole === 'platform_admin'
  const inviteBlockedMessage = getInvitePermissionMessage(profile)
  const canInvite = canManageInvites(profile)
  const inviteCapacityLabel = getInviteCapacityLabel(profile, activeInviteCount)
  const accountTierLabel = getAccountTierLabel(profile)
  const accountTierDescription = getAccountTierDescription(profile)
  const hasInviteCapacity = isPlatformOverride || activeInviteCount < 2

  useEffect(() => {
    if (!inviteScope.value) {
      setInvites([])
      setLoadingInvites(false)
      return undefined
    }

    setLoadingInvites(true)
    const invitesRef = collection(db, 'inviteCodes')
    const inviteQuery = query(invitesRef, where(inviteScope.field, '==', inviteScope.value))

    const unsubscribe = onSnapshot(
      inviteQuery,
      (snapshot) => {
        const records = snapshot.docs.map((inviteDoc) => ({
          id: inviteDoc.id,
          ...inviteDoc.data()
        }))

        records.sort((a, b) => {
          const aTime = typeof a.createdAt?.toDate === 'function' ? a.createdAt.toDate().getTime() : 0
          const bTime = typeof b.createdAt?.toDate === 'function' ? b.createdAt.toDate().getTime() : 0
          return bTime - aTime
        })

        setInvites(records)
        setLoadingInvites(false)
      },
      (error) => {
        console.error('Error loading invite members:', {
          code: error?.code,
          message: error?.message,
          error
        })
        setFormError('Unable to load invites right now. Please refresh and try again.')
        setLoadingInvites(false)
      }
    )

    return () => unsubscribe()
  }, [inviteScope.field, inviteScope.value])

  const resetForm = () => {
    setInviteeEmail('')
    setInviteRole('member')
    setNote('')
  }

  const handleCreateInvite = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!canInvite) {
      setFormError(inviteBlockedMessage || 'Starter accounts cannot invite team members. Upgrade to Team or Business, or use a platform admin account.')
      return
    }

    if (!isAdmin && !isPlatformOverride) {
      setFormError('Only admins can create invites.')
      return
    }

    if (!inviteeEmail.trim()) {
      setFormError('Please enter the invitee email address.')
      return
    }

    if (!hasInviteCapacity) {
      setFormError('You have reached your invite capacity of 2 sub members.')
      return
    }

    setFormLoading(true)

    try {
      const result = await createInviteRecord({
        createdByUid: user.uid,
        createdByEmail: user.email || '',
        email: inviteeEmail.trim(),
        role: inviteRole,
        note: note.trim(),
        workspaceId: profile?.workspaceId || null
      })

      setGeneratedInvite(result)
      resetForm()
    } catch (error) {
      console.error('Error creating invite member record:', {
        code: error?.code,
        message: error?.message,
        error
      })
      setFormError(error?.message || 'Failed to create invite.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleCopyLink = async (link) => {
    await navigator.clipboard.writeText(link)
  }

  const handleRevoke = async (invite) => {
    try {
      await revokeInviteRecord({
        code: invite.code || invite.id,
        revokedByUid: user.uid
      })
    } catch (error) {
      console.error('Error revoking invite:', {
        code: error?.code,
        message: error?.message,
        error
      })
      setFormError(error?.message || 'Failed to revoke invite.')
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AlertCard tone="warning">
          Invite Members is available to admins and platform admins only.
        </AlertCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-gold">Admin tools</div>
          <h1 className="text-3xl font-bold text-white">Invite Members</h1>
          <p className="max-w-2xl text-slate-400">
            Invite people by email, generate a secure invite link, and track pending or accepted joins from one place.
          </p>
        </div>

          <div className="rounded-2xl border border-surface-border bg-surface-darker/50 px-4 py-3 text-sm text-slate-300">
            <div className="text-slate-500">Invite capacity</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {inviteCapacityLabel}
            </div>
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-surface-border bg-surface-card/70 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Account tier</div>
          <div className="mt-2 text-2xl font-semibold text-white">{accountTierLabel}</div>
          <p className="mt-2 text-sm text-slate-400">{accountTierDescription}</p>
        </div>
        <div className="rounded-3xl border border-surface-border bg-surface-card/70 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Invite access</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {canInvite ? 'Enabled' : 'Locked'}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {canInvite
              ? 'You can create and revoke invite links.'
              : inviteBlockedMessage || 'Starter accounts cannot invite team members. Upgrade to Team or Business, or use a platform admin account.'}
          </p>
        </div>
      </div>

      {!canInvite && (
        <AlertCard tone="warning">
          {inviteBlockedMessage || 'Starter accounts cannot invite team members. Upgrade to Team or Business, or use a platform admin account.'}
        </AlertCard>
      )}

      {formError && <AlertCard>{formError}</AlertCard>}

      {generatedInvite && (
        <div className="rounded-3xl border border-accent-emerald/20 bg-accent-emerald/10 p-5">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-emerald">Invite ready</div>
          <div className="mt-2 text-xl font-semibold text-white">{generatedInvite.code}</div>
          <div className="mt-3 break-all rounded-2xl border border-surface-border bg-surface-darker/60 p-4 text-sm text-slate-300">
            {generatedInvite.link}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleCopyLink(generatedInvite.link)}
              className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Copy invite link
            </button>
            <a
              href={buildMailtoHref({
                email: generatedInvite.invite?.email || '',
                code: generatedInvite.code,
                link: generatedInvite.link,
                role: generatedInvite.invite?.role || 'member',
                note: generatedInvite.invite?.note || ''
              })}
              className="rounded-xl border border-surface-border bg-surface-darker/60 px-5 py-3 font-semibold text-white transition-colors hover:bg-surface-border"
            >
              Email invite
            </a>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-3xl border border-surface-border bg-surface-card/70 p-6">
          <h2 className="text-xl font-semibold text-white">Invite a member</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter the email, choose the role, and we’ll generate a code and link that the invited person can use.
          </p>

          <form onSubmit={handleCreateInvite} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Invitee email</label>
              <input
                type="email"
                value={inviteeEmail}
                onChange={(event) => setInviteeEmail(event.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                placeholder="teammate@company.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Optional note</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                placeholder="Add a friendly note for the invitee"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading || !canInvite || !hasInviteCapacity}
              className="w-full rounded-xl bg-accent-gold px-5 py-3 font-semibold text-black transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              title={!canInvite ? inviteBlockedMessage || 'Invite access is locked for this account tier.' : undefined}
            >
              {formLoading ? 'Creating invite...' : 'Create invite'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-surface-border bg-surface-card/70 p-6">
            <h2 className="text-xl font-semibold text-white">Invite overview</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Limit</div>
                <div className="mt-2 text-2xl font-bold text-white">{inviteCapacityLabel}</div>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending</div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {invites.filter((invite) => invite.status === 'pending').length}
                </div>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Accepted</div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {invites.filter((invite) => invite.status === 'accepted').length}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-surface-border bg-surface-card/70 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Pending invites</h2>
                <p className="text-sm text-slate-400">Invites waiting to be accepted.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {loadingInvites ? (
                <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-400">
                  Loading invites...
                </div>
              ) : invites.filter((invite) => invite.status === 'pending').length === 0 ? (
                <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-400">
                  No pending invites yet.
                </div>
              ) : invites.filter((invite) => invite.status === 'pending').map((invite) => {
                const link = buildInviteLink(invite.code || invite.id)
                return (
                  <div key={invite.id} className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-white">{invite.email || 'No email specified'}</div>
                        <div className="text-sm text-slate-400">
                          Code: <span className="font-mono text-white">{invite.code || invite.id}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          Role: <span className="text-white">{invite.role || 'member'}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          Expires: <span className="text-white">{formatDate(invite.expiresAt)}</span>
                        </div>
                        {invite.note && <div className="text-sm text-slate-400">{invite.note}</div>}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link)}
                          className="rounded-lg border border-surface-border bg-surface-darker px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-surface-border"
                        >
                          Copy link
                        </button>
                        <a
                          href={buildMailtoHref({
                            email: invite.email,
                            code: invite.code || invite.id,
                            link,
                            role: invite.role || 'member',
                            note: invite.note || ''
                          })}
                          className="rounded-lg border border-surface-border bg-surface-darker px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-surface-border"
                        >
                          Mail invite
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRevoke(invite)}
                          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-surface-border bg-surface-card/70 p-6">
            <h2 className="text-xl font-semibold text-white">Accepted invites</h2>
            <p className="text-sm text-slate-400">People who have already joined through an invite.</p>

            <div className="mt-4 space-y-3">
              {loadingInvites ? (
                <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-400">
                  Loading invites...
                </div>
              ) : invites.filter((invite) => invite.status === 'accepted').length === 0 ? (
                <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-400">
                  No accepted invites yet.
                </div>
              ) : invites.filter((invite) => invite.status === 'accepted').map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-white">{invite.email || 'No email specified'}</div>
                      <div className="text-sm text-slate-400">
                        Code: <span className="font-mono text-white">{invite.code || invite.id}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Accepted by: <span className="text-white">{invite.acceptedByEmail || invite.acceptedByUid || 'Unknown'}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Accepted: <span className="text-white">{formatDate(invite.acceptedAt)}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Role: <span className="text-white">{invite.role || 'member'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRevoke(invite)}
                        className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
