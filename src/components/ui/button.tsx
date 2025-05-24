import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: 
          "text-primary underline-offset-4 hover:underline",

        botaoadicionar: 
          "bg-[#032221] text-[#FFFDF6] hover:bg-[#032221]/90 cursor-pointer",
        botaoeditar:
          "bg-[#032221] text-[#FFFDF6] hover:bg-[#032221]/90 hover:scale-105 transition-all duration-200 cursor-pointer",
        botaoeliminar:
          "border border-[#7D0A0A]/30 text-[#7D0A0A] bg-transparent hover:bg-[#7D0A0A]/10 hover:border-[#7D0A0A] hover:scale-105 transition-all duration-200 cursor-pointer",
        botaocancelar: 
          "border border-[#032221]/30 text-[#032221] hover:bg-[#032221]/5 cursor-pointer",
        botaoguardar:
          "bg-[#032221] text-[#FFFDF6] hover:bg-[#032221]/90 cursor-pointer",


  
        anular:
          "bg-[#FFFDF6] text-[#032221] hover:bg-[#7D0A0A] hover:text-[#FFFDF6] cursor-pointer text-sm font-semibold rounded-lg ease-in-out shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1",
        anularselecionado:
          "bg-[#7D0A0A] text-[#FFFDF6] hover:bg-[#7D0A0A] hover:text-[#FFFDF6] cursor-pointer text-sm font-semibold rounded-lg ease-in-out shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1",
        confirmar: 
          "bg-[#FFFDF6] text-[#032221] hover:bg-[#1B4D3E] hover:text-[#FFFDF6] cursor-pointer text-sm font-semibold rounded-lg ease-in-out shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1",
        confirmarselecionado: 
          "bg-[#1B4D3E] text-[#FFFDF6] hover:bg-[#1B4D3E] hover:text-[#FFFDF6] cursor-pointer text-sm font-semibold rounded-lg ease-in-out shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1",
        dark: 
          "bg-[#FFFDF6] text-[#032221] cursor-pointer text-sm font-semibold rounded-lg ease-in-out shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1",
        darkhover: 
          "bg-[#FFFDF6] text-[#032221] hover:bg-[#032221] hover:text-[#FFFDF6] cursor-pointer text-sm font-semibold rounded-lg ease-in-out shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1",
        darkselecionado:
          "bg-[#032221] text-[#FFFDF6] cursor-pointer text-sm font-semibold rounded-lg ease-in-out shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1",

      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
