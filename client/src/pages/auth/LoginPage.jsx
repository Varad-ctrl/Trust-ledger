import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">FinCore</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input type="email" placeholder="deep@fincore.io"
              className={`input ${errors.email ? 'input-error' : ''}`}
              {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••"
                className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                {...register('password', { required: 'Password is required' })} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-700 mb-1.5">Demo credentials</p>
          <p>👤 User: <span className="font-mono">deep@fincore.io</span> / <span className="font-mono">Demo@1234</span></p>
          <p>🔑 Admin: <span className="font-mono">admin@fincore.io</span> / <span className="font-mono">Demo@1234</span></p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
