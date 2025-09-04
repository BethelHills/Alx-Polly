// lib/schemas/poll.ts
import { z } from "zod";

export const createPollSchema = z.object({
  title: z.string().min(3).max(200),
  options: z.array(z.string().min(1).max(150)).min(2).max(10),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
