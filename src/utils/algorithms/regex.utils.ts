export function regexMatcher(pattern: string) {
  const regex = new RegExp(pattern)
  return (text: string) => regex.test(text)
}

export const escape = (pattern: string) => String(pattern).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
