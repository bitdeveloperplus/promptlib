import { z } from 'zod';

export const healthSchema = z.object({
  health: z.string(),
  timestamp: z.string().optional(),
});

export type Health = z.infer<typeof healthSchema>;

