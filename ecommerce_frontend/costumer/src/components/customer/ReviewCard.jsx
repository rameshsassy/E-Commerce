import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Rating({ value, onChange, size = 16 }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          disabled={!onChange}
          className={cn(
            onChange && "transition hover:scale-110",
            !onChange && "cursor-default",
          )}
          aria-label={`${i} stars`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              i <= value
                ? "fill-warning text-warning"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewCard({ review, onToggleHelpful }) {
  const name =
    `${review.user?.firstName || "Customer"} ${review.user?.lastName?.[0] || ""}`.trim();
  return (
    <article className="border-b py-5 last:border-b-0">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="flex items-center gap-1.5">
              <Rating value={review.rating} />{" "}
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </header>
      {review.text && (
        <p className="mt-3 text-sm leading-relaxed">{review.text}</p>
      )}
      {review.images && review.images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.images.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noreferrer">
              <img
                src={src}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            </a>
          ))}
        </div>
      )}
      {onToggleHelpful && (
        <Button
          size="sm"
          variant="ghost"
          className="mt-2 -ml-2"
          onClick={onToggleHelpful}
        >
          <ThumbsUp
            className={cn(
              "mr-1 h-3 w-3",
              review.hasVotedHelpful && "fill-primary text-primary",
            )}
          />
          Helpful {review.helpfulCount ? `(${review.helpfulCount})` : ""}
        </Button>
      )}
    </article>
  );
}
