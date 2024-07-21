import { z } from 'zod';

export const FrameValidation = z.object({
  title: z.string().min(1),
  image: z.string().min(1),
});

export const EditFrameValidation = z.object({
  id: z.coerce.number(),
  title: z.string().min(1),
  image: z.string().min(1),
});

export const DeleteFrameValidation = z.object({
  id: z.coerce.number(),
});
