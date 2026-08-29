"use client";
import { useEffect } from "react";

export function BillTableClient() {
  useEffect(() => {
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement | null;
    const yearFilter = document.getElementById(
      "year-filter"
    ) as HTMLSelectElement | null;
    const sections = document.querySelectorAll<HTMLElement>(
      "#bill-tables-container section[data-year]"
    );

    function applyFilter() {
      const q = (searchInput?.value || "").trim().toLowerCase();
      const year = yearFilter?.value || "";

      sections.forEach((section) => {
        const sectionYear = section.getAttribute("data-year") || "";
        const yearMatch = !year || sectionYear === year;
        if (!yearMatch) {
          section.style.display = "none";
          return;
        }
        let anyVisible = false;
        section
          .querySelectorAll<HTMLTableRowElement>("tbody tr[data-search]")
          .forEach((row: HTMLTableRowElement) => {
            const haystack = row.getAttribute("data-search") || "";
            const visible = !q || haystack.includes(q);
            row.style.display = visible ? "" : "none";
            if (visible) anyVisible = true;
          });
        section.style.display = anyVisible ? "" : "none";
      });
    }

    searchInput?.addEventListener("input", applyFilter);
    yearFilter?.addEventListener("change", applyFilter);
    return () => {
      searchInput?.removeEventListener("input", applyFilter);
      yearFilter?.removeEventListener("change", applyFilter);
    };
  }, []);

  return null;
}
