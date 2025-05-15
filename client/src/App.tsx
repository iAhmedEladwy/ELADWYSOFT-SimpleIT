import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Users from "@/pages/Users";
import Employees from "@/pages/Employees";
import Assets from "@/pages/Assets";
import Tickets from "@/pages/Tickets";
import Reports from "@/pages/Reports";
import SystemConfig from "@/pages/SystemConfig";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { useLanguage, LanguageProvider } from "@/hooks/use-language";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  const { language } = useLanguage();
  const dir = language === "Arabic" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">
          <Layout>
            <PrivateRoute component={Dashboard} />
          </Layout>
        </Route>
        <Route path="/users">
          <Layout>
            <PrivateRoute component={Users} />
          </Layout>
        </Route>
        <Route path="/employees">
          <Layout>
            <PrivateRoute component={Employees} />
          </Layout>
        </Route>
        <Route path="/assets">
          <Layout>
            <PrivateRoute component={Assets} />
          </Layout>
        </Route>
        <Route path="/tickets">
          <Layout>
            <PrivateRoute component={Tickets} />
          </Layout>
        </Route>
        <Route path="/reports">
          <Layout>
            <PrivateRoute component={Reports} />
          </Layout>
        </Route>
        <Route path="/system-config">
          <Layout>
            <PrivateRoute component={SystemConfig} />
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
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
