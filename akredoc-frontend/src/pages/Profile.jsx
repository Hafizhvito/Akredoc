import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Lock, Save, AlertCircle, ChevronLeft, Shield, Calendar } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    role: "",
    created_at: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    current_password: "",
    new_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      // const response = await axios.get("http://localhost:8000/api/profile", {
      const response = await axios.get("https://akredoc.my.id/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      setFormData((prev) => ({ ...prev, name: response.data.name }));
    } catch (err) {
      setError("Gagal memuat profil");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      // await axios.put("http://localhost:8000/api/profile", formData, {
      await axios.put("https://akredoc.my.id/api/profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Profil berhasil diperbarui");
      setError("");
      fetchProfile();

      // Log profile update activity to the backend
      // await axios.post("http://localhost:8000/api/log-activity", {
      await axios.post("https://akredoc.my.id/api/log-activity", {
        action: 'update_profile',
        action_type: 'update',
        description: 'Pengguna memperbarui profil mereka',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memperbarui profil");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-none w-full max-w-md relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

        {/* Back Button with hover effect */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-all duration-300 group"
        >
          <ChevronLeft className="h-6 w-6 text-gray-500 group-hover:text-emerald-600" />
        </button>

        {/* Header with enhanced typography */}
        <div className="text-center mb-8 mt-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Pengaturan Profil
          </h2>
          <p className="mt-2 text-gray-600">Kelola preferensi akun Anda</p>
        </div>

        {/* Alert Messages with animation */}
        {(error || success) && (
          <div
            className={`p-4 mb-6 rounded-lg flex items-center gap-2 animate-fadeIn ${error ? "bg-red-50 text-red-700 border border-red-100" :
              "bg-green-50 text-green-700 border border-green-100"
              }`}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error || success}</span>
          </div>
        )}

        {/* Profile Info Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600 text-center">Role</p>
            <p className="font-semibold text-gray-900 text-center mt-1">{profile.role}</p>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-teal-600" />
            </div>
            <p className="text-sm text-gray-600 text-center">Bergabung Sejak</p>
            <p className="font-semibold text-gray-900 text-center mt-1">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors duration-300" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="pl-10 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white transition-all duration-300"
                placeholder="Masukkan nama pengguna"
              />
            </div>
          </div>

          {/* Password Fields */}
          {['current_password', 'new_password'].map((field, index) => (
            <div key={field} className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field === 'current_password' ? 'Current Password' : 'New Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors duration-300" />
                </div>
                <input
                  type="password"
                  value={formData[field]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="pl-10 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white transition-all duration-300"
                  placeholder={`Enter ${field === 'current_password' ? 'current' : 'new'} password`}
                />
              </div>
            </div>
          ))}

          {/* Submit Button with loading state */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;