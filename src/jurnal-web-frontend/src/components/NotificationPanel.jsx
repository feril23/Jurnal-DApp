import React from "react";

function NotificationPanel({ notifications, markNotificationsAsRead }) {
  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      markNotificationsAsRead(unreadIds);
    }
  };

  return (
    <div className="absolute top-14 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-3 border-b flex justify-between items-center">
        <h4 className="font-bold text-gray-800">Notifikasi</h4>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-indigo-600 font-semibold hover:underline"
        >
          Tandai semua dibaca
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={Number(notif.id)}
              className={`p-3 border-b text-sm ${
                !notif.isRead ? "bg-indigo-50" : "bg-white"
              }`}
            >
              <p className="text-gray-700">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(Number(notif.timestamp) / 1000000).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-gray-500 text-sm">
            Tidak ada notifikasi.
          </p>
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
