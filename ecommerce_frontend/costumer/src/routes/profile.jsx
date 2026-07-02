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

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        let quality = 0.8;
        let base64 = "";

        const attemptCompression = () => {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          base64 = canvas.toDataURL("image/jpeg", quality);
          
          const sizeInBytes = (base64.length * 3) / 4;

          if (sizeInBytes <= 100 * 1024) {
            resolve(base64);
          } else if (quality > 0.1) {
            quality -= 0.15;
            attemptCompression();
          } else if (width > 150) {
            width = Math.round(width * 0.7);
            height = Math.round(height * 0.7);
            quality = 0.7;
            attemptCompression();
          } else {
            resolve(base64);
          }
        };

        attemptCompression();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function ProfilePage() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const cust = useQuery({
    queryKey: ["customer-profile"],
    queryFn: () => customerApi.getProfile(),
  });
  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "", profilePicture: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState({
    emailNewProductAlerts: true,
    marketingEmails: true,
  });

  useEffect(() => {
    if (user)
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        mobile: user.mobile || "",
        profilePicture: user.profilePicture || "",
      });
  }, [user]);
  useEffect(() => {
    if (cust.data?.user)
      setPrefs({
        emailNewProductAlerts: cust.data.user.emailNewProductAlerts !== false,
        marketingEmails: cust.data.user.marketingEmailsEnabled !== false,
      });
  }, [cust.data]);

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">My profile</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Personal information</h2>
          
          <div className="flex flex-col items-center gap-3 my-4">
            <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border border-border flex items-center justify-center bg-muted">
              {form.profilePicture ? (
                <img
                  src={form.profilePicture}
                  alt="DP"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground select-none">
                  {form.firstName ? form.firstName[0].toUpperCase() : "U"}
                </span>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-medium transition-opacity cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 mb-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
                Change DP
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 30 * 1024 * 1024) {
                      toast.error("File size must be less than 30 MB");
                      return;
                    }
                    const toastId = toast.loading("Processing image...");
                    try {
                      const compressed = await compressImage(file);
                      setForm((prev) => ({ ...prev, profilePicture: compressed }));
                      toast.success("Image processed! Save changes to update.", { id: toastId });
                    } catch (err) {
                      toast.error("Failed to process image: " + err.message, { id: toastId });
                    }
                  }}
                />
              </label>
            </div>
            {form.profilePicture && (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, profilePicture: "" }))}
                className="text-xs text-destructive hover:underline cursor-pointer"
              >
                Remove photo
              </button>
            )}
          </div>

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
            <Button type="submit" disabled={busy} className="bg-[#ffd401] text-black hover:bg-[#ffd401]/90 font-medium">
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
            <Button type="submit" disabled={busy} className="bg-[#ffd401] text-black hover:bg-[#ffd401]/90 font-medium">
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
                  await customerApi.updateEmailPrefs({ marketingEmailsEnabled: v });
                  qc.invalidateQueries({ queryKey: ["customer-profile"] });
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
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-yellow-500"
      />
    </div>
  );
}
