import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserCircle, Mail, Phone, ShieldCheck, Calendar } from 'lucide-react';
import { userService } from '../../services';
import { useApi } from '../../hooks/useApi';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import { formatDate, getInitials } from '../../utils/format';

export default function ProfilePage() {
  const { data: profile, loading, refetch } = useApi(userService.getProfile);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm();

  useEffect(() => {
    if (profile) reset({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone || '' });
  }, [profile, reset]);

  const onSave = async (data) => {
    try {
      await userService.updateProfile(data);
      toast.success('Profile updated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!profile) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Profile" subtitle="Manage your personal information" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
            {getInitials(profile.firstName, profile.lastName)}
          </div>
          <h2 className="font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>

          <div className="mt-4 flex flex-col gap-2 w-full text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck size={14} className={profile.role === 'ADMIN' ? 'text-amber-500' : 'text-brand-500'} />
              <span className={`font-medium ${profile.role === 'ADMIN' ? 'text-amber-700' : 'text-brand-700'}`}>{profile.role}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck size={14} className={profile.isVerified ? 'text-green-500' : 'text-gray-300'} />
              <span>{profile.isVerified ? 'Verified' : 'Not verified'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} />
              <span className="text-xs">Joined {formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card p-6 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-5">Edit Information</h3>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className={`input ${errors.firstName ? 'input-error' : ''}`}
                  {...register('firstName', { required: 'Required', minLength: { value: 2, message: 'Too short' } })} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className={`input ${errors.lastName ? 'input-error' : ''}`}
                  {...register('lastName', { required: 'Required', minLength: { value: 2, message: 'Too short' } })} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Mail size={13} /> Email <span className="text-gray-400 font-normal">(cannot change)</span></label>
              <input className="input bg-gray-50 text-gray-400" value={profile.email} disabled />
            </div>

            <div>
              <label className="label flex items-center gap-1.5"><Phone size={13} /> Phone</label>
              <input className="input" placeholder="+91-9000000000" {...register('phone')} />
            </div>

            <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
