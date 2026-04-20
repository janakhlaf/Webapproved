import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { Layout } from "@/components/Layout";
import { Chatbot } from "@/components/Chatbot";
import Home from "@/pages/Home";
import Films from "@/pages/Films";
import Assets from "@/pages/Assets";
import About from "@/pages/About";
import Profile from "@/pages/Profile";
import SignIn from "@/pages/SignIn";
import Register from "@/pages/Register";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path={ROUTE_PATHS.HOME} element={<Layout><Home /></Layout>} />
          <Route path={ROUTE_PATHS.FILMS} element={<Layout><Films /></Layout>} />
          <Route path={ROUTE_PATHS.ASSETS} element={<Layout><Assets /></Layout>} />
          <Route path={ROUTE_PATHS.ABOUT} element={<Layout><About /></Layout>} />
          <Route path={ROUTE_PATHS.PROFILE} element={<Layout><Profile /></Layout>} />
          <Route path={ROUTE_PATHS.SIGNIN} element={<Layout><SignIn /></Layout>} />
          <Route path={ROUTE_PATHS.REGISTER} element={<Layout><Register /></Layout>} />
        </Routes>
        <Chatbot />
      </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
