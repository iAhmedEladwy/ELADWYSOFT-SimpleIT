import { Switch, Route, useLocation } from "wouter";
import React, { useEffect, useState } from "react";
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
import Tickets from "@/pages/Tickets";
import Reports from "@/pages/Reports";
import SystemConfig from "@/pages/SystemConfig";
import AuditLogs from "@/pages/AuditLogs";
import UserProfile from "@/pages/UserProfile";
import Users from "@/pages/Users";
import Maintenance from "@/pages/Maintenance";
import ChangesLog from "@/pages/ChangesLog";
import AdminConsole from "@/pages/AdminConsole";
import BulkOperations from "@/pages/admin/BulkOperations";
import UpgradeRequests from "@/pages/admin/UpgradeRequests";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { useLanguage, LanguageProvider } from "@/hooks/use-language";
import { HelmetProvider } from "react-helmet-async";
import { RoleGuard } from "@/components/auth/RoleGuard";
import BackupRestore from '@/pages/admin/BackupRestore';
import SystemHealth from '@/pages/admin/SystemHealth';

// Employee Portal imports
import PortalDashboard from '@/pages/portal/PortalDashboard';
import MyAssets from '@/pages/portal/MyAssets';
import MyTickets from '@/pages/portal/MyTickets';
import CreateTicket from '@/pages/portal/CreateTicket';
import MyProfile from '@/pages/portal/MyProfile';
import TicketDetail from '@/pages/portal/TicketDetail';

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading, hasCheckedAuth } = useAuth();
  const [, navigate] = useLocation();
  
  // Use useEffect to handle navigation to avoid setState during render
  React.useEffect(() => {
    if (hasCheckedAuth && !isLoading && !user) {
      navigate("/login");
    }
  }, [hasCheckedAuth, isLoading, user, navigate]);
  
  // Show loading until we've checked auth at least once
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 animate-fade-in">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Loading...</p>
        <div className="mt-4 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Auth has been checked - if no user, return null (navigation handled in useEffect)
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
  const { isLoading: authLoading, hasCheckedAuth } = useAuth();
  
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
  
  // Show loading during initial auth check or system status check
  // IMPORTANT: Don't render any routes until auth has been checked at least once
  if (checkingSystem || !hasCheckedAuth) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">
          {checkingSystem ? 'Checking system status...' : 'Initializing...'}
        </p>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/setup" component={FirstTimeSetup} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        
        {/* Employee Portal Routes - Must be before "/" route */}
        <Route path="/portal/my-assets" component={MyAssets} />
        <Route path="/portal/my-tickets/:id" component={TicketDetail} />
        <Route path="/portal/my-tickets" component={MyTickets} />
        <Route path="/portal/create-ticket" component={CreateTicket} />
        <Route path="/portal/my-profile" component={MyProfile} />
        <Route path="/portal" component={PortalDashboard} />
        
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
        <Route path="/maintenance">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager', 'agent']} fallback={<NotFound />}>
                <Maintenance />
              </RoleGuard>
            )} />
          </Layout>
        </Route>
        <Route path="/changes-log">
          <Layout>
            <PrivateRoute component={ChangesLog} />
          </Layout>
        </Route>

        {/* Admin Console Routes */}
        <Route path="/admin-console">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
                <AdminConsole />
              </RoleGuard>
            )} />
          </Layout>
        </Route>

        <Route path="/admin-console/users">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
                <Users />
              </RoleGuard>
            )} />
          </Layout>
        </Route>

                {/* NEW: Backup & Restore Route */}
        <Route path="/admin-console/backup-restore">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
                <BackupRestore />
              </RoleGuard>
            )} />
          </Layout>
        </Route>

        {/* NEW: System Health Route */}
        <Route path="/admin-console/system-health">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
                <SystemHealth />
              </RoleGuard>
            )} />
          </Layout>
        </Route>

        <Route path="/admin-console/audit-logs">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager']} fallback={<NotFound />}>
                <AuditLogs />
              </RoleGuard>
            )} />
          </Layout>
        </Route>

        <Route path="/admin-console/bulk-operations">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
                <BulkOperations />
              </RoleGuard>
            )} />
          </Layout>
        </Route>

        <Route path="/admin-console/upgrade-requests">
          <Layout>
            <PrivateRoute component={() => (
              <RoleGuard allowedRoles={['admin', 'manager']} fallback={<NotFound />}>
                <UpgradeRequests />
              </RoleGuard>
            )} />
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
