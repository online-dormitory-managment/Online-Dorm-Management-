import React from 'react';
import { Outlet } from 'react-router-dom';
import ProctorTopNav from '../dashboard/Proctor/ProctoreTopNav';

const ProctorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navigation */}
      <ProctorTopNav />

      {/* Main Content Area */}
      <main className="w-full">
        <Outlet /> {/* This is where page content will render */}
      </main>
    </div>
  );
};

export default ProctorLayout;