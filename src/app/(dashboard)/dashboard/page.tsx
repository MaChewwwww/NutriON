"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Apple, 
  BookOpen, 
  Settings, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  RotateCw
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatBoldText } from "@/lib/utils";

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
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 14 
    } 
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [aiTips, setAiTips] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTipsLoading, setIsTipsLoading] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [needsGeneration, setNeedsGeneration] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Record<number, boolean>>({});

  const toggleMealExpand = (mealId: number) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealId]: !prev[mealId],
    }));
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // 1. Fetch Profile
        const profileRes = await fetch("/api/profile");
        if (profileRes.status === 401) {
          router.push("/login");
          return;
        }
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.profile) {
            setProfile(profileData.profile);
          } else {
            router.push("/profile/setup");
            return;
          }
        } else {
          router.push("/profile/setup");
          return;
        }

        // 2. Fetch Today's Logs
        const todayStr = new Date().toISOString().split("T")[0];
        const historyRes = await fetch(`/api/history?startDate=${todayStr}&endDate=${todayStr}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setTodayMeals(historyData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, [router]);

  // Fetch AI tips
  useEffect(() => {
    const loadAiTips = async () => {
      try {
        const res = await fetch("/api/coach/tips");
        if (res.ok) {
          const data = await res.json();
          setAiTips(data.tips || "");
          setHasUpdate(data.hasUpdate || false);
          setNeedsGeneration(data.needsGeneration || false);
        }
      } catch (err) {
        console.error("Failed to load AI tips:", err);
      } finally {
        setIsTipsLoading(false);
      }
    };
    loadAiTips();
  }, []);

  const handleRegenerateTips = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/coach/tips?regenerate=true");
      if (res.ok) {
        const data = await res.json();
        setAiTips(data.tips || "");
        setHasUpdate(false);
        setNeedsGeneration(false);
        toast.success("AI coaching tips updated!");
      } else {
        toast.error("Failed to update coaching tips");
      }
    } catch (err) {
      console.error("Failed to regenerate AI tips:", err);
      toast.error("Failed to update coaching tips");
    } finally {
      setIsRegenerating(false);
    }
  };

  const calorieGoal = profile?.calorieTarget || 2000;
  const proteinGoal = profile?.proteinTarget || 150;
  const carbsGoal = profile?.carbsTarget || 225;
  const fatGoal = profile?.fatTarget || 55;

  const caloriesConsumed = todayMeals.reduce((acc, m) => acc + (m.summary?.calories || 0), 0);
  const proteinConsumed = todayMeals.reduce((acc, m) => acc + (m.summary?.protein || 0), 0);
  const carbsConsumed = todayMeals.reduce((acc, m) => acc + (m.summary?.carbs || 0), 0);
  const fatConsumed = todayMeals.reduce((acc, m) => acc + (m.summary?.fat || 0), 0);

  const percentage = Math.min(Math.round((caloriesConsumed / calorieGoal) * 100), 100);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Sort today's meals chronologically
  const sortedMeals = [...todayMeals].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1400px] mx-auto pb-12 px-4 md:px-0"
    >
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <motion.div variants={itemVariants} className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Fuel Your Day</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Here's your nutritional overview for today, <span className="font-bold text-primary">{todayFormatted}</span>
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex gap-2">
          <Link href="/meals/new?category=breakfast" className={buttonVariants({ className: "bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer shadow-sm rounded-xl h-10 px-4 flex items-center gap-1.5" })}>
            <Plus className="size-4" /> Log New Meal
          </Link>
          <Link href="/settings" className={buttonVariants({ variant: "outline", className: "cursor-pointer rounded-xl h-10 px-4" })}>
            <Settings className="size-4 mr-1.5" /> Edit Profile
          </Link>
        </motion.div>
      </div>

      {/* Main Grid: 2 Columns (Left: Stats + Timeline, Right: AI Coach + Shortcuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Demographics Stats & Meal Feed */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Daily Energy & Macros Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Circular Calorie Ring */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full shadow-md border-primary/10 flex flex-col justify-between p-6 bg-card/40 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Calorie Intake</span>
                  <div className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    <Flame className="size-3" /> Active Budget
                  </div>
                </div>

                <div className="flex items-center justify-center py-5 gap-6">
                  <div className="relative size-28 flex items-center justify-center bg-primary/5 rounded-full border border-primary/10">
                    <svg className="absolute size-28 -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        className="stroke-muted"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r={radius}
                        className="stroke-primary"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="text-2xl font-black text-foreground block leading-none">{caloriesConsumed}</span>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase block mt-1">kcal</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground font-semibold block">Target: <strong className="text-foreground">{calorieGoal} kcal</strong></span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block ${
                      caloriesConsumed > calorieGoal ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {percentage}% Consumed
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      {Math.max(0, calorieGoal - caloriesConsumed)} calories remaining
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Card 2: Macronutrients Split */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full shadow-md border-primary/10 flex flex-col justify-between p-6 bg-card/40 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Macronutrients Split</span>
                  <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full font-bold uppercase text-muted-foreground">Daily Targets</span>
                </div>

                <div className="space-y-3 py-3">
                  {/* Protein Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 bg-amber-400 rounded-full" /> Protein
                      </span>
                      <span className="text-muted-foreground">{proteinConsumed}g <span className="font-normal text-[10px]">of {proteinGoal}g</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(proteinConsumed / proteinGoal) * 100}%` }}
                        className="h-full bg-amber-400 rounded-full" 
                      />
                    </div>
                  </div>

                  {/* Carbs Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 bg-cyan-400 rounded-full" /> Carbohydrates
                      </span>
                      <span className="text-muted-foreground">{carbsConsumed}g <span className="font-normal text-[10px]">of {carbsGoal}g</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(carbsConsumed / carbsGoal) * 100}%` }}
                        className="h-full bg-cyan-400 rounded-full" 
                      />
                    </div>
                  </div>

                  {/* Fats Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 bg-rose-400 rounded-full" /> Fats
                      </span>
                      <span className="text-muted-foreground">{fatConsumed}g <span className="font-normal text-[10px]">of {fatGoal}g</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(fatConsumed / fatGoal) * 100}%` }}
                        className="h-full bg-rose-400 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

          </div>

          {/* Today's Meal Timeline Feed */}
          <div className="space-y-4 pt-2">
            <motion.div variants={itemVariants} className="flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight">Today's Timeline Logs</h2>
              <Link href="/history" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View Past History <ChevronRight className="size-3" />
              </Link>
            </motion.div>

            {sortedMeals.length > 0 ? (
              <div className="relative pl-6 border-l border-primary/20 space-y-6 py-2">
                {sortedMeals.map((meal, idx) => {
                  const icon = meal.category === "breakfast" ? "🍳" : meal.category === "lunch" ? "🥗" : meal.category === "dinner" ? "🍛" : "🍌";
                  const mealTime = new Date(meal.loggedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const itemsList = meal.items.map((it: any) => `${it.quantity}x ${it.name}`).join(", ");
                  const isExpanded = !!expandedMeals[meal.id];

                  return (
                    <motion.div
                      key={meal.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => toggleMealExpand(meal.id)}
                      className="relative bg-card/75 border border-muted hover:border-primary/20 backdrop-blur-xl rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-3 cursor-pointer select-none"
                    >
                      {/* Timeline Node Connector */}
                      <span className="absolute -left-[31px] top-8 -translate-y-1/2 size-4 rounded-full bg-primary border-4 border-background shadow-sm" />

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shadow-inner border border-primary/10 shrink-0">
                            {icon}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold capitalize leading-none flex items-center gap-1.5">
                                {meal.category}
                              </h3>
                              <span className="text-[10px] text-muted-foreground font-semibold">{mealTime}</span>
                            </div>
                            <p className="text-xs text-foreground/95 truncate font-medium">{itemsList || "Logged Items"}</p>
                            {meal.notes && (
                              <p className="text-[10px] text-muted-foreground italic truncate">Note: "{meal.notes}"</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-muted shrink-0">
                          <div className="flex gap-4 text-[10px] font-bold text-muted-foreground">
                            <span className="bg-muted px-2 py-0.5 rounded">P: {Math.round(meal.summary.protein)}g</span>
                            <span className="bg-muted px-2 py-0.5 rounded">C: {Math.round(meal.summary.carbs)}g</span>
                            <span className="bg-muted px-2 py-0.5 rounded">F: {Math.round(meal.summary.fat)}g</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                              +{meal.summary.calories} kcal
                            </span>
                            <Link
                              href={`/meals/new?edit=${meal.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-bold text-primary hover:underline hover:text-primary/80 flex items-center gap-0.5 cursor-pointer whitespace-nowrap z-10"
                            >
                              Edit ✏️
                            </Link>
                            <div className="size-7 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/15 flex items-center justify-center transition-all shrink-0">
                              {isExpanded ? (
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
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-primary/10 mt-2.5 pt-3.5 space-y-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Logged Items Breakdown</span>
                              <div className="grid grid-cols-1 gap-2">
                                {meal.items.map((item: any) => (
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
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="bg-card/45 border-2 border-dashed border-muted rounded-2xl p-8 flex flex-col items-center justify-center text-center py-12"
              >
                <Apple className="size-10 text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold">No meals logged today yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Fuel your body and hit your daily macros by logging your first meal using the shortcuts panel.
                </p>
              </motion.div>
            )}

          </div>

        </div>

        {/* Right Column (1/3 width) - AI Coach Guidance & Quick Action Shortcuts */}
        <div className="space-y-6">
          
          {/* Card 3: AI recommendations (Bento size: 1 col) */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-primary/10 flex flex-col justify-between bg-primary/5 p-6 border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-xl -z-10" />
              
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="size-3.5 animate-pulse text-primary" /> AI Coach Guidance
                </span>
                {hasUpdate && !isTipsLoading && !needsGeneration && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegenerateTips();
                    }}
                    disabled={isRegenerating}
                    className="relative text-[10px] md:text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 dark:text-amber-950 dark:bg-amber-400 dark:hover:bg-amber-300 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0 shadow-lg shadow-amber-500/20 active:scale-95 duration-150"
                  >
                    <span className="relative flex size-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 dark:bg-amber-950 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-amber-900 dark:bg-amber-950"></span>
                    </span>
                    {isRegenerating ? (
                      <>
                        <RotateCw className="size-3.5 stroke-[3] animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Tips</span>
                        <RotateCw className="size-3.5 stroke-[3]" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="py-4 my-auto space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {isTipsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-muted-foreground text-xs">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>AI Coach is analyzing...</span>
                  </div>
                ) : needsGeneration ? (
                  <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
                    <Sparkles className="size-10 text-primary/45" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">AI Tips Ready</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">Generate your initial student health coaching tips.</p>
                    </div>
                    <Button 
                      onClick={handleRegenerateTips} 
                      disabled={isRegenerating}
                      className="bg-primary hover:bg-primary/95 text-white font-bold h-8 cursor-pointer text-xs px-4 flex items-center gap-1.5 shadow-sm"
                    >
                      {isRegenerating ? (
                        <>
                          <span className="animate-spin size-2.5 border-t-2 border-white rounded-full inline-block" /> Generating...
                        </>
                      ) : (
                        <>
                          Generate Tips ✨
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs md:text-sm leading-relaxed text-foreground/90 space-y-1.5 select-text relative">
                    {isRegenerating && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                      </div>
                    )}
                    {aiTips.split("\n").map((line, idx) => {
                      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
                        const cleanLine = line.trim().replace(/^[\*\-]\s+/, "");
                        return (
                          <p key={idx} className="pl-3.5 relative">
                            <span className="absolute left-0 text-primary">•</span> {formatBoldText(cleanLine)}
                          </p>
                        );
                      }
                      if (line.includes("Disclaimer")) {
                        return (
                          <p key={idx} className="text-[10px] md:text-xs text-muted-foreground/85 mt-3 font-normal leading-normal italic font-semibold">
                            {line.replace(/[\*\_]/g, "")}
                          </p>
                        );
                      }
                      return <p key={idx}>{formatBoldText(line)}</p>;
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-primary/10 pt-3 flex items-center justify-between text-xs font-bold text-primary">
                <Link href="/lessons" className="hover:underline inline-flex items-center gap-1 cursor-pointer">
                  <BookOpen className="size-3.5" /> Read Nutrition Lessons <ChevronRight className="size-3" />
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* Log Shortcuts Card Panel */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border-primary/10 p-6 bg-card/40 backdrop-blur-xl space-y-4">
              <div className="border-b border-primary/10 pb-3 flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Log Meal Shortcuts</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Quick Adds</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { cat: "breakfast", label: "Breakfast", icon: "🍳" },
                  { cat: "lunch", label: "Lunch", icon: "🥗" },
                  { cat: "dinner", label: "Dinner", icon: "🍛" },
                  { cat: "snack", label: "Snack", icon: "🍌" }
                ].map((s) => {
                  const logsCount = todayMeals.filter(m => m.category === s.cat).length;
                  return (
                    <Link
                      key={s.cat}
                      href={`/meals/new?category=${s.cat}`}
                      className="group p-3 rounded-xl border border-muted hover:border-primary/25 bg-muted/10 hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-1 right-1 text-[8px] font-bold text-primary/70">
                        {logsCount > 0 && `Logged (${logsCount}x)`}
                      </div>
                      <span className="text-2xl group-hover:scale-110 transition-transform block mb-1">{s.icon}</span>
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{s.label}</span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </motion.div>

        </div>

      </div>

    </motion.div>
  );
}
