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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const auth_guard_1 = require("../common/auth.guard");
const admin_service_1 = require("./admin.service");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["HOLD_PENDING_PAYMENT"] = "HOLD_PENDING_PAYMENT";
    BookingStatus["AWAIT_SHOP_CONFIRM"] = "AWAIT_SHOP_CONFIRM";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["PICKUP_ASSIGNED"] = "PICKUP_ASSIGNED";
    BookingStatus["PICKED_UP"] = "PICKED_UP";
    BookingStatus["IN_WASH"] = "IN_WASH";
    BookingStatus["READY_FOR_RETURN"] = "READY_FOR_RETURN";
    BookingStatus["ON_THE_WAY_RETURN"] = "ON_THE_WAY_RETURN";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["REVIEWED"] = "REVIEWED";
    BookingStatus["REJECTED"] = "REJECTED";
    BookingStatus["HOLD_EXPIRED"] = "HOLD_EXPIRED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["NO_SHOW"] = "NO_SHOW";
})(BookingStatus || (BookingStatus = {}));
class BookingQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(BookingStatus),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "limit", void 0);
class RejectPaymentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RejectPaymentDto.prototype, "reason", void 0);
class AssignRunnerDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignRunnerDto.prototype, "assignee", void 0);
class TransitionDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(BookingStatus),
    __metadata("design:type", String)
], TransitionDto.prototype, "next", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionDto.prototype, "notes", void 0);
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getBookings(query) {
        return this.adminService.getBookings(query);
    }
    async verifyPayment(req, bookingId) {
        const admin = req.user;
        return this.adminService.verifyPayment(bookingId, admin.id);
    }
    async rejectPayment(req, bookingId, dto) {
        const admin = req.user;
        return this.adminService.rejectPayment(bookingId, dto.reason, admin.id);
    }
    async assignRunner(req, bookingId, dto) {
        const admin = req.user;
        return this.adminService.assignRunner(bookingId, dto.assignee, admin.id);
    }
    async transitionBooking(req, bookingId, dto) {
        const admin = req.user;
        return this.adminService.transitionBooking(bookingId, dto.next, dto.notes, admin.id);
    }
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBookings", null);
__decorate([
    (0, common_1.Post)('bookings/:id/verify-payment'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('bookings/:id/reject-payment'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, RejectPaymentDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectPayment", null);
__decorate([
    (0, common_1.Post)('bookings/:id/assign-runner'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, AssignRunnerDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignRunner", null);
__decorate([
    (0, common_1.Post)('bookings/:id/transition'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, TransitionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "transitionBooking", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['admin']),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map