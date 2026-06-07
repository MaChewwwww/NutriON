import { NextResponse } from "next/server";
import { db } from "@/db";
import { healthProfiles, reminderSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile] = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, session.userId))
      .limit(1);

    const [reminders] = await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.userId, session.userId))
      .limit(1);

    return NextResponse.json(
      {
        profile: profile || null,
        reminders: reminders || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Profile API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
