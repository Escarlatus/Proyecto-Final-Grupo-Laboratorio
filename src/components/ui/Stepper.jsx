import React from "react"
import { cn } from "../../lib/utils"
import { Check } from "lucide-react"

const Stepper = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -mt-px h-0.5 w-full bg-slate-200 -z-10"></div>
        
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={step.title} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors bg-white",
                  isCompleted ? "border-primary bg-primary text-white" : 
                  isCurrent ? "border-primary text-primary" : "border-slate-300 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className="mt-2 hidden sm:block text-center">
                <div className={cn("text-xs font-medium", 
                  isCurrent || isCompleted ? "text-slate-900" : "text-slate-500"
                )}>
                  {step.title}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { Stepper }
