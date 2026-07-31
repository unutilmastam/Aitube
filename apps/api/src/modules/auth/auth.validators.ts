import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email formati noto'g'ri"),
  password: z
    .string()
    .min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
    .regex(/[A-Z]/, "Parolda kamida bitta katta harf bo'lishi kerak")
    .regex(/[0-9]/, "Parolda kamida bitta raqam bo'lishi kerak"),
});

export const loginSchema = z.object({
  email: z.string().email("Email formati noto'g'ri"),
  password: z.string().min(1, "Parol kiritilishi shart"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token kiritilishi shart"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
