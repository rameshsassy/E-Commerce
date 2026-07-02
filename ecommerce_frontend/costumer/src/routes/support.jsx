import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { supportApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupportTicketCard } from "@/components/customer/SupportTicketCard";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { Card } from "@/components/ui/card";
import { Upload, Headphones } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <SupportPage />
    </ProtectedRoute>
  ),
});

const base64ToFile = (base64, filename) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const compressImageToFile = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size <= 100 * 1024) {
      resolve(file);
      return;
    }

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
            try {
              const compressedFile = base64ToFile(base64, file.name);
              resolve(compressedFile);
            } catch (err) {
              reject(err);
            }
          } else if (quality > 0.1) {
            quality -= 0.15;
            attemptCompression();
          } else if (width > 150) {
            width = Math.round(width * 0.7);
            height = Math.round(height * 0.7);
            quality = 0.7;
            attemptCompression();
          } else {
            try {
              const compressedFile = base64ToFile(base64, file.name);
              resolve(compressedFile);
            } catch (err) {
              reject(err);
            }
          }
        };

        attemptCompression();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function SupportPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["support"],
    queryFn: () => supportApi.list(),
  });
  const [issueType, setIssueType] = useState("Payments");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 3);
    if (selectedFiles.length === 0) return;

    const toastId = toast.loading("Processing attachments...");
    const validFiles = [];

    try {
      for (const file of selectedFiles) {
        if (!file.type.startsWith("image/")) {
          toast.error(`"${file.name}" is not an image. Only image files are allowed.`, { id: toastId });
          return;
        }
        if (file.size >= 3 * 1024 * 1024) {
          toast.error(`"${file.name}" is 3MB or larger. Only images under 3MB are allowed.`, { id: toastId });
          return;
        }
        const compressed = await compressImageToFile(file);
        validFiles.push(compressed);
      }
      setFiles(validFiles);
      toast.success("Attachments processed successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to process attachments: " + err.message, { id: toastId });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("issueType", issueType);
      fd.append("subject", issueType);
      fd.append("description", description);
      fd.append("message", description);
      files.slice(0, 3).forEach((f) => fd.append("attachments", f));
      await supportApi.create(fd);
      toast.success("Ticket submitted");
      setDescription("");
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["support"] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">Support</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <h2 className="font-semibold">My tickets</h2>
          {q.isLoading ? (
            <LoadingSpinner />
          ) : !q.data || q.data.length === 0 ? (
            <EmptyState
              icon={<Headphones />}
              title="No tickets yet"
              description="Raise a new ticket and we'll get back to you."
            />
          ) : (
            q.data.map((t) => <SupportTicketCard key={t._id} ticket={t} />)
          )}
        </div>
        <Card className="p-5 lg:sticky lg:top-20 h-fit">
          <h2 className="text-lg font-semibold">New ticket</h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Issue type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Payments">Payments</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Returns, replacements, and refunds">Returns, replacements, and refunds</SelectItem>
                  <SelectItem value="Product issues">Product issues</SelectItem>
                  <SelectItem value="Account and login">Account and login</SelectItem>
                  <SelectItem value="Website/app issues">Website/app issues</SelectItem>
                  <SelectItem value="Coupons and pricing">Coupons and pricing</SelectItem>
                  <SelectItem value="Support and policy questions">Support and policy questions</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="h-4 w-4" /> Attach up to 3 files
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </label>
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {files.length} file(s) selected
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <LoadingSpinner /> : "Submit ticket"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
