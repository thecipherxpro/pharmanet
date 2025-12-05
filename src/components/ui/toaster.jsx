import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const variantStyles = {
  default: "border-gray-200 bg-white text-gray-900",
  destructive: "border-red-200 bg-red-50 text-red-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
}

const iconMap = {
  success: <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />,
  destructive: <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />,
  info: <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-3 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col sm:p-4 md:max-w-[380px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-xl border p-3 pr-8 shadow-lg mb-2",
              variantStyles[toast.variant || "default"]
            )}
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {iconMap[toast.variant]}
              <div className="grid gap-0.5 flex-1 min-w-0">
                {toast.title && (
                  <div className="text-sm font-semibold leading-tight">
                    {toast.title}
                  </div>
                )}
                {toast.description && (
                  <div className="text-xs opacity-90 leading-tight">
                    {toast.description}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => dismiss(toast.id)}
              className={cn(
                "absolute right-1.5 top-1.5 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none",
                toast.variant === "destructive" ? "text-red-600 hover:text-red-700" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}