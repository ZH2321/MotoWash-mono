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
exports.LineController = void 0;
const common_1 = require("@nestjs/common");
const line_service_1 = require("./line.service");
const line_1 = require("../common/line");
const errors_1 = require("../common/errors");
let LineController = class LineController {
    constructor(lineService) {
        this.lineService = lineService;
    }
    async handleWebhook(signature, body) {
        if (!signature) {
            throw new errors_1.UnauthorizedError('Missing X-Line-Signature header');
        }
        const bodyString = body.toString('utf8');
        if (!line_1.LineHelper.verifySignature(bodyString, signature)) {
            throw new errors_1.UnauthorizedError('Invalid LINE signature');
        }
        const webhookBody = JSON.parse(bodyString);
        for (const event of webhookBody.events || []) {
            await this.lineService.handleEvent(event);
        }
        return { status: 'ok' };
    }
};
exports.LineController = LineController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('x-line-signature')),
    __param(1, (0, common_1.RawBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Buffer]),
    __metadata("design:returntype", Promise)
], LineController.prototype, "handleWebhook", null);
exports.LineController = LineController = __decorate([
    (0, common_1.Controller)('webhook/line'),
    __metadata("design:paramtypes", [line_service_1.LineService])
], LineController);
//# sourceMappingURL=line.controller.js.map