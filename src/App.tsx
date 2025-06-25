import { StrictMode, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PWAStatus } from "@/components/PWAStatus";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

const queryClient = new QueryClient();

function AllowScrollInPopover() {
  useEffect(() => {
    function allowScroll(e: TouchEvent) {
      if ((e.target as HTMLElement)?.closest('.max-h-[300px]')) {
        e.stopPropagation();
      }
    }
    document.addEventListener('touchmove', allowScroll, { passive: false });
    return () => document.removeEventListener('touchmove', allowScroll);
  }, []);
  return null;
}

const App = () => {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAStatus />
            <AllowScrollInPopover />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/reset-password" element={<ForgotPasswordForm />} />
                <Route path="/auth/update-password" element={<UpdatePasswordForm />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
