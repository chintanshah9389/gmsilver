export function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const anyError = error as {
      data?: unknown;
      error?: unknown;
      message?: unknown;
      response?: { data?: { message?: unknown; error?: unknown } };
    };

    const responseData = anyError.response?.data;
    const message =
      (typeof responseData === 'object' && responseData !== null
        ? responseData.message ?? responseData.error
        : undefined) ?? anyError.data ?? anyError.error ?? anyError.message;

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