import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  onClick?: () => void
}

const styles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
  },
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        ...styles[variant],
      }}
    >
      {children}
    </button>
  )
}
