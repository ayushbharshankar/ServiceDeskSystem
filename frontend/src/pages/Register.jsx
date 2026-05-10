import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { cn } from '../utils/cn'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateFields(fullName, email, password, confirmPassword) {
  const errors = {}

  if (!fullName.trim()) {
    errors.fullName = 'Full name is required'
  } else if (fullName.trim().length < 2) {
    errors.fullName = 'Name must be at least 2 characters'
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
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export default function Register() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  function clearFieldError(field) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (formError) setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validateFields(fullName, email, password, confirmPassword)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      const data = await authService.register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      })

      const newToken = data.token ?? data.accessToken ?? data.access_token
      if (!newToken) {
        setFormError('Registration succeeded but no token received. Please sign in.')
        return
      }

      const userData =
        data.user && typeof data.user === 'object'
          ? data.user
          : {
              id: String(data.id ?? 'user'),
              email: email.trim(),
              name: fullName.trim(),
            }

      login(newToken, userData)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message =
        err.apiMessage ??
        err.response?.data?.message ??
        (typeof err.response?.data === 'string' ? err.response.data : null) ??
        err.message ??
        'Unable to create account. Please try again.'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (hasError) =>
    cn(
      'w-full rounded-xl border bg-slate-950/50 px-4 py-2.5 text-slate-100 shadow-inner outline-none transition placeholder:text-slate-500 focus:ring-2',
      hasError
        ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
        : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/25',
    )

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left hero panel */}
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
            Start collaborating with your team today.
          </h2>
          <p className="text-base text-indigo-100/90">
            Create projects, track issues, and keep everyone aligned—all from a single dashboard.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-1 flex-col justify-center px-4 py-12 sm:px-8 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                SD
              </span>
              Service Desk
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-sm ring-1 ring-white/5">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Create an account</h1>
              <p className="mt-2 text-sm text-slate-400">
                Fill in your details to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {formError ? (
                <div
                  className="rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              {/* Full Name */}
              <div>
                <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Full name
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    clearFieldError('fullName')
                  }}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'fullname-error' : undefined}
                  className={inputClass(fieldErrors.fullName)}
                  placeholder="Jane Doe"
                />
                {fieldErrors.fullName ? (
                  <p id="fullname-error" className="mt-1.5 text-sm text-red-400">
                    {fieldErrors.fullName}
                  </p>
                ) : null}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearFieldError('email')
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={inputClass(fieldErrors.email)}
                  placeholder="you@company.com"
                />
                {fieldErrors.email ? (
                  <p id="email-error" className="mt-1.5 text-sm text-red-400">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldError('password')
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={inputClass(fieldErrors.password)}
                  placeholder="••••••••"
                />
                {fieldErrors.password ? (
                  <p id="password-error" className="mt-1.5 text-sm text-red-400">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    clearFieldError('confirmPassword')
                  }}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
                  className={inputClass(fieldErrors.confirmPassword)}
                  placeholder="••••••••"
                />
                {fieldErrors.confirmPassword ? (
                  <p id="confirm-error" className="mt-1.5 text-sm text-red-400">
                    {fieldErrors.confirmPassword}
                  </p>
                ) : null}
              </div>

              <button
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

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            By creating an account you agree to your organization&apos;s access policies.
          </p>
        </div>
      </div>
    </div>
  )
}
