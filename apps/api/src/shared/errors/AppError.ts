export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Ruxsat berilmagan") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Taqiqlangan amal") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Topilmadi") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Ziddiyat mavjud") {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Noto'g'ri ma'lumot") {
    super(message, 422);
  }
}
