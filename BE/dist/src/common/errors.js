"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineError = exports.PaymentError = exports.ServiceAreaError = exports.InvalidTransitionError = exports.HoldExpiredError = exports.SlotUnavailableError = exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.BusinessError = void 0;
const common_1 = require("@nestjs/common");
class BusinessError extends common_1.HttpException {
    constructor(message, statusCode = common_1.HttpStatus.BAD_REQUEST) {
        super(message, statusCode);
    }
}
exports.BusinessError = BusinessError;
class ValidationError extends BusinessError {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends BusinessError {
    constructor(resource, id) {
        const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
        super(message, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends BusinessError {
    constructor(message) {
        super(message, common_1.HttpStatus.CONFLICT);
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends BusinessError {
    constructor(message = 'Unauthorized') {
        super(message, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends BusinessError {
    constructor(message = 'Forbidden') {
        super(message, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.ForbiddenError = ForbiddenError;
class SlotUnavailableError extends ConflictError {
    constructor(slotStart) {
        super(`Slot at ${slotStart} is no longer available`);
    }
}
exports.SlotUnavailableError = SlotUnavailableError;
class HoldExpiredError extends ConflictError {
    constructor() {
        super('Booking hold has expired');
    }
}
exports.HoldExpiredError = HoldExpiredError;
class InvalidTransitionError extends BusinessError {
    constructor(from, to) {
        super(`Invalid state transition from ${from} to ${to}`);
    }
}
exports.InvalidTransitionError = InvalidTransitionError;
class ServiceAreaError extends BusinessError {
    constructor(message) {
        super(`Service area validation failed: ${message}`);
    }
}
exports.ServiceAreaError = ServiceAreaError;
class PaymentError extends BusinessError {
    constructor(message) {
        super(`Payment error: ${message}`);
    }
}
exports.PaymentError = PaymentError;
class LineError extends BusinessError {
    constructor(message) {
        super(`LINE integration error: ${message}`);
    }
}
exports.LineError = LineError;
//# sourceMappingURL=errors.js.map