"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles, Check, X, ShieldAlert, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/lib/api";

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

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

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch password field to compute strength
  const passwordVal = form.watch("password") || "";

  // Evaluate criteria
  const hasMinLength = passwordVal.length >= 8;
  const hasNumber = /\d/.test(passwordVal);
  const hasSpecial = /[@$!%*?&#]/.test(passwordVal);
  const hasUpper = /[A-Z]/.test(passwordVal);

  const criteria = [
    { label: "8+ characters", met: hasMinLength },
    { label: "One number", met: hasNumber },
    { label: "One special character (@$!%*?&#)", met: hasSpecial },
    { label: "One uppercase letter", met: hasUpper },
  ];

  const strengthScore = criteria.filter((c) => c.met).length;

  const getStrengthConfig = () => {
    switch (strengthScore) {
      case 0:
        return { label: "Empty", color: "bg-muted", text: "text-muted-foreground" };
      case 1:
        return { label: "Weak", color: "bg-destructive", text: "text-destructive" };
      case 2:
        return { label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { label: "Good", color: "bg-lime-500", text: "text-lime-600" };
      case 4:
        return { label: "Strong", color: "bg-emerald-600", text: "text-emerald-600" };
      default:
        return { label: "Empty", color: "bg-muted", text: "text-muted-foreground" };
    }
  };

  const strengthConfig = getStrengthConfig();

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      await api.post("/api/auth/register", values);
      toast.success("Account created! Verifying email...");
      router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to register.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <Card className="w-full max-w-md shadow-2xl border-primary/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-xl -z-10 pointer-events-none" />
        
        <CardHeader className="space-y-3 pt-6">
          {/* Animated benefits banner */}
          <motion.div 
            variants={itemVariants} 
            className="flex items-center gap-1.5 self-center mx-auto bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-primary/20 text-primary-foreground font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-300"
          >
            <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400 animate-pulse" /> 
            Free AI Meal Logs Included
          </motion.div>

          <div className="space-y-1.5 text-center">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-600 to-emerald-800">
                Start Wellness
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-sm px-2">
                Join NutriON to unlock instant meal analysis, progress track maps, and tailored recipes.
              </CardDescription>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                          <Input 
                            placeholder="name@student.edu" 
                            className="pl-10 h-10 bg-muted/20 border-muted focus-visible:bg-transparent transition-all"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pl-10 pr-10 h-10 bg-muted/20 border-muted focus-visible:bg-transparent transition-all"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Password Strength Meter */}
              {passwordVal.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }} 
                  className="space-y-2 py-1 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className={`font-bold ${strengthConfig.text}`}>{strengthConfig.label}</span>
                  </div>
                  {/* Visual Strength Bars */}
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((bar) => (
                      <div 
                        key={bar} 
                        className={`h-full rounded-full transition-all duration-300 ${
                          strengthScore >= bar ? strengthConfig.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  {/* Checks list */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                    {criteria.map((c, i) => (
                      <div key={i} className="flex items-center gap-1">
                        {c.met ? (
                          <Check className="size-3 text-emerald-600 stroke-[3]" />
                        ) : (
                          <X className="size-3 text-muted-foreground/45 stroke-[3]" />
                        )}
                        <span className={c.met ? "text-foreground/90 font-medium" : ""}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pl-10 pr-10 h-10 bg-muted/20 border-muted focus-visible:bg-transparent transition-all"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-10 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : (
                    <>
                      Register Account <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 bg-muted/30 border-t py-4 text-center">
          <motion.div variants={itemVariants} className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-emerald-700 font-bold transition-colors hover:underline">
              Sign In
            </Link>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium"
          >
            <ShieldAlert className="size-3.5 text-emerald-600" />
            <span>We verify your email instantly. No spam, ever.</span>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
