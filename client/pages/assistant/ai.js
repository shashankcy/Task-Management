import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  CheckSquare,
  ListTodo,
  AlertCircle,
  PlusCircle,
  X,
  Send,
  ChevronRight,
} from "lucide-react";

function TaskAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [taskStep, setTaskStep] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
    assignedTo: "",
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in and has a token
    const token = localStorage.getItem("token");
    if (token) {
      setUserToken(token);
      fetchUsers(token);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const fetchUsers = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assistant/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserNameById = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user ? user.name : "Unassigned";
  };

  const fetchTasks = async (type = "assigned") => {
    if (!userToken) {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Please sign in to view your tasks.",
          sender: "bot",
        },
      ]);
      return [];
    }

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assistant/tasks/${type}`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const tasks = await response.json();
      return tasks;
    } catch (error) {
      console.error(`Error fetching ${type} tasks:`, error);
      return [];
    }
  };

  const deleteTask = async (taskId) => {
    if (!userToken) {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Please sign in to delete tasks.",
          sender: "bot",
        },
      ]);
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assistant/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete task");
      }

      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ Error: ${error.message}`,
          sender: "bot",
        },
      ]);
      return false;
    }
  };

  const handleTaskCreation = async (message) => {
    if (!userToken) {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Please sign in to create tasks.",
          sender: "bot",
        },
      ]);
      setIsCreatingTask(false);
      return;
    }

    try {
      switch (taskStep) {
        case 0:
          if (message.trim()) {
            setNewTask((prev) => ({ ...prev, title: message }));
            setMessages((prev) => [
              ...prev,
              {
                text: "📝 Please enter a description for the task:",
                sender: "bot",
              },
            ]);
            setTaskStep(1);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                text: "⚠️ Title cannot be empty. Please enter a task title:",
                sender: "bot",
              },
            ]);
          }
          break;

        case 1:
          if (message.trim()) {
            setNewTask((prev) => ({ ...prev, description: message }));
            setMessages((prev) => [
              ...prev,
              {
                text: `🚩 Select priority level:\n• Type '1' for Low\n• Type '2' for Medium\n• Type '3' for High`,
                sender: "bot",
              },
            ]);
            setTaskStep(2);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                text: "⚠️ Description cannot be empty. Please enter a description:",
                sender: "bot",
              },
            ]);
          }
          break;

        case 2:
          if (["1", "2", "3"].includes(message)) {
            const priorityMap = { 1: "low", 2: "medium", 3: "high" };
            setNewTask((prev) => ({ ...prev, priority: priorityMap[message] }));

            setMessages((prev) => [
              ...prev,
              {
                text: "📅 Enter due date (YYYY-MM-DD format):",
                sender: "bot",
              },
            ]);
            setTaskStep(3);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                text: "⚠️ Please enter '1' for Low, '2' for Medium, or '3' for High priority:",
                sender: "bot",
              },
            ]);
          }
          break;

        case 3:
          // Simple date validation
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(message)) {
            const inputDate = new Date(message);
            if (!isNaN(inputDate.getTime())) {
              setNewTask((prev) => ({ ...prev, dueDate: message }));

              if (users.length > 0) {
                const userOptions = users
                  .map(
                    (user, index) =>
                      `• Type '${index + 1}' for ${user.name} (${user.email})`
                  )
                  .join("\n");

                setMessages((prev) => [
                  ...prev,
                  {
                    text: `👤 Assign to user:\n${userOptions}\n• Type '0' to leave unassigned`,
                    sender: "bot",
                  },
                ]);
                setTaskStep(4);
              } else {
                // Skip assignment if no users available
                submitNewTask();
              }
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  text: "⚠️ Invalid date. Please enter date in YYYY-MM-DD format:",
                  sender: "bot",
                },
              ]);
            }
          } else {
            setMessages((prev) => [
              ...prev,
              {
                text: "⚠️ Please use YYYY-MM-DD format (e.g., 2025-05-15):",
                sender: "bot",
              },
            ]);
          }
          break;

        case 4:
          const userIndex = parseInt(message);
          if (
            (userIndex >= 0 && userIndex <= users.length) ||
            message === "0"
          ) {
            let assignedUserId = null;
            if (userIndex > 0) {
              assignedUserId = users[userIndex - 1]._id;
            }

            setNewTask((prev) => ({ ...prev, assignedTo: assignedUserId }));
            await submitNewTask();
          } else {
            setMessages((prev) => [
              ...prev,
              {
                text: `⚠️ Please enter a number between 0 and ${users.length}:`,
                sender: "bot",
              },
            ]);
          }
          break;
      }
    } catch (error) {
      console.error("Task creation error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "❌ An error occurred during task creation. Please try again.",
          sender: "bot",
        },
      ]);
      resetTaskCreation();
    }
  };

  const handleTaskUpdate = async (message) => {
    if (!userToken || !currentTaskId) {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Unable to update task. Please try again.",
          sender: "bot",
        },
      ]);
      setIsUpdatingTask(false);
      return;
    }

    try {
      switch (taskStep) {
        case 0:
          setNewTask((prev) => ({ ...prev, title: message || prev.title }));
          setMessages((prev) => [
            ...prev,
            {
              text: `📝 Current description: "${newTask.description}"\nEnter new description or type "skip" to keep current:`,
              sender: "bot",
            },
          ]);
          setTaskStep(1);
          break;

        case 1:
          setNewTask((prev) => ({
            ...prev,
            description: message === "skip" ? prev.description : message,
          }));
          setMessages((prev) => [
            ...prev,
            {
              text: `🚩 Current priority: ${newTask.priority}\nSelect new priority level:\n• Type '1' for Low\n• Type '2' for Medium\n• Type '3' for High\n• Type 'skip' to keep current`,
              sender: "bot",
            },
          ]);
          setTaskStep(2);
          break;

        case 2:
          if (["1", "2", "3"].includes(message)) {
            const priorityMap = { 1: "low", 2: "medium", 3: "high" };
            setNewTask((prev) => ({ ...prev, priority: priorityMap[message] }));
          } else if (message.toLowerCase() !== "skip") {
            setMessages((prev) => [
              ...prev,
              {
                text: "⚠️ Please enter '1', '2', '3', or 'skip':",
                sender: "bot",
              },
            ]);
            return;
          }

          setMessages((prev) => [
            ...prev,
            {
              text: `📊 Current status: ${newTask.status}\nSelect new status:\n• Type '1' for Pending\n• Type '2' for In-Progress\n• Type '3' for Completed\n• Type 'skip' to keep current`,
              sender: "bot",
            },
          ]);
          setTaskStep(3);
          break;

        case 3:
          if (["1", "2", "3"].includes(message)) {
            const statusMap = {
              1: "pending",
              2: "in-progress",
              3: "completed",
            };
            setNewTask((prev) => ({ ...prev, status: statusMap[message] }));
          } else if (message.toLowerCase() !== "skip") {
            setMessages((prev) => [
              ...prev,
              {
                text: "⚠️ Please enter '1', '2', '3', or 'skip':",
                sender: "bot",
              },
            ]);
            return;
          }

          setMessages((prev) => [
            ...prev,
            {
              text: `📅 Current due date: ${formatDate(
                newTask.dueDate
              )}\nEnter new due date (YYYY-MM-DD) or type "skip" to keep current:`,
              sender: "bot",
            },
          ]);
          setTaskStep(4);
          break;

        case 4:
          if (message.toLowerCase() !== "skip") {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(message)) {
              const inputDate = new Date(message);
              if (!isNaN(inputDate.getTime())) {
                setNewTask((prev) => ({ ...prev, dueDate: message }));
              } else {
                setMessages((prev) => [
                  ...prev,
                  {
                    text: "⚠️ Invalid date. Please enter date in YYYY-MM-DD format or 'skip':",
                    sender: "bot",
                  },
                ]);
                return;
              }
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  text: "⚠️ Please use YYYY-MM-DD format (e.g., 2025-05-15) or type 'skip':",
                  sender: "bot",
                },
              ]);
              return;
            }
          }

          if (users.length > 0) {
            const assignedUserName = newTask.assignedTo
              ? getUserNameById(newTask.assignedTo)
              : "Unassigned";

            const userOptions = users
              .map(
                (user, index) =>
                  `• Type '${index + 1}' for ${user.name} (${user.email})`
              )
              .join("\n");

            setMessages((prev) => [
              ...prev,
              {
                text: `👤 Currently assigned to: ${assignedUserName}\nAssign to new user:\n${userOptions}\n• Type '0' to leave unassigned\n• Type 'skip' to keep current`,
                sender: "bot",
              },
            ]);
            setTaskStep(5);
          } else {
            await submitUpdatedTask();
          }
          break;

        case 5:
          if (message.toLowerCase() !== "skip") {
            const userIndex = parseInt(message);
            if (
              (userIndex >= 0 && userIndex <= users.length) ||
              message === "0"
            ) {
              let assignedUserId = null;
              if (userIndex > 0) {
                assignedUserId = users[userIndex - 1]._id;
              }
              setNewTask((prev) => ({ ...prev, assignedTo: assignedUserId }));
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  text: `⚠️ Please enter a number between 0 and ${users.length}, or 'skip':`,
                  sender: "bot",
                },
              ]);
              return;
            }
          }

          await submitUpdatedTask();
          break;
      }
    } catch (error) {
      console.error("Task update error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "❌ An error occurred while updating the task. Please try again.",
          sender: "bot",
        },
      ]);
      resetTaskUpdate();
    }
  };

  const submitNewTask = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assistant/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(newTask),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create task");
      }

      const createdTask = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          text: `✅ Task Created Successfully!\n\n📌 Title: ${
            createdTask.title
          }\n📝 Description: ${createdTask.description}\n🚩 Priority: ${
            createdTask.priority
          }\n📅 Due: ${formatDate(createdTask.dueDate)}\n👤 Assigned: ${
            createdTask.assignedTo
              ? getUserNameById(createdTask.assignedTo)
              : "Unassigned"
          }`,
          sender: "bot",
        },
      ]);

      resetTaskCreation();
    } catch (error) {
      console.error("Error submitting task:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ Error: ${error.message}`,
          sender: "bot",
        },
      ]);
      resetTaskCreation();
    }
  };

  const submitUpdatedTask = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assistant/tasks/${currentTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(newTask),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update task");
      }

      const updatedTask = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          text: `✅ Task Updated Successfully!\n\n📌 Title: ${
            updatedTask.title
          }\n📝 Description: ${updatedTask.description}\n🚩 Priority: ${
            updatedTask.priority
          }\n📊 Status: ${updatedTask.status}\n📅 Due: ${formatDate(
            updatedTask.dueDate
          )}\n👤 Assigned: ${
            updatedTask.assignedTo
              ? getUserNameById(updatedTask.assignedTo._id)
              : "Unassigned"
          }`,
          sender: "bot",
        },
      ]);

      resetTaskUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ Error: ${error.message}`,
          sender: "bot",
        },
      ]);
      resetTaskUpdate();
    }
  };

  const resetTaskCreation = () => {
    setIsCreatingTask(false);
    setTaskStep(0);
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: "",
      assignedTo: "",
    });
  };

  const resetTaskUpdate = () => {
    setIsUpdatingTask(false);
    setTaskStep(0);
    setCurrentTaskId(null);
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: "",
      assignedTo: "",
    });
  };

  const handleViewTasks = async (type) => {
    const tasks = await fetchTasks(type);

    if (tasks.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          text: `📭 You have no ${type} tasks.`,
          sender: "bot",
        },
      ]);
    } else {
      const tasksList = tasks
        .map((task, index) => {
          const statusEmoji = {
            pending: "⏳",
            "in-progress": "🔄",
            completed: "✅",
          };

          const priorityEmoji = {
            low: "🔵",
            medium: "🟡",
            high: "🔴",
          };

          return (
            `📋 Task #${index + 1}: ${task._id}\n` +
            `📌 Title: ${task.title}\n` +
            `${statusEmoji[task.status]} Status: ${task.status}\n` +
            `${priorityEmoji[task.priority]} Priority: ${task.priority}\n` +
            `📅 Due: ${formatDate(task.dueDate)}\n` +
            `👤 Created by: ${task.createdBy?.name || "Unknown"}\n` +
            `👤 Assigned to: ${task.assignedTo?.name || "Unassigned"}\n` +
            "──────────────"
          );
        })
        .join("\n\n");

      setMessages((prev) => [
        ...prev,
        {
          text: `📋 Your ${
            type.charAt(0).toUpperCase() + type.slice(1)
          } Tasks:\n\n${tasksList}`,
          sender: "bot",
        },
      ]);
    }
  };

  const initiateUpdateTask = async (taskId) => {
    if (!userToken) {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Please sign in to update tasks.",
          sender: "bot",
        },
      ]);
      return;
    }

    try {
      // Get the task details first
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assistant/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Task not found or you don't have permission to update it."
        );
      }

      const task = await response.json();

      setNewTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo?._id || null,
      });

      setCurrentTaskId(taskId);
      setIsUpdatingTask(true);
      setTaskStep(0);

      setMessages((prev) => [
        ...prev,
        {
          text: `📝 Updating Task: ${task.title}\n\nCurrent title: "${task.title}"\nEnter new title or type "skip" to keep current:`,
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error("Error initiating task update:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ Error: ${error.message}`,
          sender: "bot",
        },
      ]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const success = await deleteTask(taskId);

    if (success) {
      setMessages((prev) => [
        ...prev,
        {
          text: "✅ Task deleted successfully!",
          sender: "bot",
        },
      ]);
    }
  };

  const processCommand = async (message) => {
    const lowerMessage = message.toLowerCase().trim();

    // Check if message contains a task ID for updating or deleting
    const updateMatch = lowerMessage.match(/update task\s+([a-f0-9]+)/i);
    const deleteMatch = lowerMessage.match(/delete task\s+([a-f0-9]+)/i);

    if (updateMatch) {
      await initiateUpdateTask(updateMatch[1]);
      return true;
    }

    if (deleteMatch) {
      await handleDeleteTask(deleteMatch[1]);
      return true;
    }

    // Otherwise process based on command text
    if (lowerMessage === "create task" || lowerMessage === "new task") {
      setIsCreatingTask(true);
      setTaskStep(0);
      setMessages((prev) => [
        ...prev,
        {
          text: "📌 Please enter a title for the new task:",
          sender: "bot",
        },
      ]);
      return true;
    }

    if (lowerMessage === "view tasks" || lowerMessage === "my tasks") {
      await handleViewTasks("assigned");
      return true;
    }

    if (
      lowerMessage === "created tasks" ||
      lowerMessage === "tasks i created"
    ) {
      await handleViewTasks("created");
      return true;
    }

    if (lowerMessage === "overdue tasks") {
      await handleViewTasks("overdue");
      return true;
    }

    return false;
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { text: message, sender: "user" }]);
    setInput("");

    if (isCreatingTask) {
      await handleTaskCreation(message);
      return;
    }

    if (isUpdatingTask) {
      await handleTaskUpdate(message);
      return;
    }

    // Check if the message is a command
    const isCommand = await processCommand(message);
    if (isCommand) return;

    // If not a specific command, provide help
    setMessages((prev) => [
      ...prev,
      {
        text:
          "I'm your Task Manager Assistant. Here's what I can help you with:\n\n" +
          "• Type 'create task' to add a new task\n" +
          "• Type 'view tasks' to see tasks assigned to you\n" +
          "• Type 'created tasks' to see tasks you created\n" +
          "• Type 'overdue tasks' to see your overdue tasks\n" +
          "• Type 'update task [ID]' to modify a task\n" +
          "• Type 'delete task [ID]' to remove a task",
        sender: "bot",
      },
    ]);
  };

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        text:
          "👋 Hello! I'm your Task Manager Assistant. How can I help you today?\n\n" +
          "• Type 'create task' to add a new task\n" +
          "• Type 'view tasks' to see tasks assigned to you\n" +
          "• Type 'created tasks' to see tasks you created\n" +
          "• Type 'overdue tasks' to see your overdue tasks",
        sender: "bot",
      },
    ]);
  }, []);

  return (
    <div className="flex flex-col items-center h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="flex flex-col w-full max-w-md p-4 bg-white/90 shadow-lg rounded-lg mt-10 mb-4 space-y-4 overflow-auto h-3/4">
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-md mb-4">
          <h1 className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <CheckSquare className="w-6 h-6" />
            Task Manager Assistant
          </h1>
        </div>

        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[80%] p-4 rounded-xl shadow-md ${
                message.sender === "user"
                  ? "bg-blue-500 text-white self-end rounded-br-none"
                  : "bg-white text-gray-800 self-start rounded-bl-none"
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({ node, inline, className, children, ...props }) => (
                    <code className="bg-gray-100 px-1 rounded" {...props}>
                      {children}
                    </code>
                  ),
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div className="flex w-full max-w-md p-3 bg-white/95 rounded-lg shadow-lg space-x-2 items-center mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          className="w-full p-4 text-lg text-gray-800 border-2 border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
        />
        <button
          onClick={() => sendMessage(input)}
          className="p-4 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Send
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button
          onClick={() => sendMessage("create task")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusCircle className="w-4 h-4" />
          Create Task
        </button>
        <button
          onClick={() => sendMessage("view tasks")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <ListTodo className="w-4 h-4" />
          View Tasks
        </button>
        <button
          onClick={() => sendMessage("overdue tasks")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <AlertCircle className="w-4 h-4" />
          Overdue Tasks
        </button>
      </div>
    </div>
  );
}

export default TaskAssistant;
