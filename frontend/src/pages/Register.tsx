import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
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
  const { register } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
  });

  const password = formData.password;
  const email = formData.email;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const emailName = email.split('@')[0]?.toLowerCase() || '';
  const doesNotContainEmail =
    !emailName || !password.toLowerCase().includes(emailName);

  const isPasswordValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    (hasNumber || hasSpecial) &&
    doesNotContainEmail;

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  setErrorMessage('');
  setEmailError('');
  setSuccessMessage('');

  if (!isPasswordValid) {
    setErrorMessage('Password does not meet the requirements.');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setErrorMessage('Passwords do not match');
    return;
  }

  setIsLoading(true);

  const { supabase } = await import('@/lib/supabase');

  const {
    data: emailAlreadyExists,
    error: emailCheckError,
  } = await supabase.rpc('email_exists', {
    check_email: formData.email,
  });

  if (emailCheckError) {
    setIsLoading(false);
    setErrorMessage(emailCheckError.message);
    return;
  }

  if (emailAlreadyExists) {
    setIsLoading(false);

    setEmailError(
      'An account with this email already exists. Please sign in.'
    );

    return;
  }

  const result = await register(
    formData.email,
    formData.password
  );

  setIsLoading(false);

 if (result.success) {
  setShowCodeInput(true);

  setSuccessMessage(
    'Verification code sent to your email.'
  );
} else {
  setErrorMessage(
    result.error || 'Registration failed'
  );
}
};

  const handleVerifyCode = async () => {
  setErrorMessage('');

  const { supabase } = await import('@/lib/supabase');

  const { data, error } = await supabase.auth.verifyOtp({
    email: formData.email,
    token: formData.code,
    type: 'signup',
  });

  if (error) {
    setErrorMessage(error.message);
    return;
  }

  const user = data.user;

  if (user) {

    const defaultAvatar =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

const { error: updateError } =
  await supabase
    .from('users')
    .update({
      profile_image: defaultAvatar,
      default_profile_image: defaultAvatar,
    })
    .eq(
      'auth_user_id',
      user.id
    );

if (updateError) {
  console.error(updateError);
}
  }

  window.location.href = '/';
};

  const Requirement = ({
    valid,
    text,
  }: {
    valid: boolean;
    text: string;
  }) => (
    <div
      className={`flex items-center gap-2 text-sm ${
        valid ? 'text-green-400' : 'text-muted-foreground'
      }`}
    >
      <span>{valid ? '✓' : '•'}</span>
      <span>{text}</span>
    </div>
  );

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
          transition={{
            ...springPresets.gentle,
            delay: 0.1,
          }}
          className="hidden lg:block"
        >
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Join voxeli.ai
              </h1>

              <p className="text-lg text-muted-foreground">
                Create your account and start exploring films, assets, and
                AI-powered tools.
              </p>
            </div>

            <div className="grid gap-4">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  whileHover={{ x: 6 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#060b16]/90 border border-border/20 backdrop-blur-sm"
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
          transition={{
            ...springPresets.gentle,
            delay: 0.2,
          }}
          className="relative"
        >
          <div className="relative bg-[#060b16]/90 backdrop-blur-xl border border-border/20 rounded-3xl p-8 shadow-2xl shadow-black/20">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 rounded-3xl blur-xl" />

            <div className="relative">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Create Account
                </h2>

                <p className="text-sm text-muted-foreground">
                  Register using your email and password.
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

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => {
                        setEmailError('');
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        });
                      }}
                      className={`pl-10 h-11 bg-[#060b16]/90 border-border/20 ${
                        emailError ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                    />
                  </div>

                  {emailError && (
                    <p className="text-red-500 text-sm mt-2">
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      className="pl-10 pr-10 h-11 bg-[#060b16]/90 border-border/20"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {formData.password.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Create a password that:
                      </p>

                      <div className="space-y-1">
                        <Requirement
                          valid={hasMinLength}
                          text="contains at least 8 characters"
                        />

                        <Requirement
                          valid={hasUppercase && hasLowercase}
                          text="contains both lower (a-z) and upper case letters (A-Z)"
                        />

                        <Requirement
                          valid={hasNumber || hasSpecial}
                          text="contains at least one number (0-9) or a symbol"
                        />

                        <Requirement
                          valid={doesNotContainEmail}
                          text="does not contain your email address"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="pl-10 pr-10 h-11 bg-[#060b16]/90 border-border/20"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-accent/70 hover:bg-accent/60"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              {showCodeInput && (
                <div className="space-y-4 mt-4">
                  <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value,
                      })
                    }
                  />

                  <Button
                    type="button"
                    onClick={handleVerifyCode}
                    className="w-full"
                  >
                    Verify Email
                  </Button>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <Link
                  to={ROUTE_PATHS.SIGNIN}
                  className="text-foreground hover:text-accent/70 font-medium"
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
