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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const auth_guard_1 = require("../common/auth.guard");
const settings_service_1 = require("./settings.service");
class CoordinateDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lng", void 0);
class ServiceAreaDto {
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CoordinateDto),
    __metadata("design:type", CoordinateDto)
], ServiceAreaDto.prototype, "center", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ServiceAreaDto.prototype, "radiusM", void 0);
class BusinessHourDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BusinessHourDto.prototype, "weekday", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BusinessHourDto.prototype, "openTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BusinessHourDto.prototype, "closeTime", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BusinessHourDto.prototype, "slotMinutes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BusinessHourDto.prototype, "defaultQuota", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BusinessHourDto.prototype, "isActive", void 0);
class PaymentChannelDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentChannelDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentChannelDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentChannelDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PaymentChannelDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PaymentChannelDto.prototype, "displayOrder", void 0);
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getServiceArea() {
        return this.settingsService.getServiceArea();
    }
    async updateServiceArea(dto) {
        return this.settingsService.updateServiceArea(dto);
    }
    async getBusinessHours() {
        return this.settingsService.getBusinessHours();
    }
    async updateBusinessHours(dto) {
        return this.settingsService.updateBusinessHours(dto);
    }
    async getPaymentChannels() {
        return this.settingsService.getPaymentChannels();
    }
    async updatePaymentChannels(dto, qrFile) {
        return this.settingsService.updatePaymentChannels(dto, qrFile);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('service-area'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getServiceArea", null);
__decorate([
    (0, common_1.Post)('service-area'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['admin']),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ServiceAreaDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateServiceArea", null);
__decorate([
    (0, common_1.Get)('business-hours'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getBusinessHours", null);
__decorate([
    (0, common_1.Post)('business-hours'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['admin']),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateBusinessHours", null);
__decorate([
    (0, common_1.Get)('payment-channels'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getPaymentChannels", null);
__decorate([
    (0, common_1.Post)('payment-channels'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, auth_guard_1.Roles)(['admin']),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('qrFile')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updatePaymentChannels", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map