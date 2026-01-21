import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const querySchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9\s-_]+$/);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");

  const result = querySchema.safeParse(rawQuery);

  if (!result.success) {
    return NextResponse.json(
      {
        error:
          "Invalid query. Alphanumeric, spaces, dashes only. Max 50 chars.",
      },
      { status: 400 }
    );
  }

  const query = result.data;

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(
        "id, username, avatar_url, level, is_pro, updated_at, bio, show_bio_as_status"
      )
      .ilike("username", `%${query}%`)
      .limit(10);

    if (error) throw error;

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Profile Search Error:", error);
    return NextResponse.json(
      { error: "Failed to search profiles" },
      { status: 500 }
    );
  }
}
