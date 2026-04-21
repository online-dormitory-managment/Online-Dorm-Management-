import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    authApi.logout();
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400 uppercase tracking-widest text-xs">
      Signing out...
    </div>
  );
};

export default Logout;
