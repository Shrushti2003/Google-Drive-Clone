import { Chrome } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, getApiError } from '../../services/apiClient.js';
import { redirectToGoogleOAuth } from '../../services/oauthService.js';

export function GoogleAuthButton({ label = 'Continue with Google' }) {
  const [isChecking, setIsChecking] = useState(false);

  async function handleGoogleClick() {
    setIsChecking(true);
    try {
      const { data } = await api.get('/auth/google/status');
      if (!data.google.configured) {
        toast.error('Google OAuth is missing backend client ID or secret.');
        return;
      }
      if (!data.database.connected) {
        toast.error('MongoDB is not connected. Fix the database connection, then retry Google login.');
        return;
      }
      redirectToGoogleOAuth();
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <button
      className="btn-secondary mt-3 w-full"
      type="button"
      onClick={handleGoogleClick}
      disabled={isChecking}
    >
      <Chrome size={18} /> {isChecking ? 'Checking Google auth...' : label}
    </button>
  );
}
