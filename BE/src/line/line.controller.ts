import { Controller, Post, Body, Headers, RawBody } from '@nestjs/common';
import { LineService } from './line.service';
import { LineHelper } from '../common/line';
import { UnauthorizedError } from '../common/errors';

@Controller('webhook/line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Post()
  async handleWebhook(
    @Headers('x-line-signature') signature: string,
    @RawBody() body: Buffer,
  ) {
    if (!signature) {
      throw new UnauthorizedError('Missing X-Line-Signature header');
    }

    const bodyString = body.toString('utf8');
    
    // Verify signature
    if (!LineHelper.verifySignature(bodyString, signature)) {
      throw new UnauthorizedError('Invalid LINE signature');
    }

    const webhookBody = JSON.parse(bodyString);
    
    // Process webhook events
    for (const event of webhookBody.events || []) {
      await this.lineService.handleEvent(event);
    }

    return { status: 'ok' };
  }
}