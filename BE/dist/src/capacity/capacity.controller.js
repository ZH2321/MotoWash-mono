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
exports.CapacityController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const capacity_service_1 = require("./capacity.service");
class AvailabilityQueryDto {
}
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AvailabilityQueryDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AvailabilityQueryDto.prototype, "endDate", void 0);
let CapacityController = class CapacityController {
    constructor(capacityService) {
        this.capacityService = capacityService;
    }
    async getAvailability(query) {
        return this.capacityService.getAvailability(query.date, query.endDate);
    }
};
exports.CapacityController = CapacityController;
__decorate([
    (0, common_1.Get)('availability'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AvailabilityQueryDto]),
    __metadata("design:returntype", Promise)
], CapacityController.prototype, "getAvailability", null);
exports.CapacityController = CapacityController = __decorate([
    (0, common_1.Controller)('capacity'),
    __metadata("design:paramtypes", [capacity_service_1.CapacityService])
], CapacityController);
//# sourceMappingURL=capacity.controller.js.map