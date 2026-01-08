import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Next.js + react-code-finder Example</h1>
      <p>Click the toggle button in the corner to activate code finder mode.</p>
      <p>Then hover over components to see their names and click to copy source location.</p>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={() => alert('Clicked!')}>Click Me</Button>
        <Button variant="secondary">Secondary Button</Button>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <Card title="Card 1">
          This is the first card component.
        </Card>
        <Card title="Card 2">
          This is the second card component.
        </Card>
      </div>
    </main>
  )
}
