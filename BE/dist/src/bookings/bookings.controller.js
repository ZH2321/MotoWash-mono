"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const auth_guard_1 = require("../common/auth.guard");
const bookings_service_1 = require("./bookings.service");
class CoordinateDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lng", void 0);
class CreateHoldDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateHoldDto.prototype, "services", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CoordinateDto),
    __metadata("design:type", CoordinateDto)
], CreateHoldDto.prototype, "pickup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CoordinateDto),
    __metadata("design:type", CoordinateDto)
], CreateHoldDto.prototype, "dropoff", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateHoldDto.prototype, "samePoint", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateHoldDto.prototype, "slotStart", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateHoldDto.prototype, "priceEstimate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHoldDto.prototype, "notes", void 0);
let BookingsController = class BookingsController {
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async createHold(req, dto) {
        const user = req.user;
        return this.bookingsService.createHold(user.id, dto);
    }
    async uploadPaymentSlip(req, bookingId, file) {
        const user = req.user;
        return this.bookingsService.uploadPaymentSlip(user.id, bookingId, file);
    }
    async cancelHold(req, bookingId) {
        const user = req.user;
        return this.bookingsService.cancelHold(user.id, bookingId);
    }
    async getBooking(req, bookingId) {
        const user = req.user;
        return this.bookingsService.getBooking(bookingId, user);
    }
    async getMyBookings(req) {
        const user = req.user;
        return this.bookingsService.getUserBookings(user.id);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)('hold'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['customer']),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateHoldDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "createHold", null);
__decorate([
    (0, common_1.Post)(':id/payment-slip'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['customer']),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('slip')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "uploadPaymentSlip", null);
__decorate([
    (0, common_1.Post)(':id/cancel-hold'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['customer']),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancelHold", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Get)('user/my-bookings'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['customer']),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getMyBookings", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map