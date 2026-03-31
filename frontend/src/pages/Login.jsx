import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { cn } from '../utils/cn'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateFields(email, password) {
  const errors = {}
  const trimmed = email.trim()

  if (!trimmed) {
    errors.email = 'Email is required'
  } else if (!EMAIL_RE.test(trimmed)) {
    errors.email = 'Enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  return errors
}

function buildUserFromResponse(data, fallbackEmail) {
  return data.user && typeof data.user === 'object'
    ? data.user
    : {
        id: String(data.id ?? data.sub ?? 'user'),
        email: data.email ?? fallbackEmail,
        name:
          data.name ??
          (data.email ?? fallbackEmail).split('@')[0] ??
          'User',
      }
}

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

  function handleEmailChange(e) {
    const v = e.target.value
    setEmail(v)
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }))
    }
    if (formError) setFormError('')
  }

  function handlePasswordChange(e) {
    const v = e.target.value
    setPassword(v)
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
    if (formError) setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validateFields(email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      const trimmedEmail = email.trim()
      const data = await authService.login({ email: trimmedEmail, password })
      const newToken = data.token ?? data.accessToken ?? data.access_token
      if (!newToken) {
        setFormError('Invalid response from server: no token received.')
        return
      }
      const userData = buildUserFromResponse(data, trimmedEmail)
      login(newToken, userData)
      navigate(from, { replace: true })
    } catch (err) {
      const message =
        err.apiMessage ??
        err.response?.data?.message ??
        (typeof err.response?.data === 'string' ? err.response.data : null) ??
        err.message ??
        'Unable to sign in. Check your details and try again.'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
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
            Resolve issues faster, keep teams aligned.
          </h2>
          <p className="text-base text-indigo-100/90">
            Centralize tickets, projects, and conversation in one place—built for support and
            engineering teams.
          </p>
        </div>
      </div>

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
              <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-400">
                Sign in with your work email to open the dashboard.
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

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={cn(
                    'w-full rounded-xl border bg-slate-950/50 px-4 py-2.5 text-slate-100 shadow-inner outline-none transition placeholder:text-slate-500 focus:ring-2',
                    fieldErrors.email
                      ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
                      : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/25',
                  )}
                  placeholder="you@company.com"
                />
                {fieldErrors.email ? (
                  <p id="email-error" className="mt-1.5 text-sm text-red-400">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={cn(
                    'w-full rounded-xl border bg-slate-950/50 px-4 py-2.5 text-slate-100 shadow-inner outline-none transition placeholder:text-slate-500 focus:ring-2',
                    fieldErrors.password
                      ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
                      : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/25',
                  )}
                  placeholder="••••••••"
                />
                {fieldErrors.password ? (
                  <p id="password-error" className="mt-1.5 text-sm text-red-400">
                    {fieldErrors.password}
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
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            By continuing you agree to your organization&apos;s access policies.
          </p>
        </div>
      </div>
    </div>
  )
}
