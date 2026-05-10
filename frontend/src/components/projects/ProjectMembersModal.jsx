import { useEffect, useId, useRef, useState } from 'react'
import { projectService } from '../../services/projectService'
import { getErrorMessage } from '../../utils/errorMessage'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../utils/cn'

function MemberBadge({ role }) {
  const styles = {
    Owner: 'bg-amber-100 text-amber-800 ring-amber-200',
    Admin: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
    Member: 'bg-slate-100 text-slate-700 ring-slate-200',
  }
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', styles[role] || styles.Member)}>
      {role}
    </span>
  )
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

export default function ProjectMembersModal({ open, onClose, projectId, projectName }) {
  const titleId = useId()
  const toast = useToast()
  const emailRef = useRef(null)

  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Member')
  const [inviting, setInviting] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (!open || !projectId) return
    setLoading(true)
    projectService.getById(projectId)
      .then((data) => {
        setMembers(data.members || [])
        setInvitations(data.invitations || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, projectId])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleInvite(e) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) return
    setInviting(true)
    try {
      const result = await projectService.inviteMember(projectId, { email, member_role: inviteRole })
      toast.success('Invited', result.message || `Invited ${email}`)
      setInviteEmail('')
      // Refresh members
      const data = await projectService.getById(projectId)
      setMembers(data.members || [])
      setInvitations(data.invitations || [])
    } catch (err) {
      toast.error('Invite failed', getErrorMessage(err, 'Could not invite member.'))
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId, name) {
    if (!window.confirm(`Remove ${name} from this project?`)) return
    setRemovingId(userId)
    try {
      await projectService.removeMember(projectId, userId)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
      toast.success('Removed', `${name} removed from project`)
    } catch (err) {
      toast.error('Error', getErrorMessage(err, 'Could not remove member.'))
    } finally {
      setRemovingId(null)
    }
  }

  async function handleCancelInvitation(invitationId) {
    try {
      await projectService.cancelInvitation(projectId, invitationId)
      setInvitations((prev) => prev.filter((i) => i.invitation_id !== invitationId))
      toast.info('Cancelled', 'Invitation cancelled')
    } catch (err) {
      toast.error('Error', getErrorMessage(err))
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 m-0 max-h-[min(90vh,700px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:m-4 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Members
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{projectName || 'Project'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="border-b border-slate-100 px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Invite by email</p>
          <div className="flex gap-2">
            <input
              ref={emailRef}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {inviting ? '…' : 'Invite'}
            </button>
          </div>
        </form>

        {/* Members list */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="h-2.5 w-32 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
              <ul className="divide-y divide-slate-100">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-[11px] font-bold text-white">
                      {getInitials(m.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{m.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{m.email}</p>
                    </div>
                    <MemberBadge role={m.member_role} />
                    {m.member_role !== 'Owner' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.user_id, m.full_name)}
                        disabled={removingId === m.user_id}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Remove"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {/* Pending invitations */}
              {invitations.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Pending invitations
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {invitations.map((inv) => (
                      <li key={inv.invitation_id} className="flex items-center gap-3 py-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-xs text-slate-400">
                          ✉
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-700">{inv.email}</p>
                          <p className="text-[11px] text-slate-400">Pending • {inv.member_role}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancelInvitation(inv.invitation_id)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
