import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success('Account created! Welcome to FinCore.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">FinCore</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">Join FinCore — a free savings account is created automatically.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First name</label>
              <input placeholder="Deep" className={`input ${errors.firstName ? 'input-error' : ''}`}
                {...register('firstName', { required: 'Required', minLength: { value: 2, message: 'Too short' } })} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Last name</label>
              <input placeholder="Patel" className={`input ${errors.lastName ? 'input-error' : ''}`}
                {...register('lastName', { required: 'Required', minLength: { value: 2, message: 'Too short' } })} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Email address</label>
            <input type="email" placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`}
              {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Phone <span className="text-gray-400">(optional)</span></label>
            <input type="tel" placeholder="+91-9876543210" className="input"
              {...register('phone')} />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, 1 upper, 1 number, 1 special"
                className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                  pattern: { value: /(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&#^])/, message: 'Must include uppercase, number and special char' },
                })} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
