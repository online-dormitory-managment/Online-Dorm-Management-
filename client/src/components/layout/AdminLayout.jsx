import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <AdminHeader />
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
