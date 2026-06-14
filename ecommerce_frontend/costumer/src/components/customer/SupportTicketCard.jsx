import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SupportTicketCard({ ticket }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              #{ticket.ticketId || ticket._id?.slice(-6).toUpperCase()}
            </span>
            <Badge variant="secondary">{ticket.issueType || "support"}</Badge>
            <Badge>{ticket.status || "open"}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {ticket.description}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
