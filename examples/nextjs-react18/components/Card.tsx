import { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
}

export function Card({ title, children }: CardProps) {
  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #eaeaea',
      backgroundColor: '#fafafa',
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>{title}</h3>
      <p style={{ margin: 0, color: '#666' }}>{children}</p>
    </div>
  )
}
