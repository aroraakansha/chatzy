export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#d8ddd7] bg-white/80 px-4 py-3 text-sm font-medium text-[#56645e]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#00a884] border-t-transparent" />
      {label}
    </div>
  );
}
