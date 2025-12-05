import * as React from "react"

// Global toast function reference
let toastFunction = null

export function setToastFunction(fn) {
  toastFunction = fn
}

// Standalone toast function that can be called from anywhere
export function toast({ title, description, variant = "default" }) {
  if (toastFunction) {
    return toastFunction({ title, description, variant })
  }
  console.warn("Toast function not initialized. Make sure <Toaster /> is mounted in your app.")
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState([])

  const addToast = React.useCallback(({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { id, title, description, variant, open: true }
    
    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after 2 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2000)

    return {
      id,
      dismiss: () => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }
    }
  }, [])

  // Register global toast function
  React.useEffect(() => {
    setToastFunction(addToast)
    return () => setToastFunction(null)
  }, [addToast])

  const dismiss = React.useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }, [])

  return {
    toast: addToast,
    toasts,
    dismiss,
  }
}