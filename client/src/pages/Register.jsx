import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const Register = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setLogin = useAuthStore(state => state.login);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', data);
      setLogin(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-med-secondary to-green-400"></div>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-med-dark tracking-tight">Create Account</h2>
          <p className="text-med-muted mt-2">Join MediGuide today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">Full Name</label>
            <input 
              type="text" 
              {...register('name')}
              className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-med-primary focus:ring-med-primary/20'} focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white`}
              placeholder="John Doe"
            />
            {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">Email Address</label>
            <input 
              type="email" 
              {...register('email')}
              className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-med-primary focus:ring-med-primary/20'} focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">Password</label>
            <input 
              type="password" 
              {...register('password')}
              className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-med-primary focus:ring-med-primary/20'} focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 bg-med-primary hover:bg-med-secondary text-white rounded-full font-medium shadow-md transition-all flex justify-center items-center gap-2 group disabled:opacity-70 mt-8"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Already have an account? <Link to="/login" className="text-med-primary hover:text-med-secondary transition-colors font-bold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
