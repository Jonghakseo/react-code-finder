import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from './components/Button'
import { Card } from './components/Card'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + react-code-finder</h1>
      <p>Click the toggle button in the corner to activate code finder mode.</p>
      <p>Then hover over components to see their names and click to copy source location.</p>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button onClick={() => alert('Clicked!')}>Click Me</Button>
        <Button variant="secondary">Secondary Button</Button>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '2rem auto' }}>
        <Card title="Card 1">
          This is the first card component.
        </Card>
        <Card title="Card 2">
          This is the second card component.
        </Card>
      </div>
    </>
  )
}

export default App
