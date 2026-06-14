import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { notificationApi } from "@/lib/services";
import { NotificationItem } from "@/components/customer/NotificationItem";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  ),
});

function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list(),
    refetchInterval: 30000,
  });
  const list = q.data || [];
  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread} unread • showing latest {list.length}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await notificationApi.markAllRead();
                qc.invalidateQueries({ queryKey: ["notifications"] });
                toast.success("All marked as read");
              } catch (e) {
                toast.error(e.message);
              }
            }}
          >
            <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>
      <div className="mt-6 divide-y rounded-2xl border bg-card">
        {q.isLoading ? (
          <div className="p-10 text-center">
            <LoadingSpinner />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Bell />}
            title="No notifications"
            description="You're all caught up."
          />
        ) : (
          list.map((n) => (
            <NotificationItem
              key={n._id}
              n={n}
              onClick={async () => {
                if (!n.read) {
                  try {
                    await notificationApi.markRead(n._id);
                    qc.invalidateQueries({ queryKey: ["notifications"] });
                  } catch {}
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
