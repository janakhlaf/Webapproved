import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";

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
import Cart from "@/pages/Cart";
import Library from "@/pages/MyLibrary";

import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/CartContext";

import Slider from "@/components/Slider";
import CineVerseBackground from "@/components/CineVerseBackground";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  return (
    <Layout>
      <Routes location={location} key={location.pathname}>
        <Route
          path={ROUTE_PATHS.HOME}
          element={
            <>
              <Slider />
              <Home />
            </>
          }
        />

        <Route path={ROUTE_PATHS.FILMS} element={<Films />} />
        <Route path={ROUTE_PATHS.ASSETS} element={<Assets />} />
        <Route path={ROUTE_PATHS.ABOUT} element={<About />} />
        <Route path={ROUTE_PATHS.CART} element={<Cart />} />
        <Route path={ROUTE_PATHS.PROFILE} element={<Profile />} />
        <Route path={ROUTE_PATHS.SIGNIN} element={<SignIn />} />
        <Route path={ROUTE_PATHS.REGISTER} element={<Register />} />

        <Route
          path="/my-library"
          element={<Library />}
        />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />

          <HashRouter>
            <CineVerseBackground />
            <AppContent />
            <Chatbot />
          </HashRouter>
        </CartProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;