import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const base = 'min-h-[48px] rounded-xl text-[16px] font-medium px-6 transition-opacity active:opacity-80 disabled:opacity-40'

  const variants = {
    primary: 'bg-[#C8956C] text-white',
    secondary: 'bg-[#F4DDD0] text-[#8B5E3C]',
    ghost: 'bg-transparent text-[#7A6A5C] underline',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}
