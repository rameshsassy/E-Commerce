import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function NotificationItem({ n, onClick }) {
  const body = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl p-3 transition hover:bg-muted/60",
        !n.read && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          n.read ? "bg-muted-foreground/30" : "bg-primary",
        )}
      />
      <div className="min-w-0 flex-1">
        {n.title && <div className="text-sm font-medium">{n.title}</div>}
        <p className="text-sm text-muted-foreground">{n.message}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(n.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
  if (n.link)
    return (
      <Link to={n.link} onClick={onClick}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {body}
    </button>
  );
}
