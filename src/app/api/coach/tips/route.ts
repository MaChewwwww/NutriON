import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { healthProfiles, mealLogs, mealLogItems, foods } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { verifySession } from "@/lib/auth";
import { generateCoachingTips } from "@/lib/gemini";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const regenerate = searchParams.get("regenerate") === "true";

    // 1. Fetch user profile
    const [profile] = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, session.userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { tips: "* Please complete your health profile setup to receive personalized nutritional tips and calorie targets." },
        { status: 200 }
      );
    }

    // 2. Fetch recent logs (last 5 meal logs)
    const logs = await db
      .select()
      .from(mealLogs)
      .where(eq(mealLogs.userId, session.userId))
      .orderBy(desc(mealLogs.loggedAt))
      .limit(5);

    let detailedLogs: any[] = [];
    if (logs.length > 0) {
      const logIds = logs.map((log) => log.id);
      const items = await db
        .select({
          id: mealLogItems.id,
          mealLogId: mealLogItems.mealLogId,
          foodId: mealLogItems.foodId,
          customFoodName: mealLogItems.customFoodName,
          foodName: foods.name,
          quantity: mealLogItems.quantity,
          calories: mealLogItems.calories,
        })
        .from(mealLogItems)
        .leftJoin(foods, eq(mealLogItems.foodId, foods.id))
        .where(inArray(mealLogItems.mealLogId, logIds));

      detailedLogs = logs.map((log) => {
        const logItems = items
          .filter((item) => item.mealLogId === log.id)
          .map((item) => ({
            name: item.foodId ? item.foodName : item.customFoodName,
            quantity: item.quantity,
            calories: item.calories,
          }));

        return {
          category: log.category,
          notes: log.notes,
          loggedAt: log.loggedAt,
          items: logItems,
        };
      });
    }

    // 3. Generate caching key hash based on profile metrics and recent logs
    const cacheKeyObject = {
      profile: {
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        activityLevel: profile.activityLevel,
        targetGoal: profile.targetGoal,
        calorieTarget: profile.calorieTarget,
        proteinTarget: profile.proteinTarget,
        carbsTarget: profile.carbsTarget,
        fatTarget: profile.fatTarget,
      },
      logs: detailedLogs.map((log) => ({
        category: log.category,
        notes: log.notes,
        loggedAt: log.loggedAt instanceof Date ? log.loggedAt.getTime() : log.loggedAt,
        items: log.items,
      })),
    };

    const cacheKey = crypto
      .createHash("sha256")
      .update(JSON.stringify(cacheKeyObject))
      .digest("hex");

    const cacheMatches = profile.aiTipsHash === cacheKey && profile.aiTipsCached;

    // 4. If cache matches, serve it immediately
    if (cacheMatches) {
      return NextResponse.json({
        tips: profile.aiTipsCached,
        hasUpdate: false,
        needsGeneration: false,
      }, { status: 200 });
    }

    // 5. If cache does not match but regenerate is NOT requested, return cached tips and flag update
    if (!regenerate) {
      return NextResponse.json({
        tips: profile.aiTipsCached || null,
        hasUpdate: true,
        needsGeneration: !profile.aiTipsCached,
      }, { status: 200 });
    }

    // 6. Regenerate is requested: call Gemini API
    console.log(`[CACHE REGENERATE] Calling Gemini AI for user ${session.userId}`);
    const tipsText = await generateCoachingTips(profile, detailedLogs);

    // 7. Save back to cache database
    await db
      .update(healthProfiles)
      .set({
        aiTipsCached: tipsText,
        aiTipsHash: cacheKey,
      })
      .where(eq(healthProfiles.id, profile.id));

    return NextResponse.json({
      tips: tipsText,
      hasUpdate: false,
      needsGeneration: false,
    }, { status: 200 });
  } catch (error) {
    console.error("Coaching Tips API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
