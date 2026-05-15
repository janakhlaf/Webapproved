import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  ShieldCheck,
  Film,
  Upload,
  ShoppingCart,
  MessageSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/hooks/useAuth';
import { springPresets } from '@/lib/motion';

export default function Register() {
  const navigate = useNavigate();
  const { sendEmailCode, verifyEmailCode } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    code: '',
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const result = await sendEmailCode(formData.email);

    setIsLoading(false);

    if (result.success) {
      setCodeSent(true);
      setSuccessMessage('Verification code sent to your email.');
    } else {
      setErrorMessage(result.error || 'Failed to send verification code');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const result = await verifyEmailCode(formData.email, formData.code);

    setIsLoading(false);

    if (result.success) {
      navigate(ROUTE_PATHS.HOME);
    } else {
      setErrorMessage(result.error || 'Invalid verification code');
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
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.03),transparent_50%)]" />

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
        className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.1 }}
          className="hidden lg:block"
        >
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Join Human Mind & AI Logic
              </h1>
              <p className="text-lg text-muted-foreground">
                Create your account securely using your email verification code.
              </p>
            </div>

            <div className="grid gap-4">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  whileHover={{ x: 6 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border/20 backdrop-blur-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.2 }}
          className="relative"
        >
          <div className="relative bg-card/60 backdrop-blur-xl border border-border/20 rounded-3xl p-8 shadow-2xl shadow-black/20">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 rounded-3xl blur-xl" />

            <div className="relative">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Create Account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email and verify it with a code.
                </p>
              </div>

              {errorMessage && (
                <p className="mb-4 text-sm text-red-500 text-center">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p className="mb-4 text-sm text-green-500 text-center">
                  {successMessage}
                </p>
              )}

              {!codeSent ? (
                <form onSubmit={handleSendCode} className="space-y-4">
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

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-accent/70 hover:bg-accent/60 text-accent-foreground shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-all"
                  >
                    {isLoading ? 'Sending code...' : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium">
                      Verification Code
                    </Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        placeholder="Enter verification code"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        className="pl-10 h-11 bg-background/50 border-border/20 focus:border-border/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-accent/70 hover:bg-accent/60 text-accent-foreground shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-all"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isLoading}
                    onClick={() => {
                      setCodeSent(false);
                      setFormData({ email: formData.email, code: '' });
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="w-full"
                  >
                    Change Email
                  </Button>
                </form>
              )}

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
      </motion.div>
    </div>
  );
}