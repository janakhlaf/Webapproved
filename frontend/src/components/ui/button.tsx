import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-none active:scale-[0.97] hover:-translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#020306] shadow-[0_0_20px_rgba(0,240,255,0.22)] hover:shadow-[0_0_35px_rgba(0,240,255,0.45)] border border-cyan-400/40 font-bold",
        destructive:
          "bg-red-950/20 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]",
        outline:
          "border border-cyan-500/25 bg-transparent hover:bg-cyan-500/8 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.18)] text-cyan-300",
        secondary:
          "bg-[#080c14]/65 backdrop-blur-xl text-foreground border border-cyan-500/10 hover:border-cyan-400/45 hover:bg-cyan-500/8 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]",
        ghost: "hover:bg-cyan-500/8 hover:text-cyan-300 text-muted-foreground",
        link: "text-cyan-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5 rounded-lg",
        sm: "h-9 rounded-md px-3.5 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10 rounded-full border border-white/5 bg-[#080c14]/50 backdrop-blur-md hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:scale-105 transition-all duration-300",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
