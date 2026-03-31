export function commentBody(c) {
  return c.body ?? c.content ?? c.text ?? c.message ?? ''
}

export function commentAuthor(c) {
  const u = c.user ?? c.author ?? c.createdBy
  if (u && typeof u === 'object') {
    return u.name ?? u.email ?? u.username ?? String(u.id ?? '')
  }
  return c.authorName ?? c.userName ?? c.username ?? 'Someone'
}

export function commentAuthorId(c) {
  const u = c.user ?? c.author ?? c.createdBy
  if (u && typeof u === 'object') return u.id ?? u._id
  return c.userId ?? c.authorId ?? null
}

export function commentKey(c, index) {
  return c.id ?? c._id ?? `comment-${index}`
}

export function commentTime(c) {
  const t = c.createdAt ?? c.created_at ?? c.updatedAt
  if (!t) return null
  try {
    return new Date(t).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return String(t)
  }
}

export function initials(name) {
  const s = String(name || '?').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return s.slice(0, 2).toUpperCase()
}
