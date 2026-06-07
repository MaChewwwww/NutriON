import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { healthProfiles, reminderSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "@/lib/auth";

const profileSchema = z.object({
  age: z.coerce.number().min(12, { message: "You must be at least 12 years old" }).max(100, { message: "Age cannot exceed 100 years" }),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.coerce.number().min(100, { message: "Height must be between 100 cm and 250 cm" }).max(250, { message: "Height must be between 100 cm and 250 cm" }),
  weightKg: z.coerce.number().min(30, { message: "Weight must be between 30 kg and 300 kg" }).max(300, { message: "Weight must be between 30 kg and 300 kg" }),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  targetGoal: z.enum(["weight_loss", "maintenance", "weight_gain"]),
});

const remindersSchema = z.object({
  breakfastEnabled: z.boolean(),
  breakfastTime: z.string().regex(/^\d{2}:\d{2}$/),
  lunchEnabled: z.boolean(),
  lunchTime: z.string().regex(/^\d{2}:\d{2}$/),
  dinnerEnabled: z.boolean(),
  dinnerTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const settingsUpdateSchema = z.object({
  profile: profileSchema,
  reminders: remindersSchema,
});

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { profile, reminders } = settingsUpdateSchema.parse(body);

    const { age, gender, heightCm, weightKg, activityLevel, targetGoal } = profile;

    // Recalculate Mifflin-St Jeor values
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === "male") {
      bmr += 5;
    } else if (gender === "female") {
      bmr -= 161;
    } else {
      bmr -= 80;
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

    // Perform updates in a transaction
    await db.transaction(async (tx) => {
      // 1. Update Profile
      await tx
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

      // 2. Update Reminders
      await tx
        .update(reminderSettings)
        .set({
          breakfastEnabled: reminders.breakfastEnabled,
          breakfastTime: reminders.breakfastTime,
          lunchEnabled: reminders.lunchEnabled,
          lunchTime: reminders.lunchTime,
          dinnerEnabled: reminders.dinnerEnabled,
          dinnerTime: reminders.dinnerTime,
        })
        .where(eq(reminderSettings.userId, session.userId));
    });

    return NextResponse.json({ message: "Settings saved successfully" }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid updates", details: error.issues }, { status: 400 });
    }
    console.error("Settings Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
