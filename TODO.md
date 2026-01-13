# TODO - DX 개선 사항

## 🔴 높은 우선순위

### 1. 에러 핸들링 및 피드백 개선
- [x] DevTools 훅 인터셉션 실패 시 사용자 피드백 추가
- [x] 소스 위치를 찾지 못한 컴포넌트에 대한 안내 메시지 (`showNoSource` 옵션)
- [x] 설정 옵션 유효성 검사 (잘못된 `buttonPosition` 등)

### 2. 프로그래매틱 API
- [x] 전역 API 노출 (`window.__REACT_CODE_FINDER__`)
  ```typescript
  window.__REACT_CODE_FINDER__.enable()
  window.__REACT_CODE_FINDER__.disable()
  window.__REACT_CODE_FINDER__.toggle()
  window.__REACT_CODE_FINDER__.isEnabled
  ```

### 3. 키보드 단축키
- [ ] 토글 단축키 지원 (기본값: `Ctrl+Shift+I` 또는 `Cmd+Shift+I`)
- [ ] `shortcut` 옵션으로 커스텀 단축키 설정
- [ ] 단축키 비활성화 옵션

## 🟡 중간 우선순위

### 4. 커스터마이징 옵션 확장
- [ ] `overlayColor` - 오버레이 배경색
- [ ] `toastDuration` - 토스트 표시 시간
- [ ] `toastPosition` - 토스트 위치 (버튼 위치와 연동 또는 별도 설정)
- [ ] `buttonStyle` - 버튼 커스텀 스타일

### 5. 패키지별 README
- [x] `packages/core/README.md`
- [x] `packages/vite/README.md`
- [x] `packages/nextjs/README.md`

### 6. API 레퍼런스 문서
- [ ] 내보내는 타입 상세 문서 (`SourceLocation`, `Fiber`, `ReactCodeFinderOptions`)
- [ ] 트러블슈팅 가이드
- [ ] 자주 묻는 질문(FAQ)

## 🟢 낮은 우선순위

### 7. 버전 관리
- [ ] `CHANGELOG.md` 작성
- [ ] 마이그레이션 가이드

### 8. 개발자 도구 통합
- [x] `debug: true` 옵션으로 상세 로깅
- [x] 브라우저 콘솔에서 상태 확인 API (`window.__REACT_CODE_FINDER__`)

### 9. 번들 최적화
- [ ] 클라이언트 번들 인라인 대신 별도 청크로 분리 검토
- [ ] 번들 크기 측정 및 최적화

### 10. RSC 지원 개선
- [ ] RSC 환경에서의 제한 사항 상세 문서화
- [ ] 가능하다면 RSC에서도 라인 번호 지원 방안 조사

## 💡 추가 고려 사항

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `shortcut` | `string \| false` | `'ctrl+shift+i'` | 토글 단축키 |
| `overlayColor` | `string` | `'rgba(0, 136, 255, 0.1)'` | 오버레이 배경색 |
| `toastDuration` | `number` | `2000` | 토스트 표시 시간(ms) |
| `toastPosition` | `string` | `'bottom-right'` | 토스트 위치 |
| `debug` | `boolean` | `false` | 디버그 로깅 활성화 (구현 완료 ✅) |
| `showNoSource` | `boolean` | `false` | 소스 없는 컴포넌트 오버레이 표시 (구현 완료 ✅) |
