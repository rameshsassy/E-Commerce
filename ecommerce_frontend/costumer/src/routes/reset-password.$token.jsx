import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/customer/EmptyState";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/reset-password/$token")({
  head: () => ({ meta: [{ title: "Reset password — Aashansh" }] }),
  component: ResetPage,
});

const rules = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "1 uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "1 number", test: (p) => /\d/.test(p) },
  { label: "1 special char", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function ResetPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = rules.every((r) => r.test(pw)) && pw === confirm;

  return (
    <div className="container-page grid min-h-[calc(100vh-4rem)] place-items-center py-10">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return;
          setBusy(true);
          try {
            await authApi.resetPassword(token, pw);
            toast.success("Password updated");
            navigate({ to: "/auth" });
          } catch (err) {
            toast.error(err.message);
          } finally {
            setBusy(false);
          }
        }}
        className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-card"
      >
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {rules.map((r) => {
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
        <div className="space-y-1.5">
          <Label>Confirm password</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {confirm && pw !== confirm && (
            <p className="text-xs text-destructive">Passwords don't match</p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!valid || busy}
        >
          {busy ? <LoadingSpinner /> : "Update password"}
        </Button>
      </form>
    </div>
  );
}
