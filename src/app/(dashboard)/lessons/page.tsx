"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { 
  BookOpen, 
  Clock, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  Award, 
  Heart 
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

// Static mock lessons catalog
const mockLessons = [
  {
    id: 1,
    title: "Macronutrients 101: The Energy Blocks",
    category: "Basics",
    description: "Understand the differences between Protein, Carbohydrates, and Fats, and why your body requires them.",
    readTime: 5,
    icon: "🌾"
  },
  {
    id: 2,
    title: "Understanding Daily Calorie Budgets",
    category: "Weight Control",
    description: "Learn how Mifflin-St Jeor evaluates your Basal Metabolic Rate (BMR) and how to manage deficit limits.",
    readTime: 8,
    icon: "🔥"
  },
  {
    id: 3,
    title: "Mindful Eating & Healthy Portioning",
    category: "Habits",
    description: "How to log food mindfully and understand serving size estimates without feeling food guilt.",
    readTime: 6,
    icon: "🥑"
  },
  {
    id: 4,
    title: "Hydration Guidelines for Health & Focus",
    category: "Basics",
    description: "The science of optimal water intake and how staying hydrated boosts metabolism and prevents false hunger.",
    readTime: 4,
    icon: "💧"
  }
];

export default function LessonsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch("/api/lessons");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setLessons(data);
        }
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || lesson.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl font-black tracking-tight">Nutrition Lessons</h1>
          <p className="text-xs text-muted-foreground">Practical, bite-sized health guides written by registered dietitians.</p>
        </div>
      </motion.div>

      {/* Filter and Search Panel */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-lg border-primary/10 p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category toggle */}
            <div className="flex gap-1 flex-wrap">
              {["all", "basics", "weight control", "habits"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 px-3 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-muted/30 border-muted hover:bg-muted/50 text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                className="pl-10 h-9 bg-muted/20 border-muted text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Lessons grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-xs text-muted-foreground space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <span>Loading articles...</span>
          </div>
        ) : filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <motion.div
              key={lesson.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              className="h-full"
            >
              <Card className="shadow-md border-primary/10 hover:border-primary/25 h-full flex flex-col justify-between overflow-hidden relative">
                
                <CardHeader className="space-y-2 pt-6 px-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                      {lesson.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold inline-flex items-center gap-1">
                      <Clock className="size-3" /> {lesson.readingTimeMinutes} min read
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 pt-1">
                    <BookOpen className="size-4 text-primary shrink-0" /> {lesson.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-6 pb-6 text-xs text-muted-foreground leading-relaxed">
                  {lesson.description}
                </CardContent>

                <CardContent className="border-t bg-muted/20 py-3 px-6 flex justify-end">
                  <Link 
                    href={`/lessons/${lesson.id}`}
                    className="text-xs font-bold text-primary hover:text-emerald-700 inline-flex items-center gap-1"
                  >
                    Read Lesson <ChevronRight className="size-3" />
                  </Link>
                </CardContent>

              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-xs text-muted-foreground space-y-1">
            <BookOpen className="size-8 mx-auto text-muted-foreground/40 mb-2" />
            <span>No lessons found matching your filters.</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
