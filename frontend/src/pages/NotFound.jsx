import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
      <p className="text-6xl font-bold text-slate-300">404</p>
      <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-center text-slate-600">
        The page you are looking for does not exist or was moved.
      </p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
