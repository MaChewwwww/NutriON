"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  User, 
  Flame, 
  Sparkles, 
  Save, 
  Clock 
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

export default function SettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Form State
  const [profile, setProfile] = useState({
    age: "21",
    gender: "male",
    heightCm: "180",
    weightKg: "75",
    activityLevel: "moderate",
    targetGoal: "weight_loss",
  });

  // Reminders Schedule State
  const [reminders, setReminders] = useState({
    breakfastEnabled: true,
    breakfastTime: "08:00",
    lunchEnabled: true,
    lunchTime: "13:00",
    dinnerEnabled: true,
    dinnerTime: "19:00",
  });

  // Fetch current settings on load
  useEffect(() => {
    const fetchSettings = async () => {
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
          if (data.profile) {
            setProfile({
              age: data.profile.age.toString(),
              gender: data.profile.gender,
              heightCm: data.profile.heightCm.toString(),
              weightKg: data.profile.weightKg.toString(),
              activityLevel: data.profile.activityLevel,
              targetGoal: data.profile.targetGoal,
            });
          }
          if (data.reminders) {
            setReminders({
              breakfastEnabled: data.reminders.breakfastEnabled,
              breakfastTime: data.reminders.breakfastTime.substring(0, 5),
              lunchEnabled: data.reminders.lunchEnabled,
              lunchTime: data.reminders.lunchTime.substring(0, 5),
              dinnerEnabled: data.reminders.dinnerEnabled,
              dinnerTime: data.reminders.dinnerTime.substring(0, 5),
            });
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleProfileChange = (field: string, val: string) => {
    setProfile(prev => ({ ...prev, [field]: val }));
  };

  const handleReminderToggle = (field: "breakfastEnabled" | "lunchEnabled" | "dinnerEnabled") => {
    setReminders(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleReminderTimeChange = (field: "breakfastTime" | "lunchTime" | "dinnerTime", val: string) => {
    setReminders(prev => ({ ...prev, [field]: val }));
  };

  // Mifflin-St Jeor calculations
  const weight = parseFloat(profile.weightKg) || 70;
  const height = parseFloat(profile.heightCm) || 170;
  const age = parseInt(profile.age) || 20;
  const gender = profile.gender;

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "male") {
    bmr += 5;
  } else if (gender === "female") {
    bmr -= 161;
  } else {
    bmr -= 80;
  }

  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const factor = activityFactors[profile.activityLevel] || 1.55;
  const tdee = bmr * factor;

  let calorieGoal = Math.round(tdee);
  if (profile.targetGoal === "weight_loss") {
    calorieGoal = Math.max(1200, Math.round(tdee - 500));
  } else if (profile.targetGoal === "weight_gain") {
    calorieGoal = Math.round(tdee + 300);
  }

  const proteinTarget = Math.round((calorieGoal * 0.3) / 4);
  const carbsTarget = Math.round((calorieGoal * 0.45) / 4);
  const fatTarget = Math.round((calorieGoal * 0.25) / 9);

  const handleSave = async () => {
    const ageNum = parseInt(profile.age);
    if (isNaN(ageNum) || ageNum < 12) {
      toast.error("You must be at least 12 years old.");
      return;
    }
    if (ageNum > 100) {
      toast.error("Please enter a valid age (maximum is 100).");
      return;
    }
    const height = parseFloat(profile.heightCm);
    const weight = parseFloat(profile.weightKg);
    if (isNaN(height) || height < 100 || height > 250) {
      toast.error("Please enter a valid height between 100 cm and 250 cm.");
      return;
    }
    if (isNaN(weight) || weight < 30 || weight > 300) {
      toast.error("Please enter a valid weight between 30 kg and 300 kg.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            age: parseInt(profile.age),
            gender: profile.gender,
            heightCm: parseFloat(profile.heightCm),
            weightKg: parseFloat(profile.weightKg),
            activityLevel: profile.activityLevel,
            targetGoal: profile.targetGoal,
          },
          reminders,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/login");
          return;
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
          <h1 className="text-2xl font-black tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Adjust your health metrics, goals, and reminder triggers.</p>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left: Demographics Form & Target Output (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Profile Form */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="border-b pb-4 px-5">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <User className="size-4 text-primary" /> Profile Metrics
                </CardTitle>
                <CardDescription>Keep metrics accurate to receive best calorie targets.</CardDescription>
              </CardHeader>
              
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Age (Years)</label>
                    <Input 
                      type="number" 
                      value={profile.age} 
                      onChange={(e) => handleProfileChange("age", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Gender</label>
                    <select 
                      value={profile.gender}
                      onChange={(e) => handleProfileChange("gender", e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="male" className="bg-card">Male</option>
                      <option value="female" className="bg-card">Female</option>
                      <option value="other" className="bg-card">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Height (cm)</label>
                    <Input 
                      type="number" 
                      value={profile.heightCm} 
                      onChange={(e) => handleProfileChange("heightCm", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weight (kg)</label>
                    <Input 
                      type="number" 
                      value={profile.weightKg} 
                      onChange={(e) => handleProfileChange("weightKg", e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Activity Index</label>
                    <select 
                      value={profile.activityLevel}
                      onChange={(e) => handleProfileChange("activityLevel", e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="sedentary" className="bg-card">Sedentary (no gym)</option>
                      <option value="light" className="bg-card">Lightly Active (1-3 d/wk)</option>
                      <option value="moderate" className="bg-card">Moderately Active (3-5 d/wk)</option>
                      <option value="active" className="bg-card">Very Active (6-7 d/wk)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Goal</label>
                    <select 
                      value={profile.targetGoal}
                      onChange={(e) => handleProfileChange("targetGoal", e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="weight_loss" className="bg-card">Weight Loss (Deficit)</option>
                      <option value="maintenance" className="bg-card">Maintenance (TDEE)</option>
                      <option value="weight_gain" className="bg-card">Weight Gain (Surplus)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Dynamic calculations card */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-primary/10 bg-primary/5 border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-xl -z-10" />
              
              <CardContent className="p-5 flex items-center justify-between gap-6">
                {/* Calorie Goal Circle */}
                <div className="flex flex-col items-center justify-center space-y-1 shrink-0">
                  <div className="relative size-20 flex items-center justify-center bg-white border border-primary/25 rounded-full shadow-inner">
                    <div className="text-center">
                      <span className="text-xl font-black text-primary">{calorieGoal}</span>
                      <span className="block text-[8px] text-muted-foreground font-black uppercase">Kcal</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Target Goal</span>
                </div>

                {/* Macros details */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>Protein</span>
                      <span className="text-amber-500">{proteinTarget}g</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: "30%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>Carbohydrates</span>
                      <span className="text-cyan-600">{carbsTarget}g</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: "45%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>Fats</span>
                      <span className="text-rose-600">{fatTarget}g</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400" style={{ width: "25%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Right: Reminders & Save triggers (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Reminders Card */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="border-b pb-4 px-5">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Bell className="size-4 text-primary" /> Reminders Alerts
                </CardTitle>
                <CardDescription>Setup alerts so you log meals consistently.</CardDescription>
              </CardHeader>
              
              <CardContent className="p-5 space-y-4">
                {/* Breakfast Reminder */}
                <div className="flex items-center justify-between pb-3 border-b border-muted">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Breakfast Alarm</span>
                    <span className="text-[10px] text-muted-foreground block">Notification schedule for breakfast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="time" 
                      className="w-20 h-7 text-xs bg-muted/20 border-muted"
                      value={reminders.breakfastTime}
                      onChange={(e) => handleReminderTimeChange("breakfastTime", e.target.value)}
                      disabled={!reminders.breakfastEnabled}
                    />
                    <button
                      type="button"
                      onClick={() => handleReminderToggle("breakfastEnabled")}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        reminders.breakfastEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div className={`size-4 rounded-full bg-white transition-transform ${
                        reminders.breakfastEnabled ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Lunch Reminder */}
                <div className="flex items-center justify-between pb-3 border-b border-muted">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Lunch Alarm</span>
                    <span className="text-[10px] text-muted-foreground block">Notification schedule for lunch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="time" 
                      className="w-20 h-7 text-xs bg-muted/20 border-muted"
                      value={reminders.lunchTime}
                      onChange={(e) => handleReminderTimeChange("lunchTime", e.target.value)}
                      disabled={!reminders.lunchEnabled}
                    />
                    <button
                      type="button"
                      onClick={() => handleReminderToggle("lunchEnabled")}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        reminders.lunchEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div className={`size-4 rounded-full bg-white transition-transform ${
                        reminders.lunchEnabled ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Dinner Reminder */}
                <div className="flex items-center justify-between pb-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Dinner Alarm</span>
                    <span className="text-[10px] text-muted-foreground block">Notification schedule for dinner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="time" 
                      className="w-20 h-7 text-xs bg-muted/20 border-muted"
                      value={reminders.dinnerTime}
                      onChange={(e) => handleReminderTimeChange("dinnerTime", e.target.value)}
                      disabled={!reminders.dinnerEnabled}
                    />
                    <button
                      type="button"
                      onClick={() => handleReminderToggle("dinnerEnabled")}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        reminders.dinnerEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div className={`size-4 rounded-full bg-white transition-transform ${
                        reminders.dinnerEnabled ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-muted/30 border-t p-5 rounded-b-xl">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-10 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-600/95 text-white font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="size-4" /> {isSaving ? "Saving Settings..." : "Save All Changes"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}
