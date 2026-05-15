import Link from "next/link";
import { Plus } from "lucide-react";

export default function FloatingActionButton() {
  return (
    <Link
      href="/create-post"
      className="fixed bottom-28 right-4 z-50 w-13 h-13 rounded-full flex items-center justify-center"
      style={{
        width: "52px",
        height: "52px",
        background: "linear-gradient(135deg, #D52B1E 0%, #a81e14 100%)",
        boxShadow: "0 4px 20px rgba(213, 43, 30, 0.40), 0 2px 8px rgba(0,0,0,0.15)",
      }}
      aria-label="Create post"
    >
      <Plus size={22} color="white" strokeWidth={2.5} />
    </Link>
  );
}
