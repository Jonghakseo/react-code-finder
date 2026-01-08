interface CardProps {
  title: string
  description: string
}

export function Card({ title, description }: CardProps) {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '240px',
      }}
    >
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{description}</p>
    </div>
  )
}
