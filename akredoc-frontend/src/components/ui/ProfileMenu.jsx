// File: src/components/ui/ProfileMenu.jsx
import React from 'react';
import { User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileMenu = ({ show, setShow, userProfile, onLogout }) => {
    return (
        <div className="relative">
            <button
                onClick={() => setShow(!show)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
                <User className="h-5 w-5 text-black" />
            </button>

            {show && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                    <div className="py-3">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <p className="font-medium text-sm text-gray-800">
                                {userProfile?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {userProfile?.role || "Role"}
                            </p>
                        </div>
                        <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                            Profile Settings
                        </Link>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileMenu;