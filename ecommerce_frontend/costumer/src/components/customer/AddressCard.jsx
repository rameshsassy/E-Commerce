import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Pencil, Trash2, Star } from "lucide-react";

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  selected,
  onSelect,
}) {
  return (
    <Card
      className={`p-4 transition ${selected ? "ring-2 ring-primary" : ""} ${onSelect ? "cursor-pointer hover:bg-muted/40" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {address.fullName || address.label || "Address"}
            </span>
            {address.isDefault && (
              <Badge variant="secondary" className="text-[10px]">
                <Star className="mr-1 h-3 w-3" />
                Default
              </Badge>
            )}
          </div>
          {address.phone && (
            <p className="text-sm text-muted-foreground">{address.phone}</p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.state} {address.pincode}
          </p>
        </div>
      </div>
      {(onEdit || onDelete || onSetDefault) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {onSetDefault && !address.isDefault && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
            >
              Set default
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
