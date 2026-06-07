import { NextResponse } from "next/server";
import { db } from "@/db";
import { nutritionLessons } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifySession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const lessonId = parseInt(id);

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const lessonRecords = await db
      .select()
      .from(nutritionLessons)
      .where(and(eq(nutritionLessons.id, lessonId), eq(nutritionLessons.published, true)))
      .limit(1);

    if (lessonRecords.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lessonRecords[0], { status: 200 });
  } catch (error) {
    console.error("Lesson Detail API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
