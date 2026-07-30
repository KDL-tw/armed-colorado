"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function TrackPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    void fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
    });
  }, [pathname]);

  return null;
}
