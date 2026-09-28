"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authService, type SignupDetails } from "@/features/auth/services/auth-service";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(8, "Phone number is required"),
  password: z.string().min(8, "Use at least 8 characters"),
});

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6 digit OTP"),
});

type Status = { type: "success" | "error"; message: string } | null;
const SIGNUP_CHALLENGE_KEY = "chatzy-signup-challenge";

type SignupChallenge = {
  email: string;
  phone: string;
  contact: string;
  method: "email" | "phone";
};

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setStatus(null);
    try {
      const response = await authService.login(values.email, values.password);
      setSession(response); 
      setStatus({ type: "success", message: "Logged in successfully" });
      
      router.push("/dashboard");
    } catch {
      setStatus({ type: "error", message: "Invalid username or password." });
    }
  }

  return (
    <AuthFormFrame status={status}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          label="Email"
          icon={<Mail size={18} />}
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <FormField
          label="Password"
          type="password"
          icon={<Lock size={18} />}
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Signing in..." : "Login"}
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link className="font-semibold text-[#008069]" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="font-semibold text-[#008069]" href="/signup">
          Create account
        </Link>
      </div>
    </AuthFormFrame>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setStatus(null);
    try {
      const details: SignupDetails = {
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      };

      const response = await authService.startEmailSignupVerification(details);

      // Log to inspect what your backend is actually returning
      console.log("Signup API Response:", response);

      const responseMessage = typeof response === "string" 
        ? response 
        : (response as any)?.message;

      sessionStorage.setItem(SIGNUP_CHALLENGE_KEY, JSON.stringify({
        email: values.email,
        phone: values.phone,
        contact: verificationMethod === "phone" ? values.phone : values.email,
        method: verificationMethod,
      } satisfies SignupChallenge));

      setStatus({
        type: "success",
        message: responseMessage ?? "Verification code sent successfully!",
      });

      // Force the router to push to the OTP page
      router.push("/otp-verification");
    } catch (error: any) {
      console.error("Signup Submission Error:", error.response?.data || error.message);
      setStatus({ 
        type: "error", 
        message: error.response?.data?.message || "Unable to process signup. Please try again." 
      });
    }
  }

  return (
    <AuthFormFrame status={status}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <p className="mb-2 text-sm font-medium text-[#17211c]">Verify via</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setVerificationMethod("email")}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${verificationMethod === "email"
                ? "border-[#008069] bg-[#e7f7f1] text-[#008069]"
                : "border-[#d8ddd7] bg-white text-[#54615c]"}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setVerificationMethod("phone")}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${verificationMethod === "phone"
                ? "border-[#008069] bg-[#e7f7f1] text-[#008069]"
                : "border-[#d8ddd7] bg-white text-[#54615c]"}`}
            >
              Phone
            </button>
          </div>
        </div>
        <FormField label="Full name" icon={<UserRound size={18} />} error={form.formState.errors.name?.message} {...form.register("name")} />
        <FormField label="Email" icon={<Mail size={18} />} error={form.formState.errors.email?.message} {...form.register("email")} />
        <FormField label="Phone" icon={<Phone size={18} />} error={form.formState.errors.phone?.message} {...form.register("phone")} />
        <FormField label="Password" type="password" icon={<Lock size={18} />} error={form.formState.errors.password?.message} {...form.register("password")} />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[#66756f]">
        Already have an account?{" "}
        <Link className="font-semibold text-[#008069]" href="/login">
          Login
        </Link>
      </p>
    </AuthFormFrame>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotSchema>) {
    setStatus(null);
    try {
      const response: { message: string } = await authService.forgotPassword(values.email);
      setStatus({ type: "success", message: response.message });
      router.push("/otp-verification");
    } catch {
      setStatus({ type: "error", message: "Unable to send OTP. Please try again." });
    }
  }

  return (
    <AuthFormFrame status={status}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField label="Email" icon={<Mail size={18} />} error={form.formState.errors.email?.message} {...form.register("email")} />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Sending OTP..." : "Send OTP"}
        </Button>
      </form>
      <Link className="mt-5 block text-center text-sm font-semibold text-[#008069]" href="/login">
        Back to login
      </Link>
    </AuthFormFrame>
  );
}

export function OtpVerificationForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState<Status>(null);
  const [challenge, setChallenge] = useState<SignupChallenge | null>(null);
  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SIGNUP_CHALLENGE_KEY);
      if (stored) {
        setChallenge(JSON.parse(stored) as SignupChallenge);
      }
    } catch {
      sessionStorage.removeItem(SIGNUP_CHALLENGE_KEY);
    }
  }, []);

  async function onSubmit(values: z.infer<typeof otpSchema>) {
    setStatus(null);
    try {
      if (!challenge) {
        setStatus({ type: "error", message: "Your signup verification session has expired. Please sign up again." });
        return;
      }

      // Email and phone come from the verified signup step; the user enters only the code.
      const response = await authService.verifyOtp(challenge.email, challenge.phone, values.otp);
      setSession(response);

      sessionStorage.removeItem(SIGNUP_CHALLENGE_KEY);
      setStatus({ type: "success", message: "Verified successfully!" });
      
      // New accounts continue to Contacts, where they can grant Google Contacts access.
      router.push("/contacts");
    } catch {
      setStatus({ type: "error", message: "Invalid OTP. Please try again." });
    }
  }

  return (
    <AuthFormFrame status={status}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          label={challenge?.method === "phone" ? "Phone verification code" : "Email verification code"}
          inputMode="numeric"
          maxLength={6}
          icon={<ShieldCheck size={18} />}
          error={form.formState.errors.otp?.message}
          {...form.register("otp")}
        />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[#66756f]">
        {challenge ? `We sent a code to ${challenge.contact}.` : "Return to sign up to request a new code."}
      </p>
      <p className="mt-2 text-center text-xs text-[#66756f]">
        Enter the 6-digit code from your selected verification method.
      </p>
    </AuthFormFrame>
  );
}

function AuthFormFrame({
  children,
  status,
}: {
  children: React.ReactNode;
  status: Status;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#d8ddd7]">
      {status ? (
        <div
          className={
            status.type === "success"
              ? "mb-4 rounded-2xl bg-[#e7f7f1] px-4 py-3 text-sm font-medium text-[#008069]"
              : "mb-4 rounded-2xl bg-[#fee4e2] px-4 py-3 text-sm font-medium text-[#b42318]"
          }
        >
          {status.message}
        </div>
      ) : null}
      {children}
    </div>
  );
}
