import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const handleResetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage(
        'Passwords do not match.'
      );
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(password)) {
      setErrorMessage(
        'Password must contain uppercase, lowercase, number or symbol, and be at least 8 characters.'
      );
      return;
    }

    setIsLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(
      'Password updated successfully.'
    );

    setTimeout(() => {
      navigate('/signin');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">
          Reset Password
        </h1>

        <p className="text-muted-foreground text-center mb-8">
          Enter your new password.
        </p>

        {errorMessage && (
          <p className="text-red-500 text-sm text-center mb-4">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="text-green-500 text-sm text-center mb-4">
            {successMessage}
          </p>
        )}

        <form
          onSubmit={handleResetPassword}
          className="space-y-5"
        >
          <div>
            <label className="text-sm mb-2 block">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full rounded-xl bg-background border border-border px-4 py-3 outline-none"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="text-sm mb-2 block">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              className="w-full rounded-xl bg-background border border-border px-4 py-3 outline-none"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-medium hover:opacity-90 transition"
          >
            {isLoading
              ? 'Updating...'
              : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}