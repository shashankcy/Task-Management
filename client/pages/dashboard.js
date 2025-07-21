import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";
import TaskAssistant from "./assistant/ai";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import NotificationBell from "./NotificationBell";

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssistant, setShowAssistant] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [isHoveringAssistant, setIsHoveringAssistant] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    dueDate: "",
  });
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "",
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userData, setUserData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      socket.emit("join", userData._id);
    });

    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.success(`New task assigned: ${notification.message}`);
    });

    // Add this to your socket.io connection handler
    socket.on("notification_deleted", ({ notificationId }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount((prev) => prev - 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [userData._id]);

  useEffect(() => {
    if (userData._id) {
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(response.data);
          setNotifications(response.data);
          setUnreadCount(response.data.filter((n) => !n.read).length);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };
      fetchNotifications();
    }
  }, [userData._id]);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications(notifications.filter((n) => n._id !== notificationId));
      setUnreadCount((prev) => prev - 1);
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const userResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserData(userResponse.data);
        await fetchTasks(activeTab);

        const usersResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAvailableUsers(usersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Session expired or invalid");
        localStorage.removeItem("token");
        router.push("/");
      }
    };

    fetchProtectedData();
  }, [router, activeTab]);

  const fetchTasks = async (tab) => {
    setTabLoading(true);
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";

      switch (tab) {
        case "assigned":
          endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/assigned`;
          break;
        case "created":
          endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/created`;
          break;
        case "overdue":
          endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/overdue`;
          break;
        default:
          endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/assigned`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`,
        newTask,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Task created successfully");
      setShowNewTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assignedTo: "",
      });
      fetchTasks(activeTab);
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Task updated successfully");
      fetchTasks(activeTab);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Task deleted successfully");
        fetchTasks(activeTab);
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filters.status === "" || task.status === filters.status;

    const matchesPriority =
      filters.priority === "" || task.priority === filters.priority;

    let matchesDueDate = true;
    if (filters.dueDate !== "") {
      const today = new Date();
      const taskDate = new Date(task.dueDate);

      if (filters.dueDate === "today") {
        matchesDueDate = taskDate.toDateString() === today.toDateString();
      } else if (filters.dueDate === "week") {
        const weekLater = new Date();
        weekLater.setDate(today.getDate() + 7);
        matchesDueDate = taskDate >= today && taskDate <= weekLater;
      } else if (filters.dueDate === "month") {
        const monthLater = new Date();
        monthLater.setMonth(today.getMonth() + 1);
        matchesDueDate = taskDate >= today && taskDate <= monthLater;
      }
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesDueDate;
  });

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const taskItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 },
    },
  };

  const tabButtonVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
    },
  };

  const assistantButtonVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.1,
      rotate: 10,
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  const fetchAuditLogs = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}/audit-logs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAuditLogs(response.data);
      setSelectedTaskForAudit(taskId);
      setShowAuditLogs(true);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
    }
  };
  return (
    <div
      className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Floating Assistant Button */}
      <motion.button
        onClick={() => setShowAssistant(!showAssistant)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl hover:shadow-2xl z-50 flex items-center justify-center ${
          darkMode
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        aria-label="Open assistant"
        variants={assistantButtonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onMouseEnter={() => setIsHoveringAssistant(true)}
        onMouseLeave={() => setIsHoveringAssistant(false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        {isHoveringAssistant && (
          <motion.span
            className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            Task Assistant
          </motion.span>
        )}
      </motion.button>

      {/* Assistant Component */}
      <AnimatePresence>
        {showAssistant && (
          <motion.div
            className="fixed bottom-32 right-6 w-80 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <TaskAssistant
              onClose={() => setShowAssistant(false)}
              tasks={tasks}
              user={userData}
              darkMode={darkMode}
              onCreateTask={(taskData) => {
                setNewTask(taskData);
                setShowNewTaskModal(true);
                setShowAssistant(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav
        className={`shadow-sm p-4 border-b sticky top-0 z-40 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            TaskFlow
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                darkMode
                  ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              markAsRead={markAsRead}
              darkMode={darkMode}
              deleteNotification={deleteNotification}
            />
            <motion.button
              onClick={handleLogout}
              className={`py-2 px-4 rounded-lg text-sm flex items-center ${
                darkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 mt-8 pb-16">
        <div
          className={`rounded-xl shadow-md p-6 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Welcome Message */}
          <div className="mb-6">
            <h2
              className={`text-xl font-semibold mb-2 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Welcome back,{" "}
              <span className={darkMode ? "text-blue-400" : "text-blue-600"}>
                {userData.name?.split(" ")[0] || "User"}
              </span>
              !
            </h2>
            <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
              Here's what's on your plate today.
            </p>
          </div>

          {/* Task Management Controls */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div className="flex space-x-4 mb-4 md:mb-0">
              {["assigned", "created", "overdue"].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === tab
                      ? darkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${tabLoading && activeTab === tab ? "opacity-75" : ""}`}
                  disabled={tabLoading && activeTab === tab}
                  variants={tabButtonVariants}
                  whileHover={activeTab !== tab ? "hover" : {}}
                  whileTap="tap"
                >
                  {tabLoading && activeTab === tab ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </span>
                  ) : tab === "assigned" ? (
                    "Assigned to Me"
                  ) : tab === "created" ? (
                    "Created by Me"
                  ) : (
                    "Overdue"
                  )}
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={() => setShowNewTaskModal(true)}
              className={`py-2 px-4 rounded-lg flex items-center ${
                darkMode
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              disabled={tabLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create New Task
            </motion.button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
              <div className="w-full md:w-1/3 mb-4 md:mb-0 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pl-10 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                  }`}
                  disabled={tabLoading}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                  }`}
                  disabled={tabLoading}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                  }`}
                  disabled={tabLoading}
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  name="dueDate"
                  value={filters.dueDate}
                  onChange={handleFilterChange}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                  }`}
                  disabled={tabLoading}
                >
                  <option value="">All Due Dates</option>
                  <option value="today">Due Today</option>
                  <option value="week">Due This Week</option>
                  <option value="month">Due This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div>
            {tabLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p
                  className={`mt-2 ${
                    darkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  Loading tasks...
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className={darkMode ? "text-gray-300" : "text-gray-500"}>
                  No tasks found.{" "}
                  {activeTab === "created" && (
                    <span>Create a new task to get started!</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {filteredTasks.map((task) => (
                    <motion.div
                      key={task._id}
                      className={`border rounded-lg p-4 cursor-pointer ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                          : "bg-white"
                      }`}
                      variants={taskItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      layout
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className={`text-lg font-semibold ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {task.title}
                        </h3>
                        <div className="flex space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === "high"
                                ? darkMode
                                  ? "bg-red-900 text-red-200"
                                  : "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                ? darkMode
                                  ? "bg-yellow-900 text-yellow-200"
                                  : "bg-yellow-100 text-yellow-800"
                                : darkMode
                                ? "bg-green-900 text-green-200"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              task.status === "completed"
                                ? darkMode
                                  ? "bg-green-900 text-green-200"
                                  : "bg-green-100 text-green-800"
                                : task.status === "in-progress"
                                ? darkMode
                                  ? "bg-blue-900 text-blue-200"
                                  : "bg-blue-100 text-blue-800"
                                : darkMode
                                ? "bg-yellow-900 text-yellow-200"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`mb-3 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center justify-between text-sm">
                        <div
                          className={
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }
                        >
                          <span className="mr-4">
                            <span className="font-medium">Due:</span>{" "}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <span>
                            {activeTab === "assigned"
                              ? `Created by: ${
                                  task.createdBy?.name || "Unknown"
                                }`
                              : `Assigned to: ${
                                  task.assignedTo?.name || "Unassigned"
                                }`}
                          </span>
                        </div>
                        <div className="flex space-x-2 mt-2 md:mt-0">
                          <motion.button
                            onClick={() => {
                              handleUpdateTask(task._id, {
                                ...task,
                                status:
                                  task.status === "completed"
                                    ? "pending"
                                    : "completed",
                              });
                            }}
                            className={`flex items-center ${
                              darkMode
                                ? "text-blue-400 hover:text-blue-300"
                                : "text-blue-500 hover:text-blue-700"
                            }`}
                            disabled={tabLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {task.status === "completed" ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  />
                                </svg>
                                Mark Incomplete
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Mark Complete
                              </>
                            )}
                          </motion.button>
                          {activeTab === "created" && (
                            <>
                              <motion.button
                                onClick={() => {
                                  setEditTask(task);
                                  setShowEditTaskModal(true);
                                }}
                                className={`flex items-center ${
                                  darkMode
                                    ? "text-yellow-400 hover:text-yellow-300"
                                    : "text-yellow-500 hover:text-yellow-700"
                                }`}
                                disabled={tabLoading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteTask(task._id)}
                                className={`flex items-center ${
                                  darkMode
                                    ? "text-red-400 hover:text-red-300"
                                    : "text-red-500 hover:text-red-700"
                                }`}
                                disabled={tabLoading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      <AnimatePresence>
        {showNewTaskModal && (
          <motion.div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`rounded-xl shadow-xl p-6 w-full max-w-md ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <h2
                className={`text-xl font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Create New Task
              </h2>
              <form onSubmit={handleCreateTask}>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    rows={3}
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Assign To
                  </label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignedTo: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowNewTaskModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Task
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {showEditTaskModal && editTask && (
          <motion.div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`rounded-xl shadow-xl p-6 w-full max-w-md ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <h2
                className={`text-xl font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Edit Task
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateTask(editTask._id, editTask);
                  setShowEditTaskModal(false);
                }}
              >
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTask.title}
                    onChange={(e) =>
                      setEditTask({ ...editTask, title: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Description
                  </label>
                  <textarea
                    value={editTask.description}
                    onChange={(e) =>
                      setEditTask({ ...editTask, description: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    rows={3}
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editTask.dueDate?.split("T")[0] || ""}
                    onChange={(e) =>
                      setEditTask({ ...editTask, dueDate: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Priority
                  </label>
                  <select
                    value={editTask.priority}
                    onChange={(e) =>
                      setEditTask({ ...editTask, priority: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label
                    className={`block text-sm font-bold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Assign To
                  </label>
                  <select
                    value={editTask.assignedTo || ""}
                    onChange={(e) =>
                      setEditTask({ ...editTask, assignedTo: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                        : "bg-white border-gray-300 text-gray-700 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowEditTaskModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Task
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
