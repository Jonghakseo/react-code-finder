export interface SourceSnippet {
  file: string
  startLine: number
  endLine: number
  content: string
}

export async function fetchSourceCode(
  fileName: string,
  lineNumber: number,
  contextLines: number = 15
): Promise<SourceSnippet | null> {
  const baseUrl = getSourceEndpoint()

  try {
    const params = new URLSearchParams({
      file: fileName,
      line: String(lineNumber),
      context: String(contextLines),
    })
    const response = await fetch(`${baseUrl}?${params}`)
    if (!response.ok) return null
    return (await response.json()) as SourceSnippet
  } catch {
    return null
  }
}

function getSourceEndpoint(): string {
  if (
    typeof window !== 'undefined' &&
    (window as Window & { __RCF_SOURCE_ENDPOINT__?: string }).__RCF_SOURCE_ENDPOINT__
  ) {
    return (window as Window & { __RCF_SOURCE_ENDPOINT__?: string }).__RCF_SOURCE_ENDPOINT__!
  }
  return '/__rcf/source'
}
