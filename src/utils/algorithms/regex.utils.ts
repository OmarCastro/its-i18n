export const escape = (pattern: string) => String(pattern).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
