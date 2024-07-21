import { z } from 'zod';

export const MatchingCriteriaEnum = z.enum([
  'RECEIPTS_XYZ_ALL_TIME_RUNNING',
  'COINBASE_ONCHAIN_VERIFICATIONS_COUNTRY',
  'COINBASE_ONCHAIN_VERIFICATIONS_ACCOUNT',
  'COINBASE_ONCHAIN_VERIFICATIONS_ONE',
  'POAPS_OWNED',
  'ALL',
]);

export const FrameValidation = z.object({
  title: z.string().min(1),
  shop: z.string().min(1),
  image: z.string().min(1),
  button: z.string().min(1),
  matchingCriteria: MatchingCriteriaEnum,
});

export const EditFrameValidation = z.object({
  id: z.coerce.number(),
  title: z.string().min(1),
  shop: z.string().min(1),
  image: z.string().min(1),
  button: z.string().min(1),
  matchingCriteria: MatchingCriteriaEnum,
});

export const DeleteFrameValidation = z.object({
  id: z.coerce.number(),
});
