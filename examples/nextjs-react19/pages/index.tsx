import { Card } from '../components/Card'
import { Button } from '../components/Button'

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Next.js 15 + React 19 Example
      </h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Click the toggle button in the bottom-right corner to enable the inspector.
        Then click on any component to copy its source location.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Card title="Card 1" description="This is the first card component." />
        <Card title="Card 2" description="This is the second card component." />
        <Card title="Card 3" description="This is the third card component." />
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="outline">Outline Button</Button>
      </div>
    </main>
  )
}
