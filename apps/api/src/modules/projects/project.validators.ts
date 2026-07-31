import { z } from "zod";

export const nicheEnum = z.enum([
  "EDUCATIONAL",
  "HISTORY",
  "TECHNOLOGY",
  "SCIENCE",
  "BUSINESS",
  "MOTIVATION",
  "ENTERTAINMENT",
  "FACTS",
  "STORIES",
]);

export const createProjectSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 belgi bo'lishi kerak").max(200),
  niche: nicheEnum,
  language: z.string().min(2).max(10).default("uz"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
