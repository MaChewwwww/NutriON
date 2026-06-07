import { NextResponse } from "next/server";
import { db } from "@/db";
import { mealLogs, mealLogItems, foods } from "@/db/schema";
import { eq, and, gte, lte, desc, inArray, SQL } from "drizzle-orm";
import { verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");

    // 1. Fetch meal log headers matching criteria
    let conditions: SQL | undefined = eq(mealLogs.userId, session.userId);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      conditions = and(conditions, gte(mealLogs.loggedAt, start));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions = and(conditions, lte(mealLogs.loggedAt, end));
    }

    if (category && category !== "all") {
      conditions = and(conditions, eq(mealLogs.category, category));
    }

    const logs = await db
      .select()
      .from(mealLogs)
      .where(conditions)
      .orderBy(desc(mealLogs.loggedAt));

    if (logs.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 2. Fetch all line items for the matching logs with food names
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
        protein: mealLogItems.protein,
        carbs: mealLogItems.carbs,
        fat: mealLogItems.fat,
        servingSize: mealLogItems.servingSize,
        servingUnit: mealLogItems.servingUnit,
      })
      .from(mealLogItems)
      .leftJoin(foods, eq(mealLogItems.foodId, foods.id))
      .where(inArray(mealLogItems.mealLogId, logIds));

    // 3. Map line items to their respective logs
    const detailedLogs = logs.map((log) => {
      const logItems = items
        .filter((item) => item.mealLogId === log.id)
        .map((item) => ({
          id: item.id,
          foodId: item.foodId,
          name: item.foodId ? item.foodName : item.customFoodName,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
        }));

      // Summarize total nutrition for the meal log
      const totalCalories = Math.round(logItems.reduce((sum, item) => sum + item.calories, 0));
      const totalProtein = parseFloat(logItems.reduce((sum, item) => sum + item.protein, 0).toFixed(1));
      const totalCarbs = parseFloat(logItems.reduce((sum, item) => sum + item.carbs, 0).toFixed(1));
      const totalFat = parseFloat(logItems.reduce((sum, item) => sum + item.fat, 0).toFixed(1));

      return {
        id: log.id,
        category: log.category,
        notes: log.notes,
        loggedAt: log.loggedAt,
        items: logItems,
        summary: {
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
        },
      };
    });

    return NextResponse.json(detailedLogs, { status: 200 });
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
