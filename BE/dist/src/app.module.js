"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const settings_module_1 = require("./settings/settings.module");
const capacity_module_1 = require("./capacity/capacity.module");
const bookings_module_1 = require("./bookings/bookings.module");
const admin_module_1 = require("./admin/admin.module");
const line_module_1 = require("./line/line.module");
const jobs_module_1 = require("./jobs/jobs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            settings_module_1.SettingsModule,
            capacity_module_1.CapacityModule,
            bookings_module_1.BookingsModule,
            admin_module_1.AdminModule,
            line_module_1.LineModule,
            jobs_module_1.JobsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map