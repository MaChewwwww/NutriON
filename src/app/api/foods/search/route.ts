import { NextResponse } from "next/server";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { verifySession } from "@/lib/auth";
import { searchUSDAFoods } from "@/lib/usda";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      // Return a set of default common foods if search query is empty
      const defaultFoods = await db.select().from(foods).limit(10);
      return NextResponse.json(defaultFoods, { status: 200 });
    }

    // 1. Search local cache
    const localMatches = await db
      .select()
      .from(foods)
      .where(like(foods.name, `%${q}%`))
      .limit(10);

    let results = [...localMatches];

    // 2. If local matches are low, fallback to USDA API search and cache results
    if (results.length < 3 && q.trim().length > 1) {
      const usdaResults = await searchUSDAFoods(q);

      for (const item of usdaResults) {
        // Prevent exact name duplicates
        const existing = await db
          .select()
          .from(foods)
          .where(eq(foods.name, item.name))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(foods).values({
            name: item.name,
            caloriesPerServing: item.caloriesPerServing,
            proteinG: item.proteinG,
            carbsG: item.carbsG,
            fatG: item.fatG,
            servingSize: item.servingSize,
            servingUnit: item.servingUnit,
          });

          // Fetch the newly inserted record to get its auto-incremented ID
          const newRecords = await db
            .select()
            .from(foods)
            .where(eq(foods.name, item.name))
            .limit(1);
          if (newRecords.length > 0) {
            results.push(newRecords[0]);
          }
        } else {
          // If it exists in DB but wasn't caught by the LIKE query, add it
          if (!results.some((x) => x.id === existing[0].id)) {
            results.push(existing[0]);
          }
        }
      }
    }

    // Deduplicate and limit to 10 items
    const uniqueResults = Array.from(new Map(results.map((item) => [item.id, item])).values()).slice(0, 10);

    return NextResponse.json(uniqueResults, { status: 200 });
  } catch (error) {
    console.error("Food Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
