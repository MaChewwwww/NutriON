import { GoogleGenerativeAI } from "@google/generative-ai";

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. AI features will run in sandbox mode.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

const SYSTEM_PROMPT = `You are a supportive, certified student health coach for the NutriON application.
Your job is to analyze the student's health profile demographics, target macros, and recent meal logs to provide exactly 2-3 simple, safe, and highly actionable nutrition tips.

Guidelines:
1. Provide educational and lifestyle guidance only.
2. Strictly reject generating plans that suggest extreme restriction (e.g., daily calorie goals under 1200 kcal) or diagnose medical conditions.
3. Tailor tips to a student's daily routine (e.g., hydration for exams, balanced options in dining halls, quick high-protein dorm snacks).
4. Keep the output clear, positive, and formatted in markdown bullets. Do not use HTML tags.
5. ALWAYS conclude the tips with this exact sentence: "*Disclaimer: These tips are for educational guidance only and do not replace professional medical advice.*"
`;

async function generateTipsWithClient(genAI: any, profile: any, recentLogs: any[]): Promise<string> {
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });

  const userProfileText = `
User Profile:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.heightCm} cm
- Weight: ${profile.weightKg} kg
- Activity Level: ${profile.activityLevel}
- Target Goal: ${profile.targetGoal}
- Calorie Budget: ${profile.calorieTarget} kcal
- Target Protein: ${profile.proteinTarget}g, Carbs: ${profile.carbsTarget}g, Fat: ${profile.fatTarget}g
`;

  const logsText = recentLogs.length > 0
    ? recentLogs.map((log) => {
        const itemsStr = log.items.map((it: any) => `${it.quantity}x ${it.name} (${it.calories} kcal)`).join(", ");
        return `- [${log.loggedAt}] Category: ${log.category}. Notes: ${log.notes || "None"}. Items logged: ${itemsStr}`;
      }).join("\n")
    : "No recent meal logs recorded.";

  const prompt = `
Please evaluate my health metrics and recent nutrition logs to give me customized health tips:
${userProfileText}

Recent Meal Logs:
${logsText}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text || "No suggestions generated.";
}

export async function generateCoachingTips(profile: any, recentLogs: any[]): Promise<string> {
  const genAI = getGenAIClient();
  if (genAI) {
    try {
      return await generateTipsWithClient(genAI, profile, recentLogs);
    } catch (error) {
      console.error("Gemini API generation error with primary key:", error);
    }
  }

  // Fallback to secondary API key if defined
  const fallbackApiKey = process.env.GEMINI_FALLBACK_API_KEY;
  if (fallbackApiKey) {
    console.log("Attempting Gemini API generation with fallback key...");
    try {
      const fallbackGenAI = new GoogleGenerativeAI(fallbackApiKey);
      return await generateTipsWithClient(fallbackGenAI, profile, recentLogs);
    } catch (fallbackError) {
      console.error("Gemini API generation error with fallback key:", fallbackError);
    }
  }

  // If even that fails or is not defined, fall back to mock sandbox or static tips
  if (!genAI && !fallbackApiKey) {
    return `* Seeding your morning with a balanced meal like Greek yogurt or scrambled eggs will stabilize your blood sugar and maintain high academic concentration during lectures.
* Stay hydrated! Dehydration often mimics hunger signals and causes focus fatigue. Keep a water bottle at your study desk.
* Aim to hit your target of ${profile?.proteinTarget || 75}g of protein to support muscle maintenance and recovery.
\n*Disclaimer: These tips are for educational guidance only and do not replace professional medical advice.*`;
  }

  // Fallback to static tips if both failed
  return `* Start your day with a high-protein breakfast to stay full and maintain focus during study blocks.
* Keep a reusable water bottle near your desk; drinking water regularly is key to metabolic health.
* Ensure you match food intakes closely to your target calorie goals.
\n*Disclaimer: These tips are for educational guidance only and do not replace professional medical advice.*`;
}
