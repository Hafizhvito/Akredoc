import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const NotificationsMenu = ({ show, setShow }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (show) {
            fetchNotifications();
        }
    }, [show]);

    const fetchNotifications = async () => {
        try {
            // const response = await axios.get('http://localhost:8000/api/notifications', {
            const response = await axios.get('https://akredoc.my.id/api/notifications', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // Add user feedback
            if (error.response?.status === 500) {
                console.error('Server error:', error.response.data);
            }
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.put(
                `https://akredoc.my.id/api/notifications/${notificationId}/read`,
                // `http://localhost:8000/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    return (
        <div className="relative">
            {show && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                    <div className="p-4">
                        <h3 className="font-semibold mb-3 text-gray-800">Notifikasi</h3>
                        <div className="space-y-2">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 ${!notification.is_read ? 'bg-blue-50' : ''
                                            }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <p className="font-medium text-gray-800">
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">Tidak ada pemberitahuan</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsMenu;