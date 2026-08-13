export function toAuthIdentifier(value: string) {
  const identifier = value.trim();
  return { identifier, email: identifier };
}
