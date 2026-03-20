export class HttpError extends Error {
  override name = 'HttpError';
  public status = 500;
  public statusCode = 'E500';
  public details: any = null;
  constructor(message = 'Something went wrong.') {
    super(message);
  }
  setMessage(message: string) {
    this.message = message;
    return this;
  }
  setStatus(code: number) {
    this.status = code;
    return this;
  }
  setStatusCode(code: string) {
    this.statusCode = code;
    return this;
  }
  setDetails(details: any) {
    this.details = details;
    return this;
  }
}

/**
 * Alias for HttpError
 */
export class HttpServerIssue extends HttpError {
  override name = 'HttpServerIssue';
}

export class HttpUserIssue extends HttpError {
  override name = 'HttpUserIssue';
  public override status = 400;
  public override statusCode = 'E400';
  constructor(message = 'Invalid request.') {
    super(message);
  }
}
