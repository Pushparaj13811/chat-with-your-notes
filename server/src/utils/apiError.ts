class ApiError extends Error {
  public statusCode: number;
  public data: any;
  public success: boolean;
  public errors: any[];

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = [],
    stack: string = "",
    data: any = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };