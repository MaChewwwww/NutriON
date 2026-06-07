"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ShieldCheck, RefreshCw, MailOpen, ArrowRight } from "lucide-react";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/lib/api";

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits." }),
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

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
    },
  });

  const hasError = !!form.formState.errors.otp;

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Handle Resend OTP
  async function handleResend() {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    try {
      await api.post("/api/auth/resend-otp", { email: initialEmail });
      toast.success("A fresh security code has been sent!");
      setTimeLeft(60); // Reset timer to 60s
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  }

  // Handle OTP Submission
  async function onSubmit(values: z.infer<typeof otpSchema>) {
    setIsLoading(true);
    try {
      await api.post("/api/auth/verify-otp", values);
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Failed to verify OTP.";
      toast.error(errMsg);
      form.setError("otp", { type: "manual", message: errMsg });
    } finally {
      setIsLoading(false);
    }
  }

  // Check if someone loaded verify-otp directly
  if (!initialEmail) {
    return (
      <Card className="w-full shadow-2xl border-destructive/20 bg-card/85 backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold text-destructive">Missing Email</CardTitle>
          <CardDescription>
            No email address was provided for OTP verification. Please sign in or register first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/login")} className="w-full cursor-pointer">
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
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
        
        <CardHeader className="space-y-4 pt-8 text-center">
          {/* Animated SVG Envelope Mailer */}
          <motion.div 
            variants={itemVariants} 
            className="flex justify-center"
          >
            <div className="relative w-20 h-20 bg-emerald-500/5 rounded-full border border-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
              <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-pulse" />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <MailOpen className="size-10 text-emerald-600/80" />
              </motion.div>
            </div>
          </motion.div>

          <div className="space-y-2">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-600 to-emerald-800">
                Security Code
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-sm px-4">
                We sent a secure One-Time Password to
                <span className="block font-mono text-xs text-primary bg-primary/5 border border-primary/10 rounded-full py-1.5 px-3 mt-2 max-w-xs mx-auto truncate select-all" title={initialEmail}>
                  {initialEmail}
                </span>
                <span className="block mt-2 text-[11px]">Enter the 6-digit code below to authorize.</span>
              </CardDescription>
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Hidden Email Binding */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Segmented OTP Input */}
              <motion.div variants={itemVariants} className="flex justify-center">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center gap-2">
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <InputOTPGroup>
                              <InputOTPSlot index={0} className={`size-12 sm:size-14 text-xl font-bold bg-background !rounded-xl shadow-sm border ${hasError ? "border-destructive text-destructive bg-destructive/5" : "border-input"}`} />
                            </InputOTPGroup>
                            <InputOTPGroup>
                              <InputOTPSlot index={1} className={`size-12 sm:size-14 text-xl font-bold bg-background !rounded-xl shadow-sm border ${hasError ? "border-destructive text-destructive bg-destructive/5" : "border-input"}`} />
                            </InputOTPGroup>
                            <InputOTPGroup>
                              <InputOTPSlot index={2} className={`size-12 sm:size-14 text-xl font-bold bg-background !rounded-xl shadow-sm border ${hasError ? "border-destructive text-destructive bg-destructive/5" : "border-input"}`} />
                            </InputOTPGroup>
                            <div className="w-3 h-0.5 bg-muted-foreground/30 rounded-full mx-1" />
                            <InputOTPGroup>
                              <InputOTPSlot index={3} className={`size-12 sm:size-14 text-xl font-bold bg-background !rounded-xl shadow-sm border ${hasError ? "border-destructive text-destructive bg-destructive/5" : "border-input"}`} />
                            </InputOTPGroup>
                            <InputOTPGroup>
                              <InputOTPSlot index={4} className={`size-12 sm:size-14 text-xl font-bold bg-background !rounded-xl shadow-sm border ${hasError ? "border-destructive text-destructive bg-destructive/5" : "border-input"}`} />
                            </InputOTPGroup>
                            <InputOTPGroup>
                              <InputOTPSlot index={5} className={`size-12 sm:size-14 text-xl font-bold bg-background !rounded-xl shadow-sm border ${hasError ? "border-destructive text-destructive bg-destructive/5" : "border-input"}`} />
                            </InputOTPGroup>
                          </div>
                        </InputOTP>
                      </FormControl>
                      <FormMessage className="text-xs font-medium text-center" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary via-emerald-600 to-emerald-700 hover:from-primary/95 hover:to-emerald-700/95 text-white font-bold transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5" 
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : (
                    <>
                      Confirm Code <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 bg-muted/30 border-t py-4 text-center">
          {/* Active Resend Countdown */}
          <motion.div variants={itemVariants} className="text-xs text-muted-foreground">
            {timeLeft > 0 ? (
              <span>Resend code in <strong className="text-foreground font-mono">{timeLeft}s</strong></span>
            ) : (
              <button 
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-primary hover:text-emerald-700 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RefreshCw className={`size-3 ${isResending ? "animate-spin" : ""}`} /> 
                {isResending ? "Resending..." : "Resend Security Code"}
              </button>
            )}
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium"
          >
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Authorized access session only. Codes expire in 10 mins.</span>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 font-semibold text-muted-foreground">Initializing Verification Form...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
