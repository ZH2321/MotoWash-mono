import { LineService } from './line.service';
export declare class LineController {
    private readonly lineService;
    constructor(lineService: LineService);
    handleWebhook(signature: string, body: Buffer): Promise<{
        status: string;
    }>;
}
