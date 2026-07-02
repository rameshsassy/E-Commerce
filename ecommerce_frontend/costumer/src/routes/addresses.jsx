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
  firstName: "",
  lastName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Allahabad",
  "Prayagraj",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Guwahati",
  "Chandigarh",
  "Solapur",
  "Hubli",
  "Mysore",
  "Tiruchirappalli",
  "Bareilly",
  "Aligarh",
  "Moradabad",
  "Jalandhar",
  "Bhubaneswar",
  "Salem",
  "Warangal",
  "Guntur",
  "Bhiwandi",
  "Saharanpur",
  "Gorakhpur",
  "Bikaner",
  "Amravati",
  "Noida",
  "Jamshedpur",
  "Bhilai",
  "Cuttack",
  "Firozabad",
  "Kochi",
  "Bhavnagar",
  "Dehradun",
  "Durgapur",
  "Asansol",
  "Nellore",
  "Udaipur",
  "Mangalore",
  "Belagavi",
  "Thiruvananthapuram",
  "Tiruppur",
  "Kozhikode",
  "Akola",
  "Bokaro",
  "Bellary",
  "Patiala",
  "Agartala",
  "Bhagalpur",
  "Muzaffarpur",
  "Panaji",
  "Shimla",
  "Gangtok",
  "Imphal",
  "Shillong",
  "Aizawl",
  "Kohima",
  "Itanagar",
].sort();

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
        <Button onClick={openNew} className="bg-[#ffd401] hover:bg-[#ffd401]/90 text-black font-semibold">
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
            action={<Button onClick={openNew} className="bg-[#ffd401] hover:bg-[#ffd401]/90 text-black font-semibold">Add your first address</Button>}
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
  const [a, setA] = useState(() => {
    const init = { ...initial };
    if (!init.firstName && init.fullName) {
      const parts = init.fullName.trim().split(/\s+/);
      init.firstName = parts[0] || "";
      init.lastName = parts.slice(1).join(" ") || "";
    }
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const set = (k, v) => setA((p) => ({ ...p, [k]: v }));

  const validatePhoneNumber = (val) => {
    if (!val) return "Phone number is required";
    const cleanPhone = val.replace(/[\s\-()]/g, '');
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return "Please enter a valid phone number (10-15 digits)";
    }
    return "";
  };

  const adjustHeight = (el) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const statesList = [...new Set([...INDIAN_STATES, a.state])].filter(Boolean);
  const citiesList = [...new Set([...INDIAN_CITIES, a.city])].filter(Boolean);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const err = validatePhoneNumber(a.phone);
        if (err) {
          setPhoneError(err);
          return;
        }
        setBusy(true);
        const payload = {
          ...a,
          fullName: `${a.firstName || ""} ${a.lastName || ""}`.trim()
        };
        try {
          if (a._id) await customerApi.updateAddress(a._id, payload);
          else await customerApi.addAddress(payload);
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
          <Label>First name</Label>
          <Input
            required
            value={a.firstName || ""}
            onChange={(e) => set("firstName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input
            required
            value={a.lastName || ""}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          required
          type="tel"
          value={a.phone || ""}
          onChange={(e) => {
            const val = e.target.value;
            set("phone", val);
            if (phoneError) {
              setPhoneError(validatePhoneNumber(val));
            }
          }}
          onBlur={(e) => setPhoneError(validatePhoneNumber(e.target.value))}
          className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {phoneError && (
          <p className="text-xs text-red-500">{phoneError}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Address line 1</Label>
        <textarea
          required
          ref={adjustHeight}
          value={a.line1 || ""}
          onChange={(e) => {
            set("line1", e.target.value);
            adjustHeight(e.target);
          }}
          className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
          rows={1}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Address line 2</Label>
        <textarea
          ref={adjustHeight}
          value={a.line2 || ""}
          onChange={(e) => {
            set("line2", e.target.value);
            adjustHeight(e.target);
          }}
          className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden"
          rows={1}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>City</Label>
          <select
            required
            value={a.city || ""}
            onChange={(e) => set("city", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>Select City</option>
            {citiesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <select
            required
            value={a.state || ""}
            onChange={(e) => set("state", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>Select State</option>
            {statesList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
        <Button
          type="submit"
          disabled={busy}
          className="flex-1 bg-[#ffd401] hover:bg-[#ffd401]/90 text-black font-semibold"
        >
          {busy ? <LoadingSpinner /> : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
