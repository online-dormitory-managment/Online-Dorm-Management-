import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminHeader />
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
