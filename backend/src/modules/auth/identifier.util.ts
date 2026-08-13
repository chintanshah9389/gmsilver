export function isEmailIdentifier(value: string): boolean {
  return value.includes('@');
}

export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

export function getIdentifier(dto: { email?: string; identifier?: string }): string {
  return (dto.identifier || dto.email || '').trim();
}
