import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import FirstTimeSetup from "@/pages/FirstTimeSetup";
import ForgotPassword from "@/pages/ForgotPassword";
import Employees from "@/pages/Employees";
import Assets from "@/pages/Assets";
import AssetHistory from "@/pages/AssetHistory";
import AssetImportExport from "@/pages/AssetImportExport";
import Tickets from "@/pages/Tickets";
import Reports from "@/pages/Reports";
import SystemConfig from "@/pages/SystemConfig";
import AuditLogs from "@/pages/AuditLogs";
import UserProfile from "@/pages/UserProfile";
import ChangesLog from "@/pages/ChangesLog";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { useLanguage, LanguageProvider } from "@/hooks/use-language";
import { HelmetProvider } from "react-helmet-async";
import { RoleGuard } from "@/components/auth/RoleGuard";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    if (!isLoading && !user && !isRedirecting) {
      setIsRedirecting(true);
      // Use navigate instead of window.location.href for better SPA behavior
      setTimeout(() => {
        navigate("/login");
      }, 100);
    }
  }, [user, isLoading, navigate, isRedirecting]);

  // Show enhanced loading state with better UX
  if (isLoading || isRedirecting) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 animate-fade-in">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">{isRedirecting ? 'Redirecting to login...' : 'Loading...'}</p>
        <div className="mt-4 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  // If user is not authenticated and we haven't started redirecting yet
  if (!user) {
    return null;
  }

  // User is authenticated, render the protected component
  return <Component {...rest} />;
}

function Router() {
  const { language } = useLanguage();
  const dir = language === "Arabic" ? "rtl" : "ltr";
  const [, navigate] = useLocation();
  
  // Check if system is initialized
  const { data: systemStatus, isLoading: checkingSystem } = useQuery({
    queryKey: ['/api/system-status'],
    retry: false
  });
  
  // If system is not initialized and we're not on the setup page, redirect to setup
  useEffect(() => {
    if (!checkingSystem && systemStatus && !(systemStatus as any).initialized) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/setup') {
        navigate('/setup');
      }
    }
  }, [systemStatus, checkingSystem, navigate]);
  
  // If checking system status, show loading
  if (checkingSystem) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p>Checking system status...</p>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/setup" component={FirstTimeSetup} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/">
          <Layout>
            <PrivateRoute component={Dashboard} />
          </Layout>
        </Route>

        <Route path="/employees">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager', 'agent']} fallback={<NotFound />}>
                <Employees />
              </RoleGuard>
            )} />
          </Layout>
        </Route>
        <Route path="/assets">
          <Layout>
            <PrivateRoute component={Assets} />
          </Layout>
        </Route>
        <Route path="/asset-history">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager', 'agent']} fallback={<NotFound />}>
                <AssetHistory />
              </RoleGuard>
            )} />
          </Layout>
        </Route>
        <Route path="/asset-import-export">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager', 'agent']} fallback={<NotFound />}>
                <AssetImportExport />
              </RoleGuard>
            )} />
          </Layout>
        </Route>
        <Route path="/tickets">
          <Layout>
            <PrivateRoute component={Tickets} />
          </Layout>
        </Route>
        <Route path="/reports">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager']} fallback={<NotFound />}>
                <Reports />
              </RoleGuard>
            )} />
          </Layout>
        </Route>
        <Route path="/system-config">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
                <SystemConfig />
              </RoleGuard>
            )} />
          </Layout>
        </Route>
        <Route path="/audit-logs">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager']} fallback={<NotFound />}>
                <AuditLogs />
              </RoleGuard>
            )} />
          </Layout>
        </Route>
        <Route path="/profile">
          <Layout>
            <PrivateRoute component={UserProfile} />
          </Layout>
        </Route>
        <Route path="/changes-log">
          <Layout>
            <PrivateRoute component={ChangesLog} />
          </Layout>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <LanguageProvider>
            <HelmetProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </HelmetProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
