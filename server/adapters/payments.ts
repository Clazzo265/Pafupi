import { AppError } from '../domain.js';
/** Only a licensed, approved provider integration may implement this interface.
 * No client response is evidence of a settled or authorized payment.
 */
export interface PaymentAdapter {
  readonly name: string;
  createAuthorization(input: {
    taskId: string;
    amount: number;
    currency: 'MWK';
    idempotencyKey: string;
  }): Promise<{ providerReference: string; authorizationUrl: string }>;
  verifyWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{
    eventId: string;
    providerReference: string;
    amount: number;
    currency: 'MWK';
    status: 'confirmed' | 'failed' | 'refunded';
  }>;
}
export const unavailablePayments: PaymentAdapter = {
  name: 'not-configured',
  async createAuthorization() {
    throw new AppError(
      503,
      'Payments are not connected. No money has been charged. Tasks cannot start until a trusted payment adapter confirms payment.',
    );
  },
  async verifyWebhook() {
    throw new AppError(503, 'No payment provider is configured. Webhooks cannot be accepted.');
  },
};
