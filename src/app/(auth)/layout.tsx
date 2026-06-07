"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Heart, Activity, Flame, Sparkles, Plus, Star, Award, ChevronRight } from "lucide-react";

const nutritionalFacts = [
  {
    fact: "Hydration is key: Drinking water before meals can naturally aid digestion and optimize your metabolic rate.",
    category: "Daily Hydration Tip",
    source: "Clinical Nutrition",
  },
  {
    fact: "Power of protein: Incorporating clean protein in your breakfast helps regulate energy levels and keeps you full longer.",
    category: "Macronutrient Focus",
    source: "Dietary Science",
  },
  {
    fact: "Mindful tracking: Logging your daily intake is the single most effective way to build positive eating habits.",
    category: "Mindful Eating",
    source: "Habit Psychology",
  },
];

const mockMeals = [
  { icon: "🍳", name: "Avocado Toast & Eggs", cal: 350, time: "8:30 AM", category: "Breakfast" },
  { icon: "🥗", name: "Grilled Chicken Salad", cal: 480, time: "1:15 PM", category: "Lunch" },
  { icon: "🍌", name: "Whey Protein & Banana", cal: 280, time: "4:00 PM", category: "Snack" },
  { icon: "Salmon 🐟", name: "Baked Salmon & Rice", cal: 540, time: "7:10 PM", category: "Dinner" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [currentFact, setCurrentFact] = useState(0);
  const [activeMealIndex, setActiveMealIndex] = useState(0);

  // Auto-rotate nutritional facts
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % nutritionalFacts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll through mock meals
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMealIndex((prev) => (prev + 1) % mockMeals.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Recalculate macros based on calorie goal
  // 30% Protein (4 kcal/g), 45% Carbs (4 kcal/g), 25% Fat (9 kcal/g)
  const protein = Math.round((calorieGoal * 0.3) / 4);
  const carbs = Math.round((calorieGoal * 0.45) / 4);
  const fat = Math.round((calorieGoal * 0.25) / 9);

  // Daily logged calories from mock meals (simulated breakfast + lunch + snack)
  const caloriesLogged = 1110; 
  const percentage = Math.min(Math.round((caloriesLogged / calorieGoal) * 100), 100);

  // SVG circle calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* Left Pane - Dynamic Brand/Visual Simulator (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-primary/95 via-emerald-800 to-emerald-950 overflow-hidden flex-col justify-between p-12 text-white">
        
        {/* Shifting Mesh Gradients */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1, 1.25, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-15%] w-[700px] h-[700px] bg-lime-500/15 rounded-full blur-3xl mix-blend-screen"
        />
        
        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/25 shadow-lg"
            >
              <Apple className="size-5 text-lime-400" />
            </motion.div>
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text bg-gradient-to-r from-white via-white to-lime-200">
              NutriON
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 text-xs font-semibold text-lime-300">
            <Award className="size-3.5" />
            Student Wellness Hub
          </div>
        </div>

        {/* Center - Interactive Health Calculator Widget */}
        <div className="relative z-10 my-auto py-8 max-w-lg mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Interactive Nutrition Dashboard
            </h2>
            <p className="text-emerald-100 text-sm">
              Adjust the slider below to see how NutriON customized targets fit your personal health goals.
            </p>
          </div>

          {/* Interactive Calculator Simulator Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wider uppercase text-emerald-200">Live Simulator</span>
              <div className="flex items-center gap-1 bg-lime-500/20 text-lime-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                <Flame className="size-3 animate-pulse" /> AI Recommended
              </div>
            </div>

            {/* Circular Progress & Meal Logs Grid */}
            <div className="grid grid-cols-5 gap-6 items-center">
              
              {/* Circular Progress Gauge */}
              <div className="col-span-2 flex flex-col items-center justify-center space-y-2">
                <div className="relative size-28 flex items-center justify-center">
                  {/* Background Circle */}
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-white/10"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Animated Progress Circle */}
                    <motion.circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-lime-400"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset }}
                      transition={{ type: "spring", stiffness: 60, damping: 15 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center z-10">
                    <span className="text-2xl font-black">{caloriesLogged}</span>
                    <span className="block text-[10px] text-emerald-200 font-semibold uppercase">of {calorieGoal} kcal</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-lime-300">{percentage}% Consumed</span>
              </div>

              {/* Live Mock Meal Logs List */}
              <div className="col-span-3 space-y-2 border-l border-white/10 pl-6 h-28 overflow-hidden relative">
                <AnimatePresence mode="popLayout">
                  {mockMeals.slice(0, 3).map((meal, index) => {
                    const isActive = index === activeMealIndex;
                    return (
                      <motion.div
                        key={meal.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ 
                          opacity: isActive ? 1 : 0.4, 
                          scale: isActive ? 1.03 : 0.95,
                          x: 0 
                        }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                          isActive 
                            ? "bg-white/15 border-white/20 shadow-md text-white font-medium" 
                            : "bg-white/5 border-transparent text-emerald-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{meal.icon}</span>
                          <div className="text-left">
                            <span className="block truncate max-w-[100px]">{meal.name}</span>
                            <span className="block text-[9px] opacity-60">{meal.time}</span>
                          </div>
                        </div>
                        <span className="font-bold text-lime-300">+{meal.cal} kcal</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

            </div>

            {/* Macro targets progress bars */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-emerald-200">Protein: <strong className="text-white">{protein}g</strong></span>
                <span className="text-emerald-200">Carbs: <strong className="text-white">{carbs}g</strong></span>
                <span className="text-emerald-200">Fat: <strong className="text-white">{fat}g</strong></span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Protein Bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(protein / 200) * 100}%` }}
                    className="h-full bg-amber-400" 
                  />
                </div>
                {/* Carbs Bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(carbs / 400) * 100}%` }}
                    className="h-full bg-cyan-400" 
                  />
                </div>
                {/* Fat Bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(fat / 120) * 100}%` }}
                    className="h-full bg-rose-400" 
                  />
                </div>
              </div>
            </div>

            {/* Slider control */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="calorie-slider" className="font-semibold text-emerald-200 flex items-center gap-1">
                  <Sparkles className="size-3 text-lime-400" /> Adjust Calorie Goal
                </label>
                <span className="text-lime-300 font-bold">{calorieGoal} kcal</span>
              </div>
              <input
                id="calorie-slider"
                type="range"
                min="1200"
                max="3500"
                step="50"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime-400 outline-none"
              />
              <div className="flex justify-between text-[10px] text-emerald-200/70 font-mono">
                <span>1200 (Deficit)</span>
                <span>2000 (Maintain)</span>
                <span>3500 (Surplus)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Fact Carousel Panel */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <div className="h-24 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFact}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.6 }}
                className="space-y-2 text-left"
              >
                <div className="flex items-center gap-1.5 text-xs text-lime-300 font-bold uppercase tracking-wider">
                  <Sparkles className="size-3.5" />
                  <span>{nutritionalFacts[currentFact].category}</span>
                </div>
                <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                  "{nutritionalFacts[currentFact].fact}"
                </p>
                <div className="text-[10px] text-emerald-200/60 font-semibold uppercase tracking-wider text-right">
                  Source: {nutritionalFacts[currentFact].source}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Right Pane - Auth Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-to-b lg:bg-none from-emerald-950/20 via-background to-background relative overflow-hidden">
        
        {/* Mobile-only background aesthetic enhancement */}
        <div className="lg:hidden absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="lg:hidden absolute bottom-[-100px] left-1/4 w-[300px] h-[300px] bg-lime-500/10 rounded-full blur-3xl -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto relative z-10"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
