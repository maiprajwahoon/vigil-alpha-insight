import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#111111] select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="text-xs text-muted-foreground font-medium">Authorizing credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // redirecting
  }

  return (
    <div className="relative flex min-h-screen w-full">
      <AnimatedBackground />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
