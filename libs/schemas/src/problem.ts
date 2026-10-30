import { z } from 'zod';

/** RFC 7807 problem+json。`code` 是稳定的错误码，前端按它本地化文案。 */
export const problemSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number().int(),
  code: z.string(),
  detail: z.string().optional(),
  requestId: z.string().optional(),
});

export type Problem = z.infer<typeof problemSchema>;
