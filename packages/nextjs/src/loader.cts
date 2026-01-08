function transformJsxDevRuntime(code: string): string | undefined {
  if (code.includes('_source')) return

  const defineIndex = code.indexOf('"_debugInfo"')
  if (defineIndex === -1) return

  const valueIndex = code.indexOf('value: null', defineIndex)
  if (valueIndex === -1) return

  let newCode =
    code.slice(0, valueIndex) + 'value: source' + code.slice(valueIndex + 11)

  if (code.includes('function ReactElement(type, key, self, source,')) {
    return newCode
  }

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
