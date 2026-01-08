# react-code-finder

[English](./README.md) | 한국어

React 컴포넌트의 소스 코드 위치를 브라우저에서 확인하고 클립보드에 복사하는 개발 도구.

Claude Code, Cursor, GitHub Copilot 같은 AI 코딩 어시스턴트에 UI 컨텍스트를 빠르게 전달하기 위해 만들었습니다. 마우스 오버 후 클릭하면 컴포넌트 경로가 복사되어 바로 프롬프트에 붙여넣을 수 있습니다.

## Features

- 마우스 오버 시 컴포넌트 이름과 소스 위치 표시
- 클릭 시 소스 위치 클립보드 복사 (예: `src/components/Button.tsx:42:10`)
- React 18, 19 지원
- Vite, Next.js 지원

## Installation

### Vite

```bash
npm install @react-code-finder/vite --save-dev
```

### Next.js

```bash
npm install @react-code-finder/nextjs --save-dev
```

## Usage

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactCodeFinder } from '@react-code-finder/vite'

export default defineConfig({
  plugins: [react(), reactCodeFinder()],
})
```

### Next.js

```javascript
// next.config.js
const { withReactCodeFinder } = require('@react-code-finder/nextjs')

module.exports = withReactCodeFinder()({
  // your next.js config
})
```

또는 ES Module 형식:

```javascript
// next.config.mjs
import { withReactCodeFinder } from '@react-code-finder/nextjs'

export default withReactCodeFinder()({
  // your next.js config
})
```

## Options

```typescript
interface ReactCodeFinderOptions {
  // 활성화 여부 (default: true)
  enabled?: boolean
  // 토글 버튼 위치 (default: 'bottom-right')
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}
```

### Example

```typescript
// Vite
reactCodeFinder({
  enabled: true,
  buttonPosition: 'bottom-left',
})

// Next.js
withReactCodeFinder({
  enabled: true,
  buttonPosition: 'bottom-left',
})({
  // next.js config
})
```

## How It Works

1. 개발 서버 실행 시 화면 우측 하단에 토글 버튼이 표시됩니다.
2. 버튼을 클릭하면 Inspector 모드가 활성화됩니다.
3. 컴포넌트 위에 마우스를 올리면 컴포넌트 이름과 소스 위치가 오버레이로 표시됩니다.
4. 클릭하면 소스 위치가 클립보드에 복사됩니다.

## Limitations

- 개발 모드에서만 동작합니다 (production 빌드에서는 비활성화)
- Next.js Turbopack 미지원 (Webpack만 지원)
- React Server Components는 지원하지 않습니다 (Client Components만 지원)

## License

MIT
