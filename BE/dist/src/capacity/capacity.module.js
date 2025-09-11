"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapacityModule = void 0;
const common_1 = require("@nestjs/common");
const capacity_controller_1 = require("./capacity.controller");
const capacity_service_1 = require("./capacity.service");
const settings_module_1 = require("../settings/settings.module");
let CapacityModule = class CapacityModule {
};
exports.CapacityModule = CapacityModule;
exports.CapacityModule = CapacityModule = __decorate([
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        controllers: [capacity_controller_1.CapacityController],
        providers: [capacity_service_1.CapacityService],
        exports: [capacity_service_1.CapacityService],
    })
], CapacityModule);
//# sourceMappingURL=capacity.module.js.map