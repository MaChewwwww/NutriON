import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { healthProfiles, reminderSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "@/lib/auth";

const profileSetupSchema = z.object({
  age: z.coerce.number().min(12, { message: "You must be at least 12 years old" }).max(100, { message: "Age cannot exceed 100 years" }),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.coerce.number().min(100, { message: "Height must be between 100 cm and 250 cm" }).max(250, { message: "Height must be between 100 cm and 250 cm" }),
  weightKg: z.coerce.number().min(30, { message: "Weight must be between 30 kg and 300 kg" }).max(300, { message: "Weight must be between 30 kg and 300 kg" }),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  targetGoal: z.enum(["weight_loss", "maintenance", "weight_gain"]),
});

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileSetupSchema.parse(body);

    const { age, gender, heightCm, weightKg, activityLevel, targetGoal } = parsed;

    // Server-side Mifflin-St Jeor Calculations
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === "male") {
      bmr += 5;
    } else if (gender === "female") {
      bmr -= 161;
    } else {
      bmr -= 80; // Default offset for other genders
    }

    const activityFactors: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const factor = activityFactors[activityLevel] || 1.55;
    const tdee = bmr * factor;

    let calorieGoal = Math.round(tdee);
    if (targetGoal === "weight_loss") {
      calorieGoal = Math.max(1200, Math.round(tdee - 500));
    } else if (targetGoal === "weight_gain") {
      calorieGoal = Math.round(tdee + 300);
    }

    const proteinTarget = Math.round((calorieGoal * 0.3) / 4);
    const carbsTarget = Math.round((calorieGoal * 0.45) / 4);
    const fatTarget = Math.round((calorieGoal * 0.25) / 9);

    // Update or Insert profile
    const existing = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, session.userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(healthProfiles)
        .set({
          age,
          gender,
          heightCm,
          weightKg,
          activityLevel,
          targetGoal,
          calorieTarget: calorieGoal,
          proteinTarget,
          carbsTarget,
          fatTarget,
        })
        .where(eq(healthProfiles.userId, session.userId));
    } else {
      await db.insert(healthProfiles).values({
        userId: session.userId,
        age,
        gender,
        heightCm,
        weightKg,
        activityLevel,
        targetGoal,
        calorieTarget: calorieGoal,
        proteinTarget,
        carbsTarget,
        fatTarget,
      });
    }

    // Ensure reminders exist
    const existingReminders = await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.userId, session.userId))
      .limit(1);

    if (existingReminders.length === 0) {
      await db.insert(reminderSettings).values({
        userId: session.userId,
        breakfastEnabled: true,
        breakfastTime: "08:00",
        lunchEnabled: true,
        lunchTime: "13:00",
        dinnerEnabled: true,
        dinnerTime: "19:00",
      });
    }

    return NextResponse.json({ message: "Profile setup completed successfully" }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data inputs", details: error.issues }, { status: 400 });
    }
    console.error("Profile Setup API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
