import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/services";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { LoadingSpinner } from "@/components/customer/EmptyState";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => ({
    redirect: s.redirect || "/",
    token: s.token || "",
    adminToken: s.adminToken || "",
  }),
  head: () => ({
    meta: [{ title: "Sign in or create an account — Aashansh" }],
  }),
  component: AuthPage,
});

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "1 uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "1 number", test: (p) => /\d/.test(p) },
  { label: "1 special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const passwordSchema = z
  .string()
  .refine(
    (p) => passwordRules.every((r) => r.test(p)),
    "Password does not meet all requirements",
  );
const signupSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  mobile: z.string().min(10, "Enter a valid mobile"),
  password: passwordSchema,
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function AuthPage() {
  const { login, register, refresh } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState("login");

  useEffect(() => {
    const checkImpersonation = async () => {
      if (search.token && search.adminToken) {
        try {
          localStorage.setItem("token", search.token);
          localStorage.setItem("adminToken", search.adminToken);
          await refresh();
          toast.success("Impersonation session started successfully");
          navigate({ to: "/" });
        } catch (err) {
          toast.error("Impersonation failed: could not load profile");
          localStorage.removeItem("token");
          localStorage.removeItem("adminToken");
        }
      }
    };
    checkImpersonation();
  }, [search.token, search.adminToken, refresh, navigate]);

  const after = () => navigate({ to: search.redirect });

  return (
    <div className="container-page grid min-h-[calc(100vh-4rem)] items-center py-10 md:grid-cols-2 md:gap-12">
      <div className="hidden md:block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-elegant">
          <div className="absolute inset-0 gradient-primary" />
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
          />
          <div className="absolute bottom-0 p-8 text-primary-foreground">
            <h2 className="font-display text-3xl font-bold">
              Welcome to Aashansh
            </h2>
            <p className="mt-2 text-sm opacity-90">
              Sign in to track orders, save favorites, and get personalized
              recommendations.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        {mode === "forgot" ? (
          <ForgotForm onBack={() => setMode("login")} />
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm
                onForgot={() => setMode("forgot")}
                onSuccess={() => {
                  toast.success("Welcome back!");
                  after();
                }}
                login={login}
              />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm
                onSuccess={() => {
                  toast.success("Account created!");
                  after();
                }}
                register={register}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function LoginForm({ login, onForgot, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: async (v) => {
      const r = loginSchema.safeParse(v);
      return r.success
        ? { values: r.data, errors: {} }
        : {
            values: {},
            errors: r.error.issues.reduce(
              (a, i) => ({ ...a, [i.path[0]]: { message: i.message } }),
              {},
            ),
          };
    },
  });
  const [showPw, setShowPw] = useState(false);

  return (
    <form
      onSubmit={handleSubmit(async (v) => {
        try {
          await login(v.email, v.password);
          onSuccess();
        } catch (e) {
          toast.error(e.message || "Login failed");
        }
      })}
      className="mt-6 space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-primary hover:underline"
          >
            Forgot?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPw ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? <LoadingSpinner /> : "Sign in"}
      </Button>
    </form>
  );
}

function SignupForm({ register: regUser, onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: async (v) => {
      const r = signupSchema.safeParse(v);
      return r.success
        ? { values: r.data, errors: {} }
        : {
            values: {},
            errors: r.error.issues.reduce(
              (a, i) => ({ ...a, [i.path[0]]: { message: i.message } }),
              {},
            ),
          };
    },
  });
  const pw = watch("password") || "";

  return (
    <form
      onSubmit={handleSubmit(async (v) => {
        try {
          await regUser(v);
          onSuccess();
        } catch (e) {
          toast.error(e.message || "Signup failed");
        }
      })}
      className="mt-6 space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First name</Label>
          <Input {...register("firstName")} />
          {errors.firstName && (
            <p className="text-xs text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input {...register("lastName")} />
          {errors.lastName && (
            <p className="text-xs text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Mobile</Label>
        <Input type="tel" {...register("mobile")} />
        {errors.mobile && (
          <p className="text-xs text-destructive">{errors.mobile.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Password</Label>
        <Input type="password" {...register("password")} />
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {passwordRules.map((r) => {
            const ok = r.test(pw);
            return (
              <div
                key={r.label}
                className={`flex items-center gap-1 text-[11px] ${ok ? "text-success" : "text-muted-foreground"}`}
              >
                {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {r.label}
              </div>
            );
          })}
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? <LoadingSpinner /> : "Create account"}
      </Button>
    </form>
  );
}

function ForgotForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await authApi.forgotPassword(email);
          toast.success("Reset link sent if account exists");
          onBack();
        } catch (err) {
          toast.error(err.message);
        } finally {
          setBusy(false);
        }
      }}
      className="mt-6 space-y-4"
    >
      <h2 className="text-xl font-semibold">Reset your password</h2>
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send a reset link.
      </p>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <LoadingSpinner /> : "Send reset link"}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Back to sign in
      </Button>
    </form>
  );
}
