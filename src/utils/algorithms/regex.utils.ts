export function lazyRegexMatcher(pattern: string) {
  let regex: RegExp

  return (text: string) => {
    regex ??= new RegExp(pattern)
    return regex.test(text)
  }
}
