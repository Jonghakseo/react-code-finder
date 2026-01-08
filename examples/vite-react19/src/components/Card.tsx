import type { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
}

export function Card({ title, children }: CardProps) {
  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>{title}</h3>
      <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>{children}</p>
    </div>
  )
}
