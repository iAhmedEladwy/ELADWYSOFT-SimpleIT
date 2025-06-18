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
import Users from "@/pages/Users";
import Employees from "@/pages/Employees";
import Assets from "@/pages/Assets";
import AssetHistory from "@/pages/AssetHistory";
import AssetImportExport from "@/pages/AssetImportExport";
import Tickets from "@/pages/Tickets";
import Reports from "@/pages/Reports";
import SystemConfigEnhanced from "@/pages/SystemConfigEnhanced";
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // If we're not loading and there's no user, redirect to login
    if (!isLoading && !user) {
      console.log('PrivateRoute: Not authenticated, redirecting to login page');
      setIsRedirecting(true);
      
      // Use a short delay to ensure state updates
      setTimeout(() => {
        console.log('PrivateRoute: Executing redirect to login');
        window.location.href = "/login";
      }, 100);
    }
  }, [user, isLoading]);

  // Show loading state when auth is being checked or during redirect
  if (isLoading || isRedirecting) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p>{isRedirecting ? 'Redirecting to login...' : 'Loading...'}</p>
      </div>
    );
  }

  // If user is not authenticated and we haven't started redirecting yet
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <p>Authentication required. Redirecting...</p>
      </div>
    );
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
    retry: false,
    onError: () => {
      console.log('Error checking system status');
    }
  });
  
  // If system is not initialized and we're not on the setup page, redirect to setup
  useEffect(() => {
    if (!checkingSystem && systemStatus && !systemStatus.initialized) {
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
        <Route path="/users">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
                <Users />
              </RoleGuard>
            )} />
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
                <SystemConfigEnhanced />
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
