import React from 'react';
import { Outlet } from 'react-router-dom';
import ProctorTopNav from '../dashboard/Proctor/ProctoreTopNav';

const ProctorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
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