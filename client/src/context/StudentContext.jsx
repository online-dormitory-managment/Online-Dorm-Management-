import React, { createContext, useState, useContext, useEffect } from 'react';
import { dormApi } from '../api/dormApi';

const StudentContext = createContext();

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);

  // Fetch student profile on mount
  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const studentData = await dormApi.getStudentProfile();
      setStudent(studentData);
      
      // Also fetch application if exists
      try {
        const appData = await dormApi.getMyApplication();
        setApplication(appData);
      } catch (error) {
        console.log('No application found');
        setApplication(null);
      }
    } catch (error) {
      console.error('Failed to fetch student profile:', error);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const updateApplication = (appData) => {
    setApplication(appData);
  };

  const clearStudent = () => {
    setStudent(null);
    setApplication(null);
  };

  return (
    <StudentContext.Provider value={{
      student,
      application,
      loading,
      fetchStudentProfile,
      updateApplication,
      clearStudent,
    }}>
      {children}
    </StudentContext.Provider>
  );
};