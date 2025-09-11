import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessError extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends BusinessError {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenError extends BusinessError {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class SlotUnavailableError extends ConflictError {
  constructor(slotStart: string) {
    super(`Slot at ${slotStart} is no longer available`);
  }
}

export class HoldExpiredError extends ConflictError {
  constructor() {
    super('Booking hold has expired');
  }
}

export class InvalidTransitionError extends BusinessError {
  constructor(from: string, to: string) {
    super(`Invalid state transition from ${from} to ${to}`);
  }
}

export class ServiceAreaError extends BusinessError {
  constructor(message: string) {
    super(`Service area validation failed: ${message}`);
  }
}

export class PaymentError extends BusinessError {
  constructor(message: string) {
    super(`Payment error: ${message}`);
  }
}

export class LineError extends BusinessError {
  constructor(message: string) {
    super(`LINE integration error: ${message}`);
  }
}