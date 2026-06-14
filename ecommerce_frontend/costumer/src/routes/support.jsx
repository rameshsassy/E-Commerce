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

function SupportPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["support"],
    queryFn: () => supportApi.list(),
  });
  const [issueType, setIssueType] = useState("order");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("issueType", issueType);
      fd.append("description", description);
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
                  <SelectItem value="order">Order issue</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                hidden
                onChange={(e) =>
                  setFiles(Array.from(e.target.files || []).slice(0, 3))
                }
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
