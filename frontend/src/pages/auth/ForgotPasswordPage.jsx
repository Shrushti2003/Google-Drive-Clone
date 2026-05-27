import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { api, getApiError } from '../../services/apiClient.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const mutation = useMutation({
    mutationFn: async () => (await api.post('/auth/forgot-password', { email })).data,
    onSuccess: (data) => toast.success(data.resetToken ? `Reset token prepared: ${data.resetToken.slice(0, 8)}...` : data.message),
    onError: (error) => toast.error(getApiError(error))
  });
  return (
    <form className="premium-card w-full max-w-md p-6" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
      <h1 className="font-display text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-slate-500">The mock email flow returns a token in development responses.</p>
      <input className="input mt-6" type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn-primary mt-4 w-full">Prepare reset link</button>
      <Link className="mt-4 block text-center text-sm font-medium text-cyan-200" to="/login">Back to login</Link>
    </form>
  );
}
