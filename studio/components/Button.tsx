import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium text-sm text-foreground transition truncate',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
          'dark:focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-500 hover:bg-blue-600 text-white shadow-sm': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border': variant === 'secondary',
            'border border-border text-foreground hover:bg-accent': variant === 'outline',
            'text-muted-foreground hover:bg-accent hover:text-foreground': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600': variant === 'destructive',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-8 px-3.5 text-xs': size === 'md',
            'h-9 px-4 text-sm': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
