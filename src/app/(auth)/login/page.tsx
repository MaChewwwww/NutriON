"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";

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

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
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

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/login", values);
      if (response.data?.requireOtp) {
        toast.info("Security code sent to email.");
        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
      } else {
        toast.success("Logged in successfully!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      if (error.response?.data?.requireOtp) {
        toast.info("Security code sent to email.");
        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
      } else {
        toast.error(error.response?.data?.error || "Failed to login.");
      }
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
        {/* Subtle decorative glowing corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-xl -z-10 pointer-events-none" />
        
        <CardHeader className="space-y-4 pt-8">
          <motion.div variants={itemVariants} className="flex justify-center">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-14 h-14 bg-gradient-to-tr from-primary to-emerald-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-primary/20 cursor-pointer"
            >
              N
            </motion.div>
          </motion.div>
          
          <div className="space-y-2 text-center">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-600 to-emerald-800">
                Continue Journey
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-sm px-4">
                Reconnect to log your meals, review macro splits, and receive AI-guided tips.
              </CardDescription>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormItem>
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

              <motion.div variants={itemVariants} className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-10 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : (
                    <>
                      Sign In <ArrowRight className="size-4 group-hover/button:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 bg-muted/30 border-t py-4 text-center">
          <motion.div variants={itemVariants} className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:text-emerald-700 font-bold transition-colors hover:underline">
              Create Account
            </Link>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium"
          >
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>2FA OTP code will be sent to your email after submission.</span>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
