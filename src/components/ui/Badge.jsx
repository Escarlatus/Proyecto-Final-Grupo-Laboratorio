import React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
    outline: "text-slate-950",
    
    // Status specific variants for SASRL
    borrador: "border-transparent bg-slate-200 text-slate-700",
    enviada: "border-transparent bg-blue-100 text-blue-800",
    en_revision: "border-transparent bg-yellow-100 text-yellow-800",
    observada: "border-transparent bg-orange-100 text-orange-800",
    aprobada: "border-transparent bg-green-100 text-green-800",
    rechazada: "border-transparent bg-red-100 text-red-800",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border border-solid px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
