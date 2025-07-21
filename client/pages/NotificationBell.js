import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell({
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  markAsRead,
  darkMode,
  deleteNotification,
}) {
  const notificationVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowNotifications(!showNotifications)}
        className={`p-2 rounded-full relative ${
          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className={`absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
              darkMode ? "bg-red-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg z-50 ${
              darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`p-2 border-b ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Notifications
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p
                  className={`p-4 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No notifications yet
                </p>
              ) : (
                <ul>
                  <AnimatePresence>
                    {notifications.map((notification) => (
                      // Add the delete button to each notification item
                      <motion.li
                        key={notification._id}
                        variants={notificationVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`border-b ${
                          darkMode
                            ? "border-gray-700 hover:bg-gray-700"
                            : "border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div
                          className={`p-3 flex items-start ${
                            !notification.read
                              ? darkMode
                                ? "bg-blue-900 bg-opacity-30"
                                : "bg-blue-50"
                              : ""
                          }`}
                        >
                          <div className="flex-1">
                            <p
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-800"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className={`text-xs px-2 py-1 rounded ${
                                  darkMode
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-blue-500 hover:bg-blue-600"
                                } text-white`}
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className={`text-xs px-2 py-1 rounded ${
                                darkMode
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-red-500 hover:bg-red-600"
                              } text-white`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
