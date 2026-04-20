import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Film, Upload, ShoppingCart, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/hooks/useAuth';
import { springPresets } from '@/lib/motion';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await register(formData.email, formData.password, formData.name, formData.accountType || 'Creator');
    setIsLoading(false);

    if (result.success) {
      navigate(ROUTE_PATHS.HOME);
    }
  };



  const features = [
    {
      icon: Film,
      title: 'Watch Films',
      description: 'Access exclusive cinematic content',
    },
    {
      icon: Upload,
      title: 'Upload Content',
      description: 'Share your creative work',
    },
    {
      icon: ShoppingCart,
      title: 'Purchase Assets',
      description: 'Buy premium 3D models',
    },
    {
      icon: MessageSquare,
      title: 'AI Chatbot',
      description: 'Interactive assistance',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 relative overflow-hidden">
      {/* Animated background - reduced brightness */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.03),transparent_50%)]" />
      
      {/* Floating particles - reduced opacity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-accent/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="relative w-full max-w-6xl"
      >
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.2 }}
            className="hidden lg:block space-y-8"
          >
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Join the Future
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore the intersection of human creativity and artificial intelligence
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springPresets.gentle, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/20 hover:border-border/40 transition-colors"
                >
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <feature.icon className="h-6 w-6 text-primary/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.2 }}
            className="relative"
          >
            {/* Glassmorphism card - subtle styling */}
            <div className="relative bg-card/60 backdrop-blur-xl border border-border/20 rounded-3xl p-8 shadow-2xl shadow-black/20">
              {/* Subtle glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 rounded-3xl blur-xl" />
              
              <div className="relative">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Create Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Start your creative journey today
                  </p>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="pl-10 h-11 bg-background/50 border-border/20 focus:border-border/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-10 h-11 bg-background/50 border-border/20 focus:border-border/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="pl-10 pr-10 h-11 bg-background/50 border-border/20 focus:border-border/50 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="pl-10 pr-10 h-11 bg-background/50 border-border/20 focus:border-border/50 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Type */}
                  <div className="space-y-2">
                    <Label htmlFor="accountType" className="text-sm font-medium">
                      Account Type
                    </Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, accountType: value })
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/50 border-border/20 focus:border-border/50">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30">
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button - reduced glow */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-accent/70 hover:bg-accent/60 text-accent-foreground shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-all"
                  >
                    Create Account
                  </Button>
                </form>

                {/* Sign In Link */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Already have an account?{' '}
                  <Link
                    to={ROUTE_PATHS.SIGNIN}
                    className="text-foreground hover:text-accent/70 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
