import { NextResponse } from "next/server";
import { searchRAWG } from "@/lib/rawg";
import { z } from "zod";

const querySchema = z.string().min(1).max(50);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");

  const result = querySchema.safeParse(rawQuery);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const query = result.data;

  try {
    const games = await searchRAWG(query);
    return NextResponse.json(games);
  } catch (error) {
    console.error("RAWG Route Error:", error);
    return NextResponse.json(
      { error: "Failed to search games" },
      { status: 500 }
    );
  }
}
