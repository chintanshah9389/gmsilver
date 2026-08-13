export const SECURITY_QUESTIONS = [
  { key: 'MOTHER_MAIDEN_NAME', label: "What is your mother's maiden name?" },
  { key: 'FIRST_PET', label: 'What was the name of your first pet?' },
  { key: 'BIRTH_CITY', label: 'In which city were you born?' },
  { key: 'FAVORITE_TEACHER', label: "What is your favorite teacher's name?" },
  { key: 'FIRST_SCHOOL', label: 'What was the name of your first school?' },
  { key: 'CHILDHOOD_NICKNAME', label: 'What is your childhood nickname?' },
] as const;

export type SecurityQuestionKey = (typeof SECURITY_QUESTIONS)[number]['key'];

export const SECURITY_QUESTION_KEYS: string[] = SECURITY_QUESTIONS.map((q) => q.key);

export function getSecurityQuestionLabel(key: string): string | null {
  return SECURITY_QUESTIONS.find((q) => q.key === key)?.label ?? null;
}

export function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}
