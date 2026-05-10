import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

let toastIdCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
  }, [])

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = ++toastIdCounter
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }])
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => removeToast(id), duration)
      }
      return id
    },
    [removeToast],
  )

  const toast = useMemo(
    () => ({
      success: (title, message) => addToast({ type: 'success', title, message }),
      error: (title, message) => addToast({ type: 'error', title, message, duration: 6000 }),
      info: (title, message) => addToast({ type: 'info', title, message }),
      warning: (title, message) => addToast({ type: 'warning', title, message }),
    }),
    [addToast],
  )

  const value = useMemo(() => ({ toast, toasts, removeToast }), [toast, toasts, removeToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}

export function useToastState() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastState must be used within ToastProvider')
  return { toasts: ctx.toasts, removeToast: ctx.removeToast }
}
