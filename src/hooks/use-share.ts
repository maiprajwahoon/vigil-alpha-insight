import { useCallback } from "react";
import { toast } from "sonner";

interface ShareData {
  title: string;
  text: string;
  url: string;
}

export function useShare() {
  const share = useCallback(async (data: ShareData) => {
    if (typeof window === "undefined") return;

    if (navigator.share && navigator.canShare && navigator.canShare(data)) {
      try {
        await navigator.share(data);
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          toast.error("Failed to share.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copied to clipboard.");
      } catch {
        toast.error("Failed to copy link.");
      }
    }
  }, []);

  return { share };
}
