import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .optional(),
  bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
});

export const roomSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(50),
  game_name: z.string().min(1, "Game name is required"),
  max_players: z.number().min(2).max(100),
  mic_required: z.boolean(),
  region: z.string(),
});
