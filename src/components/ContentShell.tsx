export function ContentShell({
  children,
  width = "5xl",
}: {
  children: React.ReactNode;
  width?: "xl" | "3xl" | "4xl" | "5xl";
}) {
  const max =
    width === "xl"
      ? "max-w-xl"
      : width === "3xl"
        ? "max-w-3xl"
        : width === "4xl"
          ? "max-w-4xl"
          : "max-w-5xl";

  return (
    <main className="min-h-[70vh] bg-white">
      <div className={`mx-auto w-full ${max} px-4 pb-20 pt-12 md:pt-14`}>
        {children}
      </div>
    </main>
  );
}
