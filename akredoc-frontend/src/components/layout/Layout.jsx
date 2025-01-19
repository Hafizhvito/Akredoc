import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

const Layout = ({ children, onLogout }) => {
  const [activeTab, setActiveTab] = useState("documents");
  const [userProfile, setUserProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();

  // Fetch user profile with error handling
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          onLogout();
          return;
        }

        // const response = await axios.get("http://localhost:8000/api/profile", {
          const response = await axios.get("https://akredoc.my.id/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          setUserProfile(response.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.response?.status === 401) {
          onLogout();
        }
      }
    };

    fetchUserProfile();
  }, [onLogout]);

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('ppepp') || path.includes('manajemen-dokumen')) {
      setActiveTab('documents');
    } else if (path.includes('log-aktivitas') || path.includes('statistics')) {
      setActiveTab('statistics');
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onLogout={onLogout}
        notifications={notifications}
      />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;