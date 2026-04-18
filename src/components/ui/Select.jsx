import React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

const Select = React.forwardRef(({ className, options = [], label, error, placeholder = "Seleccionar...", ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-slate-200 dark:border-slate-700 border-solid bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-white ring-offset-white dark:ring-offset-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          defaultValue=""
          {...props}
        >
          <option value="" disabled hidden>{placeholder}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
})
Select.displayName = "Select"

export { Select }
