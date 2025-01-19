import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "react-router-dom";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("https://akredoc.my.id/api/login", {
        name: username.trim(),
        password: password,
        remember_me: rememberMe // Send remember_me preference to server
      });

      if (response.status === 200) {
        const { token, remember_token } = response.data;

        // Store auth token based on remember me preference
        if (rememberMe) {
          localStorage.setItem("token", token);
          if (remember_token) {
            localStorage.setItem("remember_token", remember_token);
          }
        } else {
          sessionStorage.setItem("token", token);
          // Clear any existing remember token
          localStorage.removeItem("remember_token");
        }

        onLogin(token);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Add this function to check for remember token on app load
  const checkRememberToken = async () => {
    const rememberToken = localStorage.getItem("remember_token");

    if (rememberToken) {
      try {
        const response = await axios.post("https://akredoc.my.id/api/login/remember", {
          remember_token: rememberToken
        });

        if (response.status === 200) {
          const { token } = response.data;
          localStorage.setItem("token", token);
          onLogin(token);
        }
      } catch (error) {
        console.error("Auto login failed:", error);
        // Clear invalid remember token
        localStorage.removeItem("remember_token");
      }
    }
  };

  // Add useEffect to check remember token on component mount
  useEffect(() => {
    checkRememberToken();
  }, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Selamat Datang Di AkreDoc Teknik Informatika
          </h2>
          <p className="mt-2 text-sm text-gray-600">Masuk ke akun Anda</p>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Nama Pengguna
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Masukkan nama pengguna Anda"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Kata sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-black rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-600 focus:outline-none"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 bg-white rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-black"
              >
                Ingat Saya
              </label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-green-600 hover:text-emerald-700">
                Lupa Kata Sandi
              </Link>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-emerald-700 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all duration-200"

          >
            Masuk
            {loading && <p className="text-white text-sm">Sedang masuk...</p>}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;
