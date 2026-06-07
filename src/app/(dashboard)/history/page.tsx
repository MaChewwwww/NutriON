"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ArrowLeft, 
  Flame, 
  Sparkles, 
  Filter,
  CheckCircle,
  TrendingDown
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
};

// Static mock history logs
const mockHistoryDays = [
  {
    date: "Today - Sunday, June 7",
    totalCal: 1160,
    calorieGoal: 2000,
    protein: 86,
    carbs: 114,
    fat: 33,
    meals: [
      { id: 1, category: "breakfast", time: "8:15 AM", name: "Avocado Toast & Boiled Eggs", cal: 350, items: ["2 Eggs", "1 Wheat Bread Slice", "1/2 Avocado"] },
      { id: 2, category: "lunch", time: "12:45 PM", name: "Quinoa Chicken Bowl", cal: 520, items: ["100g Chicken Breast", "100g Quinoa", "Mixed Greens", "Olive Oil"] },
      { id: 3, category: "snack", time: "4:30 PM", name: "Whey Shake & Banana", cal: 290, items: ["1 scoop Whey Protein", "1 Medium Banana"] }
    ]
  },
  {
    date: "Yesterday - Saturday, June 6",
    totalCal: 1840,
    calorieGoal: 2000,
    protein: 135,
    carbs: 195,
    fat: 52,
    meals: [
      { id: 4, category: "breakfast", time: "9:00 AM", name: "Oatmeal with Blueberries & Honey", cal: 380, items: ["100g Oats", "50g Blueberries", "1 tbsp Honey"] },
      { id: 5, category: "lunch", time: "1:30 PM", name: "Salmon Salad Bowl", cal: 560, items: ["120g Baked Salmon", "Mixed Greens", "Feta Cheese", "Walnuts"] },
      { id: 6, category: "snack", time: "5:00 PM", name: "Greek Yogurt & Almonds", cal: 220, items: ["150g Greek Yogurt", "15g Almonds"] },
      { id: 7, category: "dinner", time: "7:30 PM", name: "Beef Sirloin & Sweet Potato", cal: 680, items: ["150g Beef Sirloin", "150g Sweet Potato", "Asparagus"] }
    ]
  },
  {
    date: "Friday, June 5",
    totalCal: 2050,
    calorieGoal: 2000,
    protein: 148,
    carbs: 212,
    fat: 62,
    meals: [
      { id: 8, category: "breakfast", time: "8:00 AM", name: "Scrambled Eggs & Bacon", cal: 420, items: ["3 Eggs", "2 slices Turkey Bacon", "Spinach"] },
      { id: 9, category: "lunch", time: "12:30 PM", name: "Tuna Wrap & Apple", cal: 490, items: ["1 can Tuna", "1 Tortilla Wrap", "1 Apple"] },
      { id: 10, category: "snack", time: "3:45 PM", name: "Protein Bar", cal: 240, items: ["1 Quest Bar"] },
      { id: 11, category: "dinner", time: "7:00 PM", name: "Turkey Burger & Baked Fries", cal: 900, items: ["200g Lean Turkey", "1 Burger Bun", "150g Potato Wedges", "Cheese"] }
    ]
  }
];

export default function HistoryPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Record<number, boolean>>({});
  const [historyDays, setHistoryDays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  const toggleExpandDay = (day: string) => {
    setExpandedDay(prev => prev === day ? null : day);
  };

  const toggleMealExpand = (mealId: number) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Load calorie goal
        const profileRes = await fetch("/api/profile");
        if (profileRes.status === 401) {
          router.push("/login");
          return;
        }
        let activeTarget = 2000;
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (!profileData.profile) {
            router.push("/profile/setup");
            return;
          }
          if (profileData.profile?.calorieTarget) {
            activeTarget = profileData.profile.calorieTarget;
            setCalorieGoal(activeTarget);
          }
        }

        // 2. Load logs history
        const queryParams = new URLSearchParams();
        if (activeCategory !== "all") {
          queryParams.append("category", activeCategory);
        }
        if (startDate) {
          queryParams.append("startDate", startDate);
        }
        if (endDate) {
          queryParams.append("endDate", endDate);
        }

        const historyRes = await fetch(`/api/history?${queryParams.toString()}`);
        if (historyRes.ok) {
          const rawLogs = await historyRes.json();
          
          // Group logs by date on client side
          const groups: Record<string, any> = {};
          
          rawLogs.forEach((log: any) => {
            const dateObj = new Date(log.loggedAt);
            const dateKey = dateObj.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
            
            let displayDate = dateKey;
            const todayStr = new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
            
            if (dateKey === todayStr) {
              displayDate = `Today - ${dateKey}`;
            } else if (dateKey === yesterdayStr) {
              displayDate = `Yesterday - ${dateKey}`;
            }

            if (!groups[dateKey]) {
              groups[dateKey] = {
                date: displayDate,
                totalCal: 0,
                calorieGoal: activeTarget,
                protein: 0,
                carbs: 0,
                fat: 0,
                meals: [],
              };
            }

            const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

            groups[dateKey].totalCal += log.summary.calories;
            groups[dateKey].protein += Math.round(log.summary.protein);
            groups[dateKey].carbs += Math.round(log.summary.carbs);
            groups[dateKey].fat += Math.round(log.summary.fat);
            
            groups[dateKey].meals.push({
              id: log.id,
              category: log.category,
              time: timeStr,
              name: `${log.category.toUpperCase()} Log`,
              cal: log.summary.calories,
              items: log.items,
              summary: log.summary,
              loggedAt: log.loggedAt,
            });
          });

          const groupedList = Object.values(groups);
          setHistoryDays(groupedList);

          // Auto-expand the first day if available
          if (groupedList.length > 0) {
            setExpandedDay(groupedList[0].date);
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeCategory, startDate, endDate]);


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      {/* Header back button */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Link 
          href="/dashboard" 
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Logs History</h1>
          <p className="text-xs text-muted-foreground">Browse, search, and review your historical nutrition logs.</p>
        </div>
      </motion.div>

      {/* Filters Card */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-lg border-primary/10 p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category selection */}
            <div className="space-y-1.5 w-full md:w-auto">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block flex items-center gap-1">
                <Filter className="size-3" /> Filter by Category
              </label>
              <div className="flex flex-wrap gap-1 items-center">
                {["all", "breakfast", "lunch", "dinner", "snack"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`h-8 px-3 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activeCategory === cat
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-muted/30 border-muted hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                
                {(activeCategory !== "all" || startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("all");
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="h-8 px-3 rounded-lg border border-dashed border-red-200 bg-red-500/5 hover:bg-red-500/10 text-red-600 hover:text-red-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Date Range Search */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 md:justify-end">
              <div className="space-y-1.5 flex-1 sm:max-w-[150px]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block flex items-center gap-1">
                  <CalendarIcon className="size-3" /> Start Date
                </label>
                <Input
                  type="date"
                  className="h-8 bg-muted/20 border-muted text-xs"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 flex-1 sm:max-w-[150px]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block flex items-center gap-1">
                  <CalendarIcon className="size-3" /> End Date
                </label>
                <Input
                  type="date"
                  className="h-8 bg-muted/20 border-muted text-xs"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Daily grouped feeds */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <span>Loading history logs...</span>
          </div>
        ) : historyDays.length > 0 ? (
          <AnimatePresence>
            {historyDays.map((day) => {
            // Apply category filter logic to meals
            const mealsFiltered = activeCategory === "all" 
              ? day.meals 
              : day.meals.filter((m: any) => m.category === activeCategory);

            if (mealsFiltered.length === 0) return null;

            const isExpanded = expandedDay === day.date;
            const targetMet = day.totalCal <= day.calorieGoal;

            return (
              <motion.div
                key={day.date}
                variants={itemVariants}
                className="overflow-hidden"
              >
                <Card className="shadow-md border-primary/10 overflow-hidden">
                  
                  {/* Day Header Panel */}
                  <div 
                    onClick={() => toggleExpandDay(day.date)}
                    className="p-4 bg-muted/20 hover:bg-muted/30 border-b transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="space-y-1 text-left">
                      <span className="text-sm font-bold text-foreground block md:inline">{day.date}</span>
                      <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-muted-foreground pt-0.5">
                        <span>P: {day.protein}g</span>
                        <span>C: {day.carbs}g</span>
                        <span>F: {day.fat}g</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 text-right">
                      <div className="text-left md:text-right">
                        <span className="text-sm font-black text-primary block">
                          {day.totalCal} <span className="text-[10px] text-muted-foreground font-normal">/ {day.calorieGoal} kcal</span>
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          targetMet 
                            ? "bg-emerald-500/10 text-emerald-700" 
                            : "bg-amber-500/10 text-amber-700"
                        }`}>
                          {targetMet ? "Calorie Target Met ✓" : "Surplus Intake ⚠️"}
                        </span>
                      </div>
                      <ChevronRight className={`size-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Day expanded list of meals */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-card divide-y divide-muted"
                      >
                        {mealsFiltered.map((meal: any) => {
                          const icon = meal.category === "breakfast" ? "🍳" : meal.category === "lunch" ? "🥗" : meal.category === "dinner" ? "🍛" : "🍌";
                          const isMealExpanded = !!expandedMeals[meal.id];
                          const itemsList = typeof meal.items[0] === 'object'
                            ? meal.items.map((it: any) => `${it.quantity}x ${it.name}`).join(", ")
                            : meal.items.join(", ");
                          
                          const loggedDate = new Date(meal.loggedAt);
                          const todayDate = new Date();
                          const isToday =
                            loggedDate.getFullYear() === todayDate.getFullYear() &&
                            loggedDate.getMonth() === todayDate.getMonth() &&
                            loggedDate.getDate() === todayDate.getDate();

                          return (
                            <div 
                              key={meal.id} 
                              onClick={() => toggleMealExpand(meal.id)}
                              className="p-4 hover:bg-muted/10 transition-colors flex flex-col gap-3 cursor-pointer select-none"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <span className="text-xl px-2.5 py-1.5 rounded-xl bg-muted/40 border border-muted shadow-inner shrink-0">
                                    {icon}
                                  </span>
                                  <div className="space-y-1 min-w-0 flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{meal.category}</h4>
                                      <span className="text-[10px] text-muted-foreground/60">• {meal.time}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground mt-0.5">{meal.name || `${meal.category.toUpperCase()} Log`}</h3>
                                    <p className="text-xs text-foreground/95 truncate font-medium">
                                      {itemsList || "Logged Items"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-muted shrink-0">
                                  <div className="flex gap-4 text-[10px] font-bold text-muted-foreground">
                                    <span className="bg-muted px-2 py-0.5 rounded">P: {Math.round(meal.summary?.protein || meal.protein || 0)}g</span>
                                    <span className="bg-muted px-2 py-0.5 rounded">C: {Math.round(meal.summary?.carbs || meal.carbs || 0)}g</span>
                                    <span className="bg-muted px-2 py-0.5 rounded">F: {Math.round(meal.summary?.fat || meal.fat || 0)}g</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                      +{meal.summary?.calories || meal.cal || 0} kcal
                                    </span>
                                    {isToday && (
                                      <Link
                                        href={`/meals/new?edit=${meal.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs font-bold text-primary hover:underline hover:text-primary/80 flex items-center gap-0.5 cursor-pointer whitespace-nowrap z-10"
                                      >
                                        Edit ✏️
                                      </Link>
                                    )}
                                    <div className="size-7 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/15 flex items-center justify-center transition-all shrink-0">
                                      {isMealExpanded ? (
                                        <ChevronUp className="size-4 text-primary" />
                                      ) : (
                                        <ChevronDown className="size-4 text-primary" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Expandable Breakdown panel */}
                              <AnimatePresence>
                                {isMealExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="overflow-hidden text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="border-t border-primary/10 mt-2 pt-3 space-y-2">
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Logged Items Breakdown</span>
                                      <div className="grid grid-cols-1 gap-2">
                                        {meal.items && typeof meal.items[0] === 'object' ? (
                                          meal.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center text-xs bg-muted/40 p-2.5 rounded-xl border border-primary/5 hover:border-primary/10 transition-all">
                                              <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{item.quantity}x {item.name}</span>
                                                <span className="text-[9px] text-muted-foreground font-medium">{item.servingSize}{item.servingUnit} per serving</span>
                                              </div>
                                              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
                                                <span className="text-primary font-black">{item.calories} kcal</span>
                                                <span className="bg-primary/5 px-2 py-0.5 rounded">P: {Math.round(item.protein)}g</span>
                                                <span className="bg-primary/5 px-2 py-0.5 rounded">C: {Math.round(item.carbs)}g</span>
                                                <span className="bg-primary/5 px-2 py-0.5 rounded">F: {Math.round(item.fat)}g</span>
                                              </div>
                                            </div>
                                          ))
                                        ) : meal.items ? (
                                          meal.items.map((item: string, sIdx: number) => (
                                            <div key={sIdx} className="flex justify-between items-center text-xs bg-muted/40 p-2.5 rounded-xl border border-primary/5">
                                              <span className="font-bold text-foreground">{item}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-xs text-muted-foreground italic">No items logged.</div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
            <CalendarIcon className="size-8 mx-auto text-muted-foreground/30 mb-2" />
            <span>No meal logs found for the selected filters.</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
