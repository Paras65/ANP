/**
 * Ambition News Portal - Centralized Application Errors
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'अमान्य अनुरोध डेटा (Invalid Request)', errorCode: string = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'अनधिकृत: प्रमाणीकरण आवश्यक है (Unauthorized)', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'प्रतिबंधित: इस कार्य की अनुमति नहीं है (Forbidden)', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'अनुरोधित संसाधन नहीं मिला (Not Found)', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'डेटा टकराव: यह रिकॉर्ड पहले से मौजूद है (Conflict)', errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'अनुरोध दर सीमा समाप्त (Too Many Requests)', errorCode: string = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, errorCode);
  }
}
