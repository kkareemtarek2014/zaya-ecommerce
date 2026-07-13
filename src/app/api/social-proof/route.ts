import { withHandler } from '@/server/http/handler';
import { getRequestDb } from '@/server/db/request';
import { getSocialProof } from '@/server/services/merchandising.service';

export const GET = withHandler(async () => {
  const db = await getRequestDb();
  const proof = await getSocialProof(db);
  return proof ?? { handle: null, postUrls: [] };
});
