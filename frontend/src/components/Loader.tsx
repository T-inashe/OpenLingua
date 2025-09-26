import { Loader2 } from "lucide-react";

interface LoaderProps {
  message?: string;
}

export default function LoaderOverlay({ message = "Loading..." }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-6 py-5 text-white shadow-xl">
        <Loader2 size={32} className="animate-spin text-cyan-300" />
        <span className="text-sm font-medium tracking-wide text-white/90">{message}</span>
      </div>
    </div>
  );
}
