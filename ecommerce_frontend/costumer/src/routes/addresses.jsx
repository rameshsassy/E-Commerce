import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { customerApi } from "@/lib/services";
import { AddressCard } from "@/components/customer/AddressCard";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, MapPin } from "lucide-react";

export const Route = createFileRoute("/addresses")({
  head: () => ({ meta: [{ title: "My addresses — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <AddressesPage />
    </ProtectedRoute>
  ),
});

const empty = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function AddressesPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["addresses"],
    queryFn: () => customerApi.listAddresses(),
  });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const reload = () => qc.invalidateQueries({ queryKey: ["addresses"] });
  const openNew = () => {
    setEditing({ ...empty });
    setOpen(true);
  };
  const openEdit = (a) => {
    setEditing(a);
    setOpen(true);
  };

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Addresses</h1>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Add address
        </Button>
      </div>

      <div className="mt-6">
        {q.isLoading ? (
          <LoadingSpinner />
        ) : !q.data || q.data.length === 0 ? (
          <EmptyState
            icon={<MapPin />}
            title="No saved addresses"
            description="Add an address to speed up checkout."
            action={<Button onClick={openNew}>Add your first address</Button>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {q.data.map((a) => (
              <AddressCard
                key={a._id}
                address={a}
                onEdit={() => openEdit(a)}
                onDelete={async () => {
                  try {
                    await customerApi.deleteAddress(a._id);
                    toast.success("Address removed");
                    reload();
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
                onSetDefault={async () => {
                  try {
                    await customerApi.updateAddress(a._id, { isDefault: true });
                    toast.success("Default updated");
                    reload();
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?._id ? "Edit address" : "Add address"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <AddressForm
              initial={editing}
              onClose={() => setOpen(false)}
              onSaved={reload}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddressForm({ initial, onClose, onSaved }) {
  const [a, setA] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setA((p) => ({ ...p, [k]: v }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          if (a._id) await customerApi.updateAddress(a._id, a);
          else await customerApi.addAddress(a);
          toast.success("Saved");
          onSaved();
          onClose();
        } catch (err) {
          toast.error(err.message);
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input
            required
            value={a.fullName || ""}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            required
            value={a.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Address line 1</Label>
        <Input
          required
          value={a.line1 || ""}
          onChange={(e) => set("line1", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Address line 2</Label>
        <Input
          value={a.line2 || ""}
          onChange={(e) => set("line2", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input
            required
            value={a.city || ""}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <Input
            required
            value={a.state || ""}
            onChange={(e) => set("state", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Pincode</Label>
          <Input
            required
            value={a.pincode || ""}
            onChange={(e) => set("pincode", e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label>Set as default</Label>
        <Switch
          checked={!!a.isDefault}
          onCheckedChange={(v) => set("isDefault", v)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? <LoadingSpinner /> : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
