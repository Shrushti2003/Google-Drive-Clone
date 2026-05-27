import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { api, getApiError } from '../../services/apiClient.js';

export function ResetPasswordPage() {
  const [form, setForm] = useState({ token: '', password: '' });
  const mutation = useMutation({
    mutationFn: async () => (await api.post('/auth/reset-password', form)).data,
    onSuccess: () => toast.success('Password updated'),
    onError: (error) => toast.error(getApiError(error))
  });
  return (
    <form className="premium-card w-full max-w-md p-6" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
      <h1 className="font-display text-2xl font-semibold">Set new password</h1>
      <input className="input mt-6" required placeholder="Reset token" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
      <input className="input mt-4" required minLength={8} type="password" placeholder="New password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button className="btn-primary mt-4 w-full">Update password</button>
      <Link className="mt-4 block text-center text-sm font-medium text-cyan-200" to="/login">Back to login</Link>
    </form>
  );
}
