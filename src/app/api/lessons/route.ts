import { NextResponse } from "next/server";
import { db } from "@/db";
import { nutritionLessons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessonsList = await db
      .select()
      .from(nutritionLessons)
      .where(eq(nutritionLessons.published, true));

    return NextResponse.json(lessonsList, { status: 200 });
  } catch (error) {
    console.error("Lessons API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
