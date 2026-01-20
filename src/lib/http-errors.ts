export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly expose: boolean;

  constructor(opts: { statusCode: number; code: string; message: string; expose?: boolean }) {
    super(opts.message);
    this.statusCode = opts.statusCode;
    this.code = opts.code;
    this.expose = opts.expose ?? this.statusCode < 500;
  }
}

export const badRequest = (message: string, code = "BAD_REQUEST") =>
  new HttpError({ statusCode: 400, code, message });

export const unauthorized = (message = "Unauthorized", code = "UNAUTHORIZED") =>
  new HttpError({ statusCode: 401, code, message });

export const forbidden = (message = "Forbidden", code = "FORBIDDEN") =>
  new HttpError({ statusCode: 403, code, message });

export const notFound = (message = "Not found", code = "NOT_FOUND") =>
  new HttpError({ statusCode: 404, code, message });

