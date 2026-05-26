"use client";

import { useEffect, useState } from "react";

export function LastUpdateBadge() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/prices/last-update")
      .then((r) => r.json())
      .then((d) => setLastUpdate(d.last_update ?? null))
      .catch(() => {});
  }, []);

  if (!lastUpdate) return null;

  const date = new Date(lastUpdate);
  const formatted = date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <span className="mono text-[11px] text-muted-foreground/60">
      prices last updated at: {formatted}
    </span>
  );
}