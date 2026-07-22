import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, CreditCard, Users, ArrowLeftRight,
  Receipt, UserCircle, ShieldCheck, LogOut, Building2,
  Clock, RefreshCw, Zap, MessageSquare, PieChart,
  ShieldAlert, Sparkles,
} from 'lucide-react';
import { getInitials } from '../../utils/format';

const item  = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors';
const active  = 'bg-brand-50 text-brand-700';
const inactive = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); toast.success('Logged out'); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 tracking-tight">FinCore</span>
            <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">AI</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Banking</p>
          <NavLink to="/dashboard"     className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><LayoutDashboard size={16} /> Dashboard</NavLink>
          <NavLink to="/accounts"      className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><CreditCard size={16} /> Accounts</NavLink>
          <NavLink to="/beneficiaries" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><Users size={16} /> Beneficiaries</NavLink>
          <NavLink to="/transfer"      className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><ArrowLeftRight size={16} /> Transfer</NavLink>
          <NavLink to="/transactions"  className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><Receipt size={16} /> Transactions</NavLink>
          <NavLink to="/profile"       className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><UserCircle size={16} /> Profile</NavLink>

          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 mt-4">Automation</p>
          <NavLink to="/scheduled" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><Clock size={16} /> Scheduled</NavLink>
          <NavLink to="/standing"  className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><RefreshCw size={16} /> Standing Orders</NavLink>
          <NavLink to="/upi"       className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><Zap size={16} /> UPI</NavLink>

          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 mt-4">
            <span className="flex items-center gap-1"><Sparkles size={11} className="text-purple-500" /> AI Features</span>
          </p>
          <NavLink to="/ai/smart-dashboard" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><Sparkles size={16} className="text-purple-500" /> Smart Dashboard</NavLink>
          <NavLink to="/ai/chat"            className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><MessageSquare size={16} /> AI Assistant</NavLink>
          <NavLink to="/ai/insights"        className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><PieChart size={16} /> Spending Insights</NavLink>
          <NavLink to="/ai/fraud"           className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><ShieldAlert size={16} /> Fraud Detection</NavLink>

          {isAdmin && (
            <>
              <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 mt-4">Admin</p>
              <NavLink to="/admin" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}><ShieldCheck size={16} /> Admin Panel</NavLink>
            </>
          )}
        </nav>

        {/* User chip */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="mt-1 flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
