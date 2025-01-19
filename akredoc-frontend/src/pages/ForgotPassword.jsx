import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [step, setStep] = useState(1); // Step 1: Email input, Step 2: User selection

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("https://akredoc.my.id/api/check-email-users", {
        email
      });

      if (response.data.users && response.data.users.length > 0) {
        setUsers(response.data.users);
        setStep(2); // Move to user selection step
      } else {
        setError("Email tidak ditemukan");
      }
    } catch (err) {
      setError("Gagal memeriksa email. Silakan coba lagi.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("https://akredoc.my.id/api/forgot-password", {
        email,
        user_id: selectedUser
      });

      if (response.status === 200) {
        setMessage("Link reset password telah dikirim ke email Anda.");
        setEmail("");
        setSelectedUser("");
        setStep(1);
      }
    } catch (err) {
      setError("Gagal mengirim link reset password. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Lupa Password?</h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 ? "Masukkan email Anda" : "Pilih akun Anda"}
          </p>
        </div>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Masukkan email Anda"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-emerald-700 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all duration-200"
            >
              Lanjutkan
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Pilih Akun
              </label>
              <select
                id="user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                required
              >
                <option value="">Pilih akun Anda</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role || 'User'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-200"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 px-4 bg-emerald-700 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all duration-200"
              >
                Reset Password
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-emerald-700 hover:text-green-700"
          >
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;