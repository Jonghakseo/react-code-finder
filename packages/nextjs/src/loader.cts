function transformJsxDevRuntime(code: string): string | undefined {
  if (code.includes('_source')) return

  const defineIndex = code.indexOf('"_debugInfo"')
  if (defineIndex === -1) return

  // Try both minified (value:null) and non-minified (value: null) patterns
  let valueIndex = code.indexOf('value:null', defineIndex)
  let valueLength = 10 // 'value:null'.length

  if (valueIndex === -1) {
    valueIndex = code.indexOf('value: null', defineIndex)
    valueLength = 11 // 'value: null'.length
  }

  if (valueIndex === -1) return

  let newCode =
    code.slice(0, valueIndex) + 'value:source' + code.slice(valueIndex + valueLength)

  if (code.includes('function ReactElement(type, key, self, source,')) {
    return newCode
  }

  // Non-minified pattern
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

  // Minified pattern for Next.js bundled React (app-page.runtime.dev.js)
  // Pattern: function jsxDEVImpl(type,config,maybeKey,isStaticChildren,debugStack,debugTask)
  newCode = newCode.replaceAll(
    /function jsxDEVImpl\(type,config,maybeKey,isStaticChildren,debugStack,debugTask\)/gu,
    'function jsxDEVImpl(type,config,maybeKey,isStaticChildren,debugStack,debugTask,source)'
  )

  // Pattern: jsxDEVImpl(type,config,maybeKey,isStaticChildren,debugStack,debugTask)
  // Need to pass source through the call chain
  newCode = newCode.replaceAll(
    /jsxDEVImpl\(type,config,maybeKey,isStaticChildren,debugStack,debugTask\)/gu,
    'jsxDEVImpl(type,config,maybeKey,isStaticChildren,debugStack,debugTask,source)'
  )

  // Pattern: jsxDEV=function(type,config,maybeKey,isStaticChildren)
  // This is the entry point that needs source parameter
  newCode = newCode.replaceAll(
    /jsxDEV=function\(type,config,maybeKey,isStaticChildren\)/gu,
    'jsxDEV=function(type,config,maybeKey,isStaticChildren,source)'
  )

  return newCode
}

module.exports = function (this: { cacheable?: () => void }, source: string) {
  this.cacheable?.()
  return transformJsxDevRuntime(source) ?? source
}
