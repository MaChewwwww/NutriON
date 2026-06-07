import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { mealLogs, mealLogItems } from "@/db/schema";
import { verifySession } from "@/lib/auth";
import { eq } from "drizzle-orm";

const mealLogItemSchema = z.object({
  foodId: z.number().nullable(),
  name: z.string().min(1),
  cal: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  size: z.coerce.number().min(0),
  unit: z.string().min(1),
  quantity: z.coerce.number().min(0.1),
});

const mealLogEditSchema = z.object({
  mealLogId: z.number(),
  category: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  notes: z.string().max(1000).optional(),
  items: z.array(mealLogItemSchema).min(1),
});

const mealLogSchema = z.object({
  category: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  notes: z.string().max(1000).optional(),
  items: z.array(mealLogItemSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = mealLogSchema.parse(body);

    const { category, notes, items } = parsed;

    // Use a database transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // 1. Insert meal log header
      const [result] = await tx.insert(mealLogs).values({
        userId: session.userId,
        category,
        notes: notes || null,
        loggedAt: new Date(), // Set active timestamp
      });

      const mealLogId = result.insertId;

      // 2. Insert meal log line items
      for (const item of items) {
        // Calculate items nutrients based on quantity multiplier
        const calories = Math.round(item.cal * item.quantity);
        const protein = parseFloat((item.protein * item.quantity).toFixed(1));
        const carbs = parseFloat((item.carbs * item.quantity).toFixed(1));
        const fat = parseFloat((item.fat * item.quantity).toFixed(1));

        await tx.insert(mealLogItems).values({
          mealLogId,
          foodId: item.foodId,
          customFoodName: item.foodId ? null : item.name,
          quantity: item.quantity,
          calories,
          protein,
          carbs,
          fat,
          servingSize: item.size,
          servingUnit: item.unit,
        });
      }
    });

    return NextResponse.json({ message: "Meal logged successfully" }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid log details", details: error.issues }, { status: 400 });
    }
    console.error("Meal Logging API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = mealLogEditSchema.parse(body);
    const { mealLogId, category, notes, items } = parsed;

    // 1. Fetch existing log header
    const [existingLog] = await db
      .select()
      .from(mealLogs)
      .where(eq(mealLogs.id, mealLogId))
      .limit(1);

    if (!existingLog) {
      return NextResponse.json({ error: "Meal log not found" }, { status: 404 });
    }

    if (existingLog.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Check if it is the current day
    const loggedDate = new Date(existingLog.loggedAt);
    const todayDate = new Date();
    const isToday =
      loggedDate.getFullYear() === todayDate.getFullYear() &&
      loggedDate.getMonth() === todayDate.getMonth() &&
      loggedDate.getDate() === todayDate.getDate();

    if (!isToday) {
      return NextResponse.json({ error: "Only logs from the current day can be edited" }, { status: 400 });
    }

    // 3. Update the log items in a transaction
    await db.transaction(async (tx) => {
      // Update notes/category in the header
      await tx
        .update(mealLogs)
        .set({
          category,
          notes: notes || null,
        })
        .where(eq(mealLogs.id, mealLogId));

      // Delete old line items
      await tx.delete(mealLogItems).where(eq(mealLogItems.mealLogId, mealLogId));

      // Insert new line items
      for (const item of items) {
        const calories = Math.round(item.cal * item.quantity);
        const protein = parseFloat((item.protein * item.quantity).toFixed(1));
        const carbs = parseFloat((item.carbs * item.quantity).toFixed(1));
        const fat = parseFloat((item.fat * item.quantity).toFixed(1));

        await tx.insert(mealLogItems).values({
          mealLogId,
          foodId: item.foodId,
          customFoodName: item.foodId ? null : item.name,
          quantity: item.quantity,
          calories,
          protein,
          carbs,
          fat,
          servingSize: item.size,
          servingUnit: item.unit,
        });
      }
    });

    return NextResponse.json({ message: "Meal log updated successfully" }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid edit details", details: error.issues }, { status: 400 });
    }
    console.error("Meal Log Edit API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mealLogIdStr = searchParams.get("mealLogId");
    if (!mealLogIdStr) {
      return NextResponse.json({ error: "Missing mealLogId parameter" }, { status: 400 });
    }
    const mealLogId = parseInt(mealLogIdStr);

    const [existingLog] = await db
      .select()
      .from(mealLogs)
      .where(eq(mealLogs.id, mealLogId))
      .limit(1);

    if (!existingLog) {
      return NextResponse.json({ error: "Meal log not found" }, { status: 404 });
    }

    if (existingLog.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if it is the current day
    const loggedDate = new Date(existingLog.loggedAt);
    const todayDate = new Date();
    const isToday =
      loggedDate.getFullYear() === todayDate.getFullYear() &&
      loggedDate.getMonth() === todayDate.getMonth() &&
      loggedDate.getDate() === todayDate.getDate();

    if (!isToday) {
      return NextResponse.json({ error: "Only logs from the current day can be deleted" }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      await tx.delete(mealLogItems).where(eq(mealLogItems.mealLogId, mealLogId));
      await tx.delete(mealLogs).where(eq(mealLogs.id, mealLogId));
    });

    return NextResponse.json({ message: "Meal log deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Meal Log Delete API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
