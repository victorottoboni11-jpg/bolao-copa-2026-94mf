interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
}

export function Toast({ message, type = "info" }: ToastProps) {
  const colorClass =
    type === "success"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
      : type === "error"
      ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
      : "bg-sky-500/10 border-sky-500/30 text-sky-200";

  return (
    <div className={`fixed left-1/2 top-6 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-3xl border p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] ${colorClass}`}>
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}
