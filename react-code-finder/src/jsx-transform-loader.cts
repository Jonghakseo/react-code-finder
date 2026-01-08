function transformJsxDevRuntime(code: string): string | undefined {
  // React <19 uses _source - no transformation needed
  if (code.includes('_source')) return

  // React 19: Patch _debugInfo from null to source
  const defineIndex = code.indexOf('"_debugInfo"')
  if (defineIndex === -1) return

  const valueIndex = code.indexOf('value: null', defineIndex)
  if (valueIndex === -1) return

  let newCode =
    code.slice(0, valueIndex) + 'value: source' + code.slice(valueIndex + 11)

  // React 19.0: source is already in ReactElement signature
  if (code.includes('function ReactElement(type, key, self, source,')) {
    return newCode
  }

  // React 19.2+: source parameter not passed through chain
  newCode = newCode.replaceAll(
    /maybeKey,\s*isStaticChildren/gu,
    'maybeKey, isStaticChildren, source'
  )

  newCode = newCode.replaceAll(
    /(\w+)?,\s*debugStack,\s*debugTask/gu,
    (match, previousArg) => {
      if (previousArg === 'source') return match
      return match.replace('debugTask', 'debugTask, source')
    }
  )

  return newCode
}

module.exports = function (this: { cacheable?: () => void }, source: string) {
  this.cacheable?.()
  return transformJsxDevRuntime(source) ?? source
}
