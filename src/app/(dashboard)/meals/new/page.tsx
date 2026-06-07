"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Flame, 
  Sparkles, 
  PlusCircle, 
  FileText, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 130 } },
};

// Static food database search results
const commonFoods = [
  { id: 1, name: "Large Chicken Egg 🍳", cal: 70, protein: 6.3, carbs: 0.4, fat: 4.8, size: 50, unit: "g" },
  { id: 2, name: "Whole Wheat Bread Slice 🍞", cal: 80, protein: 4.0, carbs: 15.0, fat: 1.0, size: 28, unit: "g" },
  { id: 3, name: "Grilled Chicken Breast 🍗", cal: 165, protein: 31.0, carbs: 0.0, fat: 3.6, size: 100, unit: "g" },
  { id: 4, name: "Steamed White Rice 🍚", cal: 130, protein: 2.7, carbs: 28.0, fat: 0.3, size: 100, unit: "g" },
  { id: 5, name: "Ripened Medium Banana 🍌", cal: 105, protein: 1.3, carbs: 27.0, fat: 0.3, size: 118, unit: "g" },
  { id: 6, name: "Fresh Hass Avocado 🥑", cal: 320, protein: 4.0, carbs: 17.0, fat: 29.0, size: 150, unit: "g" },
  { id: 7, name: "Low-fat Greek Yogurt 🥛", cal: 75, protein: 10.0, carbs: 3.6, fat: 2.0, size: 100, unit: "g" },
  { id: 8, name: "Rolled Oats cooked 🥣", cal: 71, protein: 2.5, carbs: 12.0, fat: 1.4, size: 100, unit: "g" },
];

function NewMealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (response.ok) {
          const data = await response.json();
          if (!data.profile) {
            router.push("/profile/setup");
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check session:", err);
      }
    };
    checkSession();
  }, [router]);
  
  // Set default category from query param if available
  const initialCategory = searchParams.get("category") || "breakfast";
  const [category, setCategory] = useState(initialCategory);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [draftItems, setDraftItems] = useState<any[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom food fields
  const [customFood, setCustomFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    servingSize: "100",
    servingUnit: "g"
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/foods/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Error searching foods:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Add search food to draft logs
  const addFoodToDraft = (food: any) => {
    const existing = draftItems.find(item => item.foodId === food.id);
    if (existing) {
      setDraftItems(prev => prev.map(item => 
        item.foodId === food.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setDraftItems(prev => [
        ...prev, 
        {
          id: Date.now(),
          foodId: food.id,
          name: food.name,
          cal: food.caloriesPerServing,
          protein: food.proteinG,
          carbs: food.carbsG,
          fat: food.fatG,
          size: food.servingSize,
          unit: food.servingUnit,
          quantity: 1
        }
      ]);
    }
    toast.success(`${food.name} added to draft!`);
  };

  // Add custom food logs
  const addCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFood.name || !customFood.calories) {
      toast.error("Please enter a food name and calorie estimate.");
      return;
    }

    setDraftItems(prev => [
      ...prev,
      {
        id: Date.now(),
        foodId: null, // manual
        name: `${customFood.name} 🍽️`,
        cal: parseInt(customFood.calories) || 0,
        protein: parseFloat(customFood.protein) || 0,
        carbs: parseFloat(customFood.carbs) || 0,
        fat: parseFloat(customFood.fat) || 0,
        size: parseFloat(customFood.servingSize) || 100,
        unit: customFood.servingUnit || "g",
        quantity: 1
      }
    ]);

    // Reset fields
    setCustomFood({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      servingSize: "100",
      servingUnit: "g"
    });
    setShowCustomForm(false);
    toast.success("Manual food item added to draft!");
  };

  // Remove log item
  const removeDraftItem = (id: number) => {
    setDraftItems(prev => prev.filter(item => item.id !== id));
  };

  // Adjust item serving multiplier
  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) return;
    setDraftItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: qty } : item
    ));
  };

  // Calculate totals
  const totalCal = Math.round(draftItems.reduce((acc, item) => acc + (item.cal * item.quantity), 0));
  const totalProtein = Math.round(draftItems.reduce((acc, item) => acc + (item.protein * item.quantity), 0));
  const totalCarbs = Math.round(draftItems.reduce((acc, item) => acc + (item.carbs * item.quantity), 0));
  const totalFat = Math.round(draftItems.reduce((acc, item) => acc + (item.fat * item.quantity), 0));

  // Submit complete meal log
  const editIdStr = searchParams.get("edit");

  // Load log if in edit mode
  useEffect(() => {
    if (!editIdStr) return;
    const fetchLogToEdit = async () => {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const logs = await res.json();
          const targetLog = logs.find((l: any) => l.id === parseInt(editIdStr));
          if (targetLog) {
            const loggedDate = new Date(targetLog.loggedAt);
            const todayDate = new Date();
            const isToday =
              loggedDate.getFullYear() === todayDate.getFullYear() &&
              loggedDate.getMonth() === todayDate.getMonth() &&
              loggedDate.getDate() === todayDate.getDate();

            if (!isToday) {
              toast.error("You cannot edit meal logs from past days.");
              router.push("/dashboard");
              return;
            }

            setCategory(targetLog.category);
            const draftList = targetLog.items.map((it: any) => ({
              id: it.foodId || `custom_${it.id}`,
              foodId: it.foodId,
              name: it.name,
              cal: Math.round(it.calories / it.quantity),
              protein: parseFloat((it.protein / it.quantity).toFixed(1)),
              carbs: parseFloat((it.carbs / it.quantity).toFixed(1)),
              fat: parseFloat((it.fat / it.quantity).toFixed(1)),
              size: it.servingSize,
              unit: it.servingUnit,
              quantity: it.quantity,
            }));
            setDraftItems(draftList);
          } else {
            toast.error("Meal log not found.");
            router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("Failed to load meal to edit:", err);
      }
    };
    fetchLogToEdit();
  }, [editIdStr, router]);

  // Submit complete or edited meal log
  const handleSaveMeal = async () => {
    if (draftItems.length === 0) {
      toast.error("Please search and add at least one food item first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEditing = !!editIdStr;
      const url = "/api/meals/log";
      const method = isEditing ? "PUT" : "POST";
      const bodyPayload: any = {
        category,
        items: draftItems.map((item) => ({
          foodId: item.foodId || null,
          name: item.name,
          cal: item.cal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          size: item.size,
          unit: item.unit,
          quantity: item.quantity,
        })),
      };

      if (isEditing) {
        bodyPayload.mealLogId = parseInt(editIdStr);
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/login");
          return;
        }
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "log"} meal`);
      }

      toast.success(`${category.toUpperCase()} ${isEditing ? "updated" : "logged"} successfully!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!editIdStr) return;
    if (!confirm("Are you sure you want to delete this meal log?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/meals/log?mealLogId=${editIdStr}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/login");
          return;
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to delete meal");
      }

      toast.success("Meal log deleted successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      {/* Header back button */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon-sm" 
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{editIdStr ? "Edit Meal Log" : "Log a Meal"}</h1>
          <p className="text-xs text-muted-foreground">
            {editIdStr 
              ? "Modify your items, notes, or delete the log entirely." 
              : "Select a category, search ingredients, or log manually."}
          </p>
        </div>
      </motion.div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left Side: Search & Food selections (3 cols) */}
        <div className="md:col-span-3 space-y-4">
          {/* Card: Category picker & search */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-primary/10 p-5 space-y-4">
              {/* Category picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Meal Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["breakfast", "lunch", "dinner", "snack"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`h-9 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                        category === cat
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-muted/30 border-muted hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Box */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search database (e.g. egg, toast, chicken)..." 
                    className="pl-10 h-10 bg-muted/20 border-muted focus-visible:bg-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Results list */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <CardHeader className="bg-muted/20 border-b py-3 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Results</CardTitle>
                <button 
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="text-xs font-bold text-primary hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="size-3.5" /> Manual Entry
                </button>
              </CardHeader>
              
              <CardContent className="p-0 divide-y divide-muted max-h-[350px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span>Searching food database...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((food) => (
                    <div 
                      key={food.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
                    >
                      <div>
                        <span className="block text-sm font-bold text-foreground">{food.name}</span>
                        <span className="block text-[10px] text-muted-foreground font-semibold mt-0.5">
                          Per Serving: {food.servingSize}{food.servingUnit} • P: {food.proteinG}g • C: {food.carbsG}g • F: {food.fatG}g
                        </span>
                      </div>
                      <Button 
                        size="xs" 
                        onClick={() => addFoodToDraft(food)}
                        className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white cursor-pointer"
                      >
                        <Plus className="size-3.5 mr-0.5" /> Add
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
                    <AlertCircle className="size-5 text-muted-foreground/50" />
                    <span>No food found matching "{searchQuery}"</span>
                    <button 
                      type="button" 
                      onClick={() => setShowCustomForm(true)}
                      className="text-primary hover:underline font-bold mt-1.5 cursor-pointer"
                    >
                      Create a manual log item instead
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Side: Log Draft Summary & Totals (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <motion.div variants={itemVariants} className="h-full">
            <Card className="shadow-lg border-primary/10 flex flex-col justify-between h-full min-h-[400px]">
              <CardHeader className="border-b pb-4 px-5">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 capitalize">
                  <FileText className="size-4 text-primary" /> {category} Draft
                </CardTitle>
                <CardDescription>Review accumulated nutrients before saving.</CardDescription>
              </CardHeader>

              {/* Draft List */}
              <CardContent className="flex-1 overflow-y-auto p-4 divide-y divide-muted max-h-[300px]">
                {draftItems.length > 0 ? (
                  <AnimatePresence>
                    {draftItems.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="py-3 flex flex-col gap-2 overflow-hidden first:pt-0"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-foreground truncate max-w-[170px]">{item.name}</span>
                          <button 
                            type="button" 
                            onClick={() => removeDraftItem(item.id)}
                            className="text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground font-semibold">
                            +{item.cal * item.quantity} kcal • {(item.size * item.quantity).toFixed(0)}{item.unit}
                          </span>
                          
                          {/* Quantity selectors */}
                          <div className="flex items-center border border-muted rounded-lg bg-muted/20">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 0.5)}
                              className="px-2 py-0.5 text-xs hover:bg-muted text-muted-foreground rounded-l-lg cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-mono font-bold text-foreground">
                              {item.quantity}x
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 0.5)}
                              className="px-2 py-0.5 text-xs hover:bg-muted text-muted-foreground rounded-r-lg cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-1.5 p-4">
                    <div className="size-8 rounded-full bg-muted/30 flex items-center justify-center border border-muted">
                      <Plus className="size-4" />
                    </div>
                    <span>Your meal draft is empty.</span>
                    <span className="text-[10px] text-muted-foreground/70">Search foods on the left to add items to your plate.</span>
                  </div>
                )}
              </CardContent>

              {/* Totals Summary */}
              <CardFooter className="bg-muted/30 border-t flex flex-col gap-4 p-5 rounded-b-xl">
                <div className="w-full grid grid-cols-4 gap-2 text-center text-[10px] font-bold border-b pb-3 border-muted">
                  <div className="space-y-0.5">
                    <span className="text-primary block text-sm font-black tracking-tight">{totalCal}</span>
                    <span className="text-muted-foreground uppercase">Kcal</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-amber-500 block text-sm font-black tracking-tight">{totalProtein}g</span>
                    <span className="text-muted-foreground uppercase">Protein</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-cyan-600 block text-sm font-black tracking-tight">{totalCarbs}g</span>
                    <span className="text-muted-foreground uppercase">Carbs</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-rose-600 block text-sm font-black tracking-tight">{totalFat}g</span>
                    <span className="text-muted-foreground uppercase">Fat</span>
                  </div>
                </div>

                <div className="w-full flex gap-2">
                  {editIdStr && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteMeal}
                      disabled={isSubmitting}
                      className="w-1/3 h-11 bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveMeal}
                    disabled={draftItems.length === 0 || isSubmitting}
                    className={`${editIdStr ? "w-2/3" : "w-full"} h-11 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-600/95 text-white font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5`}
                  >
                    {isSubmitting ? "Saving..." : (
                      <>
                        {editIdStr ? "Update" : "Save"} {category} Log <Sparkles className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

      </div>

      {/* Manual Food Drawer Popup Modal Dialog */}
      <AnimatePresence>
        {showCustomForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-primary/10 shadow-2xl rounded-2xl overflow-hidden relative"
            >
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-bold">Manual Food Entry</CardTitle>
                <CardDescription>Log custom meals in case a database match is missing.</CardDescription>
              </CardHeader>
              <form onSubmit={addCustomFood}>
                <CardContent className="space-y-3 pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Food Item Name</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Grandma's Chicken Soup" 
                      required
                      value={customFood.name}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Calories (kcal)</label>
                      <Input 
                        type="number" 
                        placeholder="220" 
                        required
                        value={customFood.calories}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Protein (g)</label>
                      <Input 
                        type="number" 
                        placeholder="18" 
                        value={customFood.protein}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Carbs (g)</label>
                      <Input 
                        type="number" 
                        placeholder="24" 
                        value={customFood.carbs}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fat (g)</label>
                      <Input 
                        type="number" 
                        placeholder="8" 
                        value={customFood.fat}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, fat: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Serving Size</label>
                      <Input 
                        type="number" 
                        value={customFood.servingSize}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, servingSize: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Serving Unit</label>
                      <Input 
                        type="text" 
                        value={customFood.servingUnit}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, servingUnit: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t py-3 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCustomForm(false)}
                    className="cursor-pointer h-9 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer h-9 text-xs"
                  >
                    Add Food Item
                  </Button>
                </CardFooter>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function NewMealPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <NewMealForm />
    </Suspense>
  );
}
