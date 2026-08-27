export function getErrorMessage(error: unknown, fallback: string) {
  const collected: string[] = [];

  const push = (value: unknown) => {
    if (!value) return;
    if (typeof value === 'string' && value.trim()) {
      collected.push(value.trim());
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === 'object') {
      const obj = value as {
        data?: unknown;
        error?: unknown;
        message?: unknown;
        response?: { data?: unknown };
      };
      if (obj.message) push(obj.message);
      if (obj.response?.data) push(obj.response.data);
      else if (obj.data && obj.data !== value) push(obj.data);
      else if (!obj.message && typeof obj.error === 'string') push(obj.error);
    }
  };

  push(error);

  if (error instanceof Error && error.message.trim()) {
    collected.push(error.message.trim());
  }

  const unique = [...new Set(collected)].filter((msg) =>
    msg !== 'true' &&
    msg !== 'false' &&
    !/^\d{3}$/.test(msg) &&
    !['Conflict', 'Bad Request', 'Not Found', 'Internal Server Error'].includes(msg)
  );

  const first = unique[0];
  if (!first) return fallback;
  if (first === 'Unauthorized' || /unauthorized/i.test(first)) {
    return 'Session expired. Please sign in again.';
  }
  if (first === 'Forbidden') {
    return 'You do not have permission to do that.';
  }
  return first;
}

