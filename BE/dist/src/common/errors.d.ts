import { HttpException, HttpStatus } from '@nestjs/common';
export declare class BusinessError extends HttpException {
    constructor(message: string, statusCode?: HttpStatus);
}
export declare class ValidationError extends BusinessError {
    constructor(message: string);
}
export declare class NotFoundError extends BusinessError {
    constructor(resource: string, id?: string);
}
export declare class ConflictError extends BusinessError {
    constructor(message: string);
}
export declare class UnauthorizedError extends BusinessError {
    constructor(message?: string);
}
export declare class ForbiddenError extends BusinessError {
    constructor(message?: string);
}
export declare class SlotUnavailableError extends ConflictError {
    constructor(slotStart: string);
}
export declare class HoldExpiredError extends ConflictError {
    constructor();
}
export declare class InvalidTransitionError extends BusinessError {
    constructor(from: string, to: string);
}
export declare class ServiceAreaError extends BusinessError {
    constructor(message: string);
}
export declare class PaymentError extends BusinessError {
    constructor(message: string);
}
export declare class LineError extends BusinessError {
    constructor(message: string);
}
