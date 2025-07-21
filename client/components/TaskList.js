import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Link from "next/link";

export default function TaskList({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  showControls = true,
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(null);

  const handleDelete = async (taskId) => {
    setIsDeleting(taskId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Task deleted successfully");
      if (onTaskDelete) onTaskDelete(taskId);
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Task status updated");
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks found</p>
      ) : (
        tasks.map((task) => (
          <div key={task._id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{task.title}</h3>
                <p className="text-gray-600">{task.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : task.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {task.status.replace("-", " ")}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {task.assignedTo && (
                    <p>Assigned to: {task.assignedTo.name}</p>
                  )}
                  <p>Created by: {task.createdBy.name}</p>
                </div>
              </div>
              {showControls && (
                <div className="flex space-x-2">
                  <Link href={`/tasks/edit/${task._id}`}>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(task._id)}
                    disabled={isDeleting === task._id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {isDeleting === task._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
            {showControls && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleStatusChange(task._id, "todo")}
                  className={`text-xs px-2 py-1 rounded ${
                    task.status === "todo"
                      ? "bg-gray-200"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => handleStatusChange(task._id, "in-progress")}
                  className={`text-xs px-2 py-1 rounded ${
                    task.status === "in-progress"
                      ? "bg-blue-200"
                      : "bg-blue-100 hover:bg-blue-200"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusChange(task._id, "completed")}
                  className={`text-xs px-2 py-1 rounded ${
                    task.status === "completed"
                      ? "bg-green-200"
                      : "bg-green-100 hover:bg-green-200"
                  }`}
                >
                  Completed
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
