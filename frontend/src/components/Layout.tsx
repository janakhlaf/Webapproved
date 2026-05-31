import { useState, ReactNode, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ShoppingCart, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '../hooks/useCart';

const navLinks = [
  { name: 'Home', path: ROUTE_PATHS.HOME },
  { name: 'Films', path: ROUTE_PATHS.FILMS },
  { name: 'Assets', path: ROUTE_PATHS.ASSETS },
  { name: 'About', path: ROUTE_PATHS.ABOUT },
];

// Directional routing indexes for spatial transit simulation
const ROUTE_INDEX: Record<string, number> = {
  '/': 0,
  '/films': 1,
  '/assets': 2,
  '/about': 3,
  '/cart': 4,
  '/profile': 5,
  '/signin': 6,
  '/register': 7,
  '/my-library': 8
};

// 3D camera travel transition variants
const pageVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir * 300,        // Horizontal camera slide
    z: -140,            // Depth displacement (pop backward)
    rotateY: dir * 18,  // Perspective rotation
    filter: 'blur(10px) brightness(1.2)',
  }),
  animate: {
    opacity: 1,
    x: 0,
    z: 0,
    rotateY: 0,
    filter: 'blur(0px) brightness(1)',
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: -dir * 300,       // Outward slide in transit direction
    z: -160,            // Depth plunge (warp out)
    rotateY: -dir * 22, // Perspective tilt
    filter: 'blur(10px) brightness(0.75)',
  })
};

export function Layout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();

  // Spatial direction tracker
  const prevPathRef = useRef(location.pathname);
  const [transitionDir, setTransitionDir] = useState(1);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;

    if (prevPath !== currentPath) {
      const prevIdx = ROUTE_INDEX[prevPath] ?? 0;
      const currIdx = ROUTE_INDEX[currentPath] ?? 0;
      // Determine forward (1) or backward (-1) travel direction
      const dir = currIdx >= prevIdx ? 1 : -1;
      
      setTransitionDir(dir);
      prevPathRef.current = currentPath;

      // Dispatch travel details to our global high-density background canvas!
      window.dispatchEvent(
        new CustomEvent('cineverse-transition', {
          detail: { from: prevPath, to: currentPath, direction: dir },
        })
      );
    }
  }, [location.pathname]);

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      {/* ─── Persistent Glassmorphic Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-500/10 backdrop-blur-2xl bg-[#020306]/55 shadow-[0_8px_32px_rgba(0,0,0,0.65)]">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to={ROUTE_PATHS.HOME}
            className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:opacity-90 transition-all duration-300 font-sans tracking-tight cursor-none animate-pulse-glow"
          >
            Human Mind & AI Logic
          </Link>

          {/* Nav list - Underlines slide smoothly across pages */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className="relative text-sm font-semibold transition-all duration-300 py-1.5 px-3 cursor-none"
              >
                {({ isActive }) => (
                  <>
                    <span className={`relative z-10 transition-colors duration-300 ${
                      isActive ? 'text-cyan-300 font-bold' : 'text-gray-400 hover:text-white'
                    }`}>
                      {link.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-1 right-1 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3">
                <Link
                  to={ROUTE_PATHS.MY_LIBRARY}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full border border-white/5 bg-[#080c14]/40 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all cursor-none"
                  aria-label="My Library"
                  title="My Library"
                >
                  <Library className="w-5 h-5 text-gray-300" />
                </Link>

                <Link
                  to={ROUTE_PATHS.CART}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full border border-white/5 bg-[#080c14]/40 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all cursor-none"
                  aria-label="Shopping Cart"
                  title="Cart"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-300" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.6)]">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full border border-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-none"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-cyan-500/10 text-cyan-300">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#080c14]/95 backdrop-blur-xl border border-cyan-500/15 text-white"
                >
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-10 w-10 border border-cyan-500/20">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-cyan-500/10 text-cyan-300">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-white/5" />

                  <DropdownMenuItem asChild className="hover:bg-cyan-500/10 cursor-none focus:bg-cyan-500/10">
                    <Link
                      to={ROUTE_PATHS.PROFILE}
                      className="flex items-center gap-2 cursor-none w-full"
                    >
                      <User className="h-4 w-4 text-cyan-400" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/5" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-none text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-gray-400 hover:text-cyan-300 transition-colors"
                >
                  <Link to={ROUTE_PATHS.SIGNIN}>Sign In</Link>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="shadow-lg shadow-cyan-500/20"
                >
                  <Link to={ROUTE_PATHS.REGISTER}>Register</Link>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-cyan-400 transition-colors cursor-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-cyan-500/10 bg-[#020306]/95 backdrop-blur-xl"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-sm font-semibold transition-colors hover:text-cyan-300 py-2 cursor-none ${
                        isActive ? 'text-cyan-300' : 'text-gray-400'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}

                {isAuthenticated && user && (
                  <div className="pt-2 flex flex-col gap-3">
                    <Link
                      to={ROUTE_PATHS.MY_LIBRARY}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#080c14]/40 border border-white/5 hover:border-cyan-400/40 transition-colors cursor-none"
                    >
                      <Library className="h-5 w-5 text-cyan-400" />
                      <span className="text-sm font-medium">My Library</span>
                    </Link>

                    <Link
                      to={ROUTE_PATHS.CART}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#080c14]/40 border border-white/5 hover:border-cyan-400/40 transition-colors cursor-none"
                    >
                      <ShoppingCart className="h-5 w-5 text-cyan-400" />
                      <span className="text-sm font-medium">Cart</span>
                      {cartCount > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                  {isAuthenticated && user ? (
                    <>
                      <Link
                        to={ROUTE_PATHS.PROFILE}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#080c14]/40 border border-white/5 hover:border-cyan-400/40 transition-colors cursor-none"
                      >
                        <Avatar className="h-10 w-10 border border-cyan-500/20">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-cyan-500/10 text-cyan-300">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full justify-start gap-2 text-red-400 border-red-500/20 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to={ROUTE_PATHS.SIGNIN}>Sign In</Link>
                      </Button>

                      <Button
                        size="sm"
                        asChild
                        className="w-full shadow-lg shadow-cyan-500/25"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to={ROUTE_PATHS.REGISTER}>Register</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── 3D camera Transition Content Area ─── */}
      <main 
        className="flex-grow pt-16 relative z-10 overflow-hidden" 
        style={{ perspective: "1500px" }} // Perspective context for depth transforms
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            custom={transitionDir}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }} // Fast, premium transit speed
            className="w-full h-full"
            style={{ transformStyle: "preserve-3d" }} // Required to execute 3D rotation without flattening
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── Persistent Glassmorphic Footer ─── */}
      <footer className="border-t border-cyan-500/10 bg-[#080c14]/20 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                Human Mind & AI Logic
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed font-sans font-light">
                Exploring the cinematic intersection of AI, memory, creativity, and
                interactive 3D experiences.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-400 hover:text-cyan-300 transition-colors cursor-none"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wider">Connect</h4>
              <p className="text-sm text-gray-400 font-sans font-light">
                A graduation project exploring the future of multimedia and AI.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500 font-mono">
              © 2026 Human Mind & AI Logic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}