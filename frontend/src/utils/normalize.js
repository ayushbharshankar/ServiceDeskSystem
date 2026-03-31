const STATUS_MAP = {
  'To Do': 'pending',
  'In Progress': 'in_progress',
  Done: 'completed',
}

const REV_STATUS_MAP = {
  pending: 'To Do',
  in_progress: 'In Progress',
  completed: 'Done',
}

const PRIORITY_MAP = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
}

const REV_PRIORITY_MAP = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export function normalizeStatus(s) {
  return STATUS_MAP[s] ?? s
}
export function denormalizeStatus(s) {
  return REV_STATUS_MAP[s] ?? s
}
export function normalizePriority(p) {
  return PRIORITY_MAP[p] ?? p
}
export function denormalizePriority(p) {
  return REV_PRIORITY_MAP[p] ?? p
}

function normalizeList(payload, keys, itemNormalizer) {
  if (payload == null) return []
  let rawItems = []
  if (Array.isArray(payload)) {
    rawItems = payload
  } else {
    for (const k of keys) {
      if (Array.isArray(payload[k])) {
        rawItems = payload[k]
        break
      }
    }
  }
  return itemNormalizer ? rawItems.map(itemNormalizer) : rawItems
}

export function normalizeProject(p) {
  if (!p) return p
  return {
    ...p,
    id: p.project_id ?? p.id,
    name: p.project_name ?? p.name ?? p.title,
  }
}

export function normalizeProjects(payload) {
  return normalizeList(payload, ['projects', 'items', 'data'], normalizeProject)
}

export function normalizeIssue(i) {
  if (!i) return i
  return {
    ...i,
    id: i.issue_id ?? i.id,
    assigneeId: i.assigned_to ?? i.assigneeId,
    assigneeName: i.assigned_name ?? i.assigneeName,
    status: normalizeStatus(i.status),
    priority: normalizePriority(i.priority),
  }
}

export function normalizeIssues(payload) {
  return normalizeList(payload, ['issues', 'tasks', 'items', 'data'], normalizeIssue)
}

export function normalizeUser(u) {
  if (!u) return u
  return {
    ...u,
    id: u.user_id ?? u.id,
    name: u.full_name ?? u.name,
  }
}

export function normalizeUsers(payload) {
  return normalizeList(payload, ['users', 'items', 'data'], normalizeUser)
}

export function normalizeComment(c) {
  if (!c) return c
  return {
    ...c,
    id: c.comment_id ?? c.id,
    authorName: c.author_name ?? c.authorName,
  }
}

export function normalizeComments(payload) {
  return normalizeList(payload, ['comments', 'items', 'data'], normalizeComment)
}
