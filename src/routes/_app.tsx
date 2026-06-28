import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
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
