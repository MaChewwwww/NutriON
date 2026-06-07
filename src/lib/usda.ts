interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
}

const getEnergyValue = (nutrients: USDANutrient[]): number => {
  // Try ID 208 (Energy in kcal)
  let n = nutrients.find(x => x.nutrientId === 208);
  if (n) return n.value;
  // Try ID 1008 (Energy in kcal)
  n = nutrients.find(x => x.nutrientId === 1008);
  if (n) return n.value;
  // Fallback to name search
  const energyNutrients = nutrients.filter(x => x.nutrientName.toLowerCase().includes("energy"));
  const kcalNutrient = energyNutrients.find(x => x.unitName.toLowerCase() === "kcal" || x.nutrientName.toLowerCase().includes("kcal"));
  if (kcalNutrient) return kcalNutrient.value;
  if (energyNutrients.length > 0) return energyNutrients[0].value;
  return 0;
};

const getNutrient = (nutrients: USDANutrient[], id: number, nameQuery: string): number => {
  const n = nutrients.find(x => x.nutrientId === id || x.nutrientName.toLowerCase().includes(nameQuery.toLowerCase()));
  return n ? n.value : 0;
};

export async function searchUSDAFoods(query: string) {
  try {
    const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
      query
    )}&pageSize=10&api_key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 }, // Cache on Next.js fetch layer for 1 hour
    });

    if (!response.ok) {
      console.warn(`USDA API responded with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data || !data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return (data.foods as USDAFood[]).map((food) => {
      const servingSize = food.servingSize ? parseFloat(food.servingSize.toString()) : 100;
      const servingUnit = food.servingSizeUnit || "g";

      // USDA values are given per 100g, so we scale them to the serving size
      const scale = servingSize / 100;

      const caloriesRaw = getEnergyValue(food.foodNutrients);
      const proteinRaw = getNutrient(food.foodNutrients, 203, "protein");
      const carbsRaw = getNutrient(food.foodNutrients, 205, "carbohydrate");
      const fatRaw = getNutrient(food.foodNutrients, 204, "lipid");

      return {
        name: food.description,
        caloriesPerServing: Math.round(caloriesRaw * scale),
        proteinG: parseFloat((proteinRaw * scale).toFixed(1)),
        carbsG: parseFloat((carbsRaw * scale).toFixed(1)),
        fatG: parseFloat((fatRaw * scale).toFixed(1)),
        servingSize,
        servingUnit,
      };
    });
  } catch (error) {
    console.error("Error calling USDA API:", error);
    return [];
  }
}
