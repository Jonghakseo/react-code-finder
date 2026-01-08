import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#646cff',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#1a1a1a',
      color: 'white',
    },
  }

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyles, ...variantStyles[variant] }}
    >
      {children}
    </button>
  )
}
