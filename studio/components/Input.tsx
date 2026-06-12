import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-white/5 px-4 py-2 text-sm',
          'text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-white/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 transition-all',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-zinc-200 dark:border-white/30',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }

