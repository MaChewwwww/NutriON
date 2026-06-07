import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { foods, nutritionLessons } from "./schema";

const seedFoods = [
  { name: "Large Chicken Egg 🍳", caloriesPerServing: 70, proteinG: 6.3, carbsG: 0.4, fatG: 4.8, servingSize: 50, servingUnit: "g" },
  { name: "Whole Wheat Bread Slice 🍞", caloriesPerServing: 80, proteinG: 4.0, carbsG: 15.0, fatG: 1.0, servingSize: 28, servingUnit: "g" },
  { name: "Grilled Chicken Breast 🍗", caloriesPerServing: 165, proteinG: 31.0, carbsG: 0.0, fatG: 3.6, servingSize: 100, servingUnit: "g" },
  { name: "Steamed White Rice 🍚", caloriesPerServing: 130, proteinG: 2.7, carbsG: 28.0, fatG: 0.3, servingSize: 100, servingUnit: "g" },
  { name: "Ripened Medium Banana 🍌", caloriesPerServing: 105, proteinG: 1.3, carbsG: 27.0, fatG: 0.3, servingSize: 118, servingUnit: "g" },
  { name: "Fresh Hass Avocado 🥑", caloriesPerServing: 320, proteinG: 4.0, carbsG: 17.0, fatG: 29.0, servingSize: 150, servingUnit: "g" },
  { name: "Low-fat Greek Yogurt 🥛", caloriesPerServing: 75, proteinG: 10.0, carbsG: 3.6, fatG: 2.0, servingSize: 100, servingUnit: "g" },
  { name: "Rolled Oats cooked 🥣", caloriesPerServing: 71, proteinG: 2.5, carbsG: 12.0, fatG: 1.4, servingSize: 100, servingUnit: "g" },
];

const seedLessons = [
  {
    title: "Macronutrients 101: The Energy Blocks 🌾",
    category: "Basics",
    description: "Understand the differences between Protein, Carbohydrates, and Fats, and why your body requires them.",
    readingTimeMinutes: 5,
    published: true,
    content: `# Macronutrients 101: The Energy Blocks 🌾

Nutrition doesn't have to be complicated. At its core, the energy your body needs is derived from three primary building blocks called **Macronutrients**:

## 1. Protein: The Builder 🍳
Protein is essential for muscle repair, immune function, and enzyme production. It contains **4 calories per gram**.
*   **Best Sources**: Chicken, eggs, fish, tofu, lentils, and Greek yogurt.
*   **Student Tip**: Having protein in the morning keeps you full and focused through morning lectures!

## 2. Carbohydrates: The Fuel 🍞
Carbs are your body's primary energy source. They are converted to glucose, powering your brain and physical movement. They contain **4 calories per gram**.
*   **Simple Carbs**: White sugars, candy (gives fast spikes and crashes).
*   **Complex Carbs**: Oats, whole wheat, brown rice, vegetables (gives sustained, slow-release energy).

## 3. Fats: The Protector 🥑
Fats are vital for hormone production, brain health, and absorbing fat-soluble vitamins (A, D, E, K). They contain **9 calories per gram**.
*   **Healthy Fats**: Olive oil, avocados, nuts, seeds, and fatty fish.
`,
  },
  {
    title: "Understanding Daily Calorie Budgets 🔥",
    category: "Weight Control",
    description: "Learn how Mifflin-St Jeor evaluates your Basal Metabolic Rate (BMR) and how to manage deficit limits.",
    readingTimeMinutes: 8,
    published: true,
    content: `# Understanding Daily Calorie Budgets 🔥

Your calorie target is your daily energy budget. Here is how your body uses energy and how your target is calculated:

## Basal Metabolic Rate (BMR)
This is the amount of energy your body burns just to keep you alive (breathing, pumping blood, cell division) in a completely resting state. 
NutriON uses the **Mifflin-St Jeor equation** to calculate this:
*   **Men**: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
*   **Women**: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161

## Total Daily Energy Expenditure (TDEE)
BMR is multiplied by an activity factor (1.2 for sedentary to 1.9 for very active) to calculate your TDEE—your maintenance calorie limit.

## Deficit & Surplus Targets
*   **Weight Loss**: A safe daily deficit of **300 - 500 kcal** below your TDEE is recommended.
*   **Weight Gain**: A surplus of **300 kcal** above TDEE helps support muscle growth.
`,
  },
  {
    title: "Mindful Eating & Healthy Portioning 🥑",
    category: "Habits",
    description: "How to log food mindfully and understand serving size estimates without feeling food guilt.",
    readingTimeMinutes: 6,
    published: true,
    content: `# Mindful Eating & Healthy Portioning 🥑

Eating is a behavior, not just a mathematical equation. Mindful eating is about building a sustainable, guilt-free relationship with food.

## Portion Size Estimation Hacks
If you don't have a kitchen scale, use your hand to guide portion sizes:
*   **Palm size**: Ideal portion of dense protein (chicken, fish, tofu) ~ 100g.
*   **Clenched Fist**: Ideal portion of vegetables or complex carbs (rice, pasta) ~ 1 cup.
*   **Cupped Hand**: Ideal portion of grains, snacks, or fruit.
*   **Thumb size**: Ideal portion of fats (butter, oils, nut butter) ~ 1 tablespoon.

## Preventing Food Guilt
Logging a slice of pizza or cake is perfectly fine! The key is consistency, not absolute perfection. Track your meals to observe habits, not to punish yourself.
`,
  },
  {
    title: "Hydration Guidelines for Health & Focus 💧",
    category: "Basics",
    description: "The science of optimal water intake and how staying hydrated boosts metabolism and prevents false hunger.",
    readingTimeMinutes: 4,
    published: true,
    content: `# Hydration Guidelines for Health & Focus 💧

Water constitutes roughly 60% of your body weight and is critical for every metabolic process.

## False Hunger
Dehydration triggers signals in the brain that mimic hunger. If you feel sudden cravings, drink a glass of water first and wait 15 minutes!

## Hydration Goals
*   **Standard Target**: Aim for **2.5 to 3.5 Liters** of water per day.
*   **Academic Focus**: Mild dehydration (1-2% body weight loss) reduces concentration, memory performance, and causes headaches. Keep a water bottle on your desk during study sessions!
`,
  },
];

async function main() {
  console.log("Seeding database...");

  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
  });
  const db = drizzle({ client: connection, mode: "default", schema });

  try {
    // 1. Seed Foods
    for (const food of seedFoods) {
      const existing = await db
        .select()
        .from(foods)
        .where(eq(foods.name, food.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(foods).values(food);
        console.log(`Seeded food: ${food.name}`);
      }
    }

    // 2. Seed Lessons
    for (const lesson of seedLessons) {
      const existing = await db
        .select()
        .from(nutritionLessons)
        .where(eq(nutritionLessons.title, lesson.title))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(nutritionLessons).values(lesson);
        console.log(`Seeded lesson: ${lesson.title}`);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
