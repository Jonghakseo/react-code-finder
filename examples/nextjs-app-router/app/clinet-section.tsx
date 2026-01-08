"use client"

import {Button} from "@/components/Button";

export default function ClientSection() {
  return <div style={{marginTop: '2rem', display: 'flex', gap: '0.5rem'}}>
    <p>test</p>
    <Button variant="primary" onClick={console.log}>Primary Button</Button>
    <Button variant="secondary">Secondary Button</Button>
    <Button variant="outline">Outline Button</Button>
  </div>
}
