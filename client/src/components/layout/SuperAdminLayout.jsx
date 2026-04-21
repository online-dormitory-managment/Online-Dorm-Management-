import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminHeader from './SuperAdminHeader';

const SuperAdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <SuperAdminHeader />
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default SuperAdminLayout;
