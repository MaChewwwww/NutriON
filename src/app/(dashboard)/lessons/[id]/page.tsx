"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ArrowLeft, Clock, BookOpen, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatBoldText } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

function renderMarkdown(content: string) {
  if (!content) return null;

  const lines = content.split("\n");
  return (
    <div className="space-y-4">
      {lines.map((line, idx) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-xl font-black text-foreground border-b pb-1.5 mt-6 first:mt-0">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-sm font-bold text-foreground mt-4">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-xs font-bold text-foreground mt-3">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("* ") || line.startsWith("- ")) {
          return (
            <li key={idx} className="text-xs text-muted-foreground list-disc ml-5 leading-relaxed">
              {formatBoldText(line.slice(2))}
            </li>
          );
        }
        if (line.trim() === "") {
          return null;
        }
        return (
          <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
            {formatBoldText(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [lesson, setLesson] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await fetch(`/api/lessons/${id}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          throw new Error("Lesson not found");
        }
        const data = await res.json();
        setLesson(data);
      } catch (err: any) {
        setError(err.message || "Failed to load lesson");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-12 text-center py-12">
        <BookOpen className="size-12 mx-auto text-muted-foreground/30 mb-2" />
        <h2 className="text-xl font-bold text-foreground">Lesson Not Found</h2>
        <p className="text-xs text-muted-foreground">{error || "This article is not available."}</p>
        <Link href="/lessons" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="size-4 mr-1.5" /> Back to Lessons
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-2xl mx-auto pb-12"
    >
      {/* Back to list link */}
      <div className="flex items-center gap-3">
        <Link href="/lessons" className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 uppercase tracking-wider">
            {lesson.category}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold inline-flex items-center gap-1 ml-3">
            <Clock className="size-3" /> {lesson.readingTimeMinutes} min read
          </span>
        </div>
      </div>

      {/* Main Article Container */}
      <Card className="shadow-2xl border-primary/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-xl -z-10" />

        <CardHeader className="space-y-3 pt-8 pb-4 border-b">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <BookOpen className="size-6 text-primary shrink-0" /> {lesson.title}
          </CardTitle>
          <CardDescription>
            Written by the NutriON Editorial Team • Verified Educational Content
          </CardDescription>
        </CardHeader>

        <CardContent className="py-6">
          {renderMarkdown(lesson.content)}
        </CardContent>
      </Card>
    </motion.div>
  );
}
