import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { AuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Access Terminal — LynchMark" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const hasName = user.user_metadata?.full_name?.trim();
      if (!hasName) {
        navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#111111] select-none">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden">
      <AnimatedBackground />

      <AuthModal
        isOpen={true}
        onClose={() => navigate({ to: "/" })}
        initialSignUp={false}
      />
    </div>
  );
}
