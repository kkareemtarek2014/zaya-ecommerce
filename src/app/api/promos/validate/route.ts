import { withHandler } from '@/server/http/handler';
import { validatePromoInputSchema } from '@/shared/contracts/promo.contract';
import { ValidationError } from '@/server/http/errors';
import { validatePromo } from '@/server/services/promo.service';

export const POST = withHandler(async (request) => {
  const body: unknown = await request.json();
  const parsed = validatePromoInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  return validatePromo(parsed.data.code, parsed.data.subtotal);
});
