export class ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  constructor(
    success: boolean,
    data?: T,
    errorCode?: string,
    errorMessage?: string,
    errorDetails?: any
  ) {
    this.success = success;
    
    if (success && data !== undefined) {
      this.data = data;
    }
    
    if (!success) {
      this.error = {
        code: errorCode || 'INTERNAL_ERROR',
        message: errorMessage || 'An unexpected error occurred',
        ...(errorDetails && { details: errorDetails })
      };
    }
  }

  static success<T>(data: T) {
    return new ApiResponse<T>(true, data);
  }

  static error(code: string, message: string, details?: any) {
    return new ApiResponse<null>(false, undefined, code, message, details);
  }
}
