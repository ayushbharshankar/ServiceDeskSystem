import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { cn } from '../utils/cn'
import { getErrorMessage } from '../utils/errorMessage'

// ── Constants ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLES = [
  { value: 'Developer', label: 'Developer' },
  { value: 'Support', label: 'Support Agent' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Admin', label: 'Admin' },
]

// ── Validation ────────────────────────────────────────────────────────────────

function validateFields({ full_name, email, password, confirmPassword, role }) {
  const errors = {}

  if (!full_name.trim()) {
    errors.full_name = 'Full name is required'
  } else if (full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters'
  }

  const trimmedEmail = email.trim()
  if (!trimmedEmail) {
    errors.email = 'Email is required'
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  if (!role) {
    errors.role = 'Please select a role'
  }

  return errors
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUserFromResponse(data, fallbackEmail) {
  return data.user && typeof data.user === 'object'
    ? data.user
    : {
        id: String(data.id ?? data.sub ?? 'user'),
        email: data.email ?? fallbackEmail,
        name:
          data.name ??
          data.full_name ??
          (data.email ?? fallbackEmail).split('@')[0] ??
          'User',
      }
}

// ── Eye Icon SVGs ─────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

// ── Field Error ───────────────────────────────────────────────────────────────

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-sm text-red-400">
      {message}
    </p>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Register() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [full_name, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('Developer')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Redirect if already authenticated ──────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // ── Change handlers (clears the relevant field error on change) ─────────────
  function makeChangeHandler(setter, field) {
    return (e) => {
      setter(e.target.value)
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
      }
      if (formError) setFormError('')
    }
  }

  // Confirm password also re-validates against password when password changes
  function handlePasswordChange(e) {
    const v = e.target.value
    setPassword(v)
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
    // If confirm is already filled and now matches, clear its error
    if (confirmPassword && fieldErrors.confirmPassword && v === confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
    if (formError) setFormError('')
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validateFields({ full_name, email, password, confirmPassword, role })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      const payload = {
        full_name: full_name.trim(),
        email: email.trim(),
        password,
        role,
      }
      const data = await authService.register(payload)

      const newToken = data.token ?? data.accessToken ?? data.access_token
      if (!newToken) {
        setFormError('Invalid response from server: no token received.')
        return
      }

      const userData = buildUserFromResponse(data, payload.email)
      login(newToken, userData)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to create account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Input class helper ──────────────────────────────────────────────────────
  function inputCls(hasError) {
    return cn(
      'w-full rounded-xl border bg-slate-950/50 px-4 py-2.5 text-slate-100 shadow-inner outline-none transition placeholder:text-slate-500 focus:ring-2',
      hasError
        ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
        : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/25',
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* ── Left decorative panel (lg+) ─────────────────────────────────────── */}
      <div className="relative hidden w-0 flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 px-10 py-12 text-white lg:flex lg:w-1/2 lg:max-w-none">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12) 0%, transparent 40%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold backdrop-blur">
              SD
            </span>
            Service Desk
          </div>
        </div>
        <div className="relative z-10 mt-auto max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Join your team on Service Desk.
          </h2>
          <p className="text-base text-indigo-100/90">
            Create your account and start collaborating on tickets, projects, and conversations—all
            in one place.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────────── */}
      <div className="flex w-full flex-1 flex-col justify-center px-4 py-12 sm:px-8 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                SD
              </span>
              Service Desk
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-sm ring-1 ring-white/5">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Create account</h1>
              <p className="mt-2 text-sm text-slate-400">
                Fill in your details to get started with Service Desk.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Form-level error banner */}
              {formError ? (
                <div
                  className="rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200"
                  role="alert"
                  aria-live="assertive"
                >
                  {formError}
                </div>
              ) : null}

              {/* ── Full Name ─────────────────────────────────────────────────── */}
              <div>
                <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  value={full_name}
                  onChange={makeChangeHandler(setFullName, 'full_name')}
                  aria-invalid={Boolean(fieldErrors.full_name)}
                  aria-describedby={fieldErrors.full_name ? 'full_name-error' : undefined}
                  className={inputCls(Boolean(fieldErrors.full_name))}
                  placeholder="Jane Smith"
                />
                <FieldError id="full_name-error" message={fieldErrors.full_name} />
              </div>

              {/* ── Email ─────────────────────────────────────────────────────── */}
              <div>
                <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Work Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={makeChangeHandler(setEmail, 'email')}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
                  className={inputCls(Boolean(fieldErrors.email))}
                  placeholder="you@company.com"
                />
                <FieldError id="reg-email-error" message={fieldErrors.email} />
              </div>

              {/* ── Password ──────────────────────────────────────────────────── */}
              <div>
                <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={handlePasswordChange}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'reg-password-error' : undefined}
                    className={cn(inputCls(Boolean(fieldErrors.password)), 'pr-10')}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:text-slate-200"
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <FieldError id="reg-password-error" message={fieldErrors.password} />
              </div>

              {/* ── Confirm Password ───────────────────────────────────────────── */}
              <div>
                <label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={makeChangeHandler(setConfirmPassword, 'confirmPassword')}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'reg-confirm-error' : undefined}
                    className={cn(inputCls(Boolean(fieldErrors.confirmPassword)), 'pr-10')}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:text-slate-200"
                    tabIndex={0}
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <FieldError id="reg-confirm-error" message={fieldErrors.confirmPassword} />
              </div>

              {/* ── Role ──────────────────────────────────────────────────────── */}
              <div>
                <label htmlFor="reg-role" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Role
                </label>
                <select
                  id="reg-role"
                  name="role"
                  value={role}
                  onChange={makeChangeHandler(setRole, 'role')}
                  aria-invalid={Boolean(fieldErrors.role)}
                  aria-describedby={fieldErrors.role ? 'reg-role-error' : undefined}
                  className={cn(
                    inputCls(Boolean(fieldErrors.role)),
                    'cursor-pointer appearance-none',
                  )}
                >
                  {ROLES.map(({ value, label }) => (
                    <option key={value} value={value} className="bg-slate-900 text-slate-100">
                      {label}
                    </option>
                  ))}
                </select>
                <FieldError id="reg-role-error" message={fieldErrors.role} />
              </div>

              {/* ── Submit ────────────────────────────────────────────────────── */}
              <button
                id="register-submit"
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-55"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          {/* ── Sign-in link ───────────────────────────────────────────────── */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-400 transition hover:text-indigo-300 focus:outline-none focus-visible:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-500">
            By continuing you agree to your organization&apos;s access policies.
          </p>
        </div>
      </div>
    </div>
  )
}
