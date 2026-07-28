import axios from 'axios';

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    const message = data?.message ?? data?.error ?? error.message;

    if (Array.isArray(message)) {
      return message.filter(Boolean).join(', ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}