import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/hooks/useAuth';
import { springPresets } from '@/lib/motion';
export default function SignIn() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await signIn(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      navigate(ROUTE_PATHS.HOME);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    setIsLoading(false);

    if (result.success) {
      navigate(ROUTE_PATHS.HOME);
    }
  };
  return <div className="min-h-screen flex items-center justify-center px-4 py-24 relative overflow-hidden">
      {/* Animated background - reduced brightness */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,217,255,0.03),transparent_50%)]" />
      
      {/* Floating particles - reduced opacity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => <motion.div key={i} className="absolute w-1 h-1 bg-primary/10 rounded-full" style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`
      }} animate={{
        y: [0, -30, 0],
        opacity: [0.1, 0.3, 0.1]
      }} transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 2
      }} />)}
      </div>

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={springPresets.gentle} className="relative w-full max-w-md">
        {/* Glassmorphism card - subtle styling */}
        <div className="relative bg-card/60 backdrop-blur-xl border border-border/20 rounded-3xl p-8 shadow-2xl shadow-black/20">
          {/* Subtle glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl blur-xl" />
          
          <div className="relative">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div initial={{
              scale: 0.9,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} transition={{
              ...springPresets.gentle,
              delay: 0.1
            }}>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground">
                  Sign in to continue your journey
                </p>
              </motion.div>
            </div>

            {/* Sign In Form */}
            <motion.form onSubmit={handleSubmit} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            ...springPresets.gentle,
            delay: 0.3
          }} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} className="pl-10 h-12 bg-background/50 border-border/20 focus:border-border/50 transition-colors" required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={e => setFormData({
                  ...formData,
                  password: e.target.value
                })} className="pl-10 pr-10 h-12 bg-background/50 border-border/20 focus:border-border/50 transition-colors" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={formData.rememberMe} onCheckedChange={checked => setFormData({
                  ...formData,
                  rememberMe: checked as boolean
                })} />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </label>
                </div>
                
              </div>

              {/* Submit Button - reduced glow */}
              <Button type="submit" className="w-full h-12 bg-primary/70 text-primary-foreground shadow-lg shadow-primary/10 transition-all">
                Sign In
              </Button>
            </motion.form>

            {/* Google Sign In - Below Sign In Button */}
            <motion.div initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            ...springPresets.gentle,
            delay: 0.35
          }} className="mt-4">
              <Button type="button" variant="outline" className="w-full h-12 border-border/20 transition-all" onClick={handleGoogleSignIn}>
                <FcGoogle className="w-5 h-5 mr-2" />
                Continue with Google
              </Button>
            </motion.div>

            {/* Register Link */}
            <motion.p initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            ...springPresets.gentle,
            delay: 0.4
          }} className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link to={ROUTE_PATHS.REGISTER} className="text-foreground hover:text-primary/70 font-medium transition-colors">
                Register now
              </Link>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>;
}