import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { customerApi, userApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/customer/EmptyState";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My profile — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

function ProfilePage() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const cust = useQuery({
    queryKey: ["customer-profile"],
    queryFn: () => customerApi.getProfile(),
  });
  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState({
    emailNewProductAlerts: false,
    marketingEmails: false,
  });

  useEffect(() => {
    if (user)
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        mobile: user.mobile || "",
      });
  }, [user]);
  useEffect(() => {
    if (cust.data)
      setPrefs({
        emailNewProductAlerts: !!cust.data.emailNewProductAlerts,
        marketingEmails: !!cust.data.marketingEmails,
      });
  }, [cust.data]);

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">My profile</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Personal information</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await userApi.updateProfile(form);
                await refresh();
                toast.success("Profile updated");
              } catch (err) {
                toast.error(err.message);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            {user?.customerId && (
              <div className="space-y-1.5">
                <Label>Customer ID</Label>
                <Input value={user.customerId} disabled />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? <LoadingSpinner /> : "Save changes"}
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Change password</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await userApi.updatePassword(pw);
                toast.success("Password updated");
                setPw({ currentPassword: "", newPassword: "" });
              } catch (err) {
                toast.error(err.message);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-4 space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input
                type="password"
                value={pw.currentPassword}
                onChange={(e) =>
                  setPw({ ...pw, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? <LoadingSpinner /> : "Update password"}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Email preferences</h2>
          <div className="mt-3 space-y-3">
            <PrefRow
              label="New product alerts"
              desc="Get notified about new arrivals"
              checked={prefs.emailNewProductAlerts}
              onChange={async (v) => {
                setPrefs((p) => ({ ...p, emailNewProductAlerts: v }));
                try {
                  await customerApi.updateEmailPrefs({
                    emailNewProductAlerts: v,
                  });
                  qc.invalidateQueries({ queryKey: ["customer-profile"] });
                } catch (e) {
                  toast.error(e.message);
                }
              }}
            />
            <PrefRow
              label="Marketing emails"
              desc="Offers, discounts and updates"
              checked={prefs.marketingEmails}
              onChange={async (v) => {
                setPrefs((p) => ({ ...p, marketingEmails: v }));
                try {
                  await customerApi.updateEmailPrefs({ marketingEmails: v });
                } catch (e) {
                  toast.error(e.message);
                }
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PrefRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <div className="font-medium">{label}</div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
