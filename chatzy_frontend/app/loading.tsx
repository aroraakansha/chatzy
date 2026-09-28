import { LoadingState } from "@/shared/ui/loading-state";

export default function Loading() {
  return (
    <main className="ambient-shell grid min-h-dvh place-items-center p-6">
      <LoadingState label="Preparing Chatzy" />
    </main>
  );
}
