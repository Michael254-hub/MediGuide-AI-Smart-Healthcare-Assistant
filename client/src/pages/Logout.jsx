import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Logout page - redirects to home and clears auth state
 * Note: The logout button is implemented in Navbar component for better UX
 */
export default function Logout() {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  // Clear auth state and redirect on mount
  useEffect(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  return null;
}