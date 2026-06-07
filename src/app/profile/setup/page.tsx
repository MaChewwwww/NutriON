"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Calendar, 
  Scale, 
  Ruler, 
  Flame, 
  Award, 
  Activity, 
  ShieldCheck,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 150 : -150,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 18,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 150 : -150,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            router.push("/dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      } finally {
        setIsLoadingSession(false);
      }
    };
    checkSession();
  }, [router]);

  // Setup state fields
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    heightCm: "",
    weightKg: "",
    activityLevel: "moderate",
    targetGoal: "maintenance",
  });

  // Handle inputs
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Basic validations per step
    if (step === 1) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 12) {
        toast.error("You must be at least 12 years old.");
        return;
      }
      if (ageNum > 100) {
        toast.error("Please enter a valid age (maximum is 100).");
        return;
      }
    }
    if (step === 2) {
      const height = parseFloat(formData.heightCm);
      const weight = parseFloat(formData.weightKg);
      if (isNaN(height) || height < 100 || height > 250) {
        toast.error("Please enter a valid height between 100 cm and 250 cm.");
        return;
      }
      if (isNaN(weight) || weight < 30 || weight > 300) {
        toast.error("Please enter a valid weight between 30 kg and 300 kg.");
        return;
      }
    }

    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handlePrev = async () => {
    if (step === 1) {
      try {
        setIsSubmitting(true);
        await fetch("/api/auth/logout", { method: "POST" });
        toast.success("Logged out successfully");
        router.push("/login");
      } catch (err) {
        toast.error("Failed to log out");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  // Mifflin-St Jeor Calculations
  const weight = parseFloat(formData.weightKg) || 70;
  const height = parseFloat(formData.heightCm) || 170;
  const age = parseInt(formData.age) || 20;
  const gender = formData.gender;

  // Base BMR
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "male") {
    bmr += 5;
  } else if (gender === "female") {
    bmr -= 161;
  } else {
    bmr -= 80; // Default offset for other genders
  }

  // TDEE activity factor multiplier
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const factor = activityFactors[formData.activityLevel] || 1.55;
  const tdee = bmr * factor;

  // Goal calorie target calculation
  let calorieGoal = Math.round(tdee);
  if (formData.targetGoal === "weight_loss") {
    calorieGoal = Math.max(1200, Math.round(tdee - 500));
  } else if (formData.targetGoal === "weight_gain") {
    calorieGoal = Math.round(tdee + 300);
  }

  // Macro splits: 30% Protein, 45% Carbs, 25% Fats
  const proteinTarget = Math.round((calorieGoal * 0.3) / 4);
  const carbsTarget = Math.round((calorieGoal * 0.45) / 4);
  const fatTarget = Math.round((calorieGoal * 0.25) / 9);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          heightCm: parseFloat(formData.heightCm),
          weightKg: parseFloat(formData.weightKg),
          activityLevel: formData.activityLevel,
          targetGoal: formData.targetGoal,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/login");
          return;
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      toast.success("Health profile setup complete!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-emerald-950/20 via-background to-background relative overflow-hidden">
      
      {/* Background Glowing Spheres */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-200px] left-1/4 w-[400px] h-[400px] bg-lime-500/5 rounded-full blur-3xl -z-10" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-xl mx-auto"
      >
        <Card className="w-full shadow-2xl border-primary/10 backdrop-blur-xl bg-card/85 overflow-hidden">
          
          {/* Header & Step progress */}
          <CardHeader className="space-y-2 pt-6">
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <span>NutriON Setup</span>
              <span>Step {step} of 4</span>
            </div>
            
            {/* Step progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardHeader>

          {/* Animating Wizard Steps */}
          <CardContent className="min-h-[300px] flex flex-col justify-center py-4 relative overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full space-y-6"
              >
                {/* STEP 1: Basic Demographics */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <CardTitle className="text-2xl font-black">Tell us about yourself</CardTitle>
                      <CardDescription>We use these factors to calculate your base metabolic rate.</CardDescription>
                    </div>
                    
                    <div className="space-y-4 max-w-sm mx-auto pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Your Age (Years)</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="20" 
                            className="pl-10 h-11"
                            value={formData.age}
                            onChange={(e) => handleInputChange("age", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["male", "female", "other"].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => handleInputChange("gender", g)}
                              className={`h-11 rounded-lg border text-sm font-semibold capitalize transition-all cursor-pointer ${
                                formData.gender === g
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "bg-muted/30 border-muted hover:bg-muted/50"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Physical Metrics */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <CardTitle className="text-2xl font-black">Height & Weight</CardTitle>
                      <CardDescription>Enter your exact metrics so we can measure energy expenditure.</CardDescription>
                    </div>
                    
                    <div className="space-y-4 max-w-sm mx-auto pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Height (Centimeters)</label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="175" 
                            className="pl-10 h-11"
                            value={formData.heightCm}
                            onChange={(e) => handleInputChange("heightCm", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Weight (Kilograms)</label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="65" 
                            className="pl-10 h-11"
                            value={formData.weightKg}
                            onChange={(e) => handleInputChange("weightKg", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Lifestyle & Goals */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <CardTitle className="text-2xl font-black">Lifestyle & Goals</CardTitle>
                      <CardDescription>Select your active scale and core health destination.</CardDescription>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Activity Level Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Activity Level</label>
                        <div className="space-y-2">
                          {[
                            { val: "sedentary", label: "Sedentary (Little/no exercise)" },
                            { val: "light", label: "Lightly Active (1-3 days/wk)" },
                            { val: "moderate", label: "Moderately Active (3-5 days/wk)" },
                            { val: "active", label: "Very Active (6-7 days/wk)" },
                          ].map((a) => (
                            <button
                              key={a.val}
                              type="button"
                              onClick={() => handleInputChange("activityLevel", a.val)}
                              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                formData.activityLevel === a.val
                                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                                  : "bg-muted/20 border-transparent hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Goal Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Target Goal</label>
                        <div className="space-y-2">
                          {[
                            { val: "weight_loss", label: "Weight Loss (Deficit)", desc: "Trim body fat gradually" },
                            { val: "maintenance", label: "Maintenance (TDEE)", desc: "Maintain current weight & tone" },
                            { val: "weight_gain", label: "Weight Gain (Surplus)", desc: "Build lean muscle mass" },
                          ].map((g) => (
                            <button
                              key={g.val}
                              type="button"
                              onClick={() => handleInputChange("targetGoal", g.val)}
                              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                formData.targetGoal === g.val
                                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                                  : "bg-muted/20 border-transparent hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              <span className="block text-xs font-bold">{g.label}</span>
                              <span className="block text-[10px] opacity-75 font-medium">{g.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Summary & Target calculation preview */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <CardTitle className="text-2xl font-black">Your Personalized Plan</CardTitle>
                      <CardDescription>Based on Mifflin-St Jeor formula, here is your daily nutritional budget.</CardDescription>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-6 items-center bg-muted/20 rounded-2xl p-4 border border-muted">
                      {/* Calorie Ring Gauge */}
                      <div className="col-span-2 flex flex-col items-center justify-center space-y-1">
                        <div className="relative size-24 flex items-center justify-center bg-primary/5 rounded-full border border-primary/10">
                          <Flame className="absolute size-14 text-primary/10" />
                          <div className="text-center z-10">
                            <span className="text-2xl font-black text-primary">{calorieGoal}</span>
                            <span className="block text-[9px] text-muted-foreground font-bold uppercase">Kcal / Day</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Target Budget</span>
                      </div>

                      {/* Macro target details list */}
                      <div className="col-span-3 space-y-3 pl-4 border-l border-muted">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>Protein</span>
                            <span className="text-amber-500">{proteinTarget}g (30%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: "30%" }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>Carbohydrates</span>
                            <span className="text-cyan-600">{carbsTarget}g (45%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: "45%" }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>Fats</span>
                            <span className="text-rose-600">{fatTarget}g (25%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400" style={{ width: "25%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-xl border border-primary/10 p-3 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 max-w-sm mx-auto">
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      <span>These goals can be updated anytime inside your profile settings.</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          {/* Navigation Controls */}
          <CardFooter className="flex justify-between bg-muted/30 border-t py-4">
            <Button
              variant={step === 1 ? "default" : "outline"}
              onClick={handlePrev}
              disabled={isSubmitting}
              className={`h-10 cursor-pointer ${
                step === 1 
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:text-white" 
                  : ""
              }`}
            >
              {step === 1 ? (
                <>
                  <LogOut className="size-4 mr-1.5" /> Logout
                </>
              ) : (
                <>
                  <ArrowLeft className="size-4 mr-1.5" /> Back
                </>
              )}
            </Button>

            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="h-10 bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer"
              >
                Continue <ArrowRight className="size-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-600/95 text-white font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? "Finalizing Setup..." : (
                  <>
                    Complete Setup <Sparkles className="size-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
