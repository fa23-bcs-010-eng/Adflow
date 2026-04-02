export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: unknown;
      response?: {
        data?: {
          error?: unknown;
          message?: unknown;
        };
        status?: number;
      };
    };

    const responseError = maybeError.response?.data?.error;
    if (typeof responseError === 'string' && responseError.trim()) return responseError;

    const responseMessage = maybeError.response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;

    if (typeof maybeError.message === 'string' && maybeError.message.trim()) return maybeError.message;

    if (responseError && typeof responseError === 'object') {
      const nestedMessage = (responseError as { message?: unknown }).message;
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
    }
  }

  return fallback;
}
