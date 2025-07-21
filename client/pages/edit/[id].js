import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";
import TaskForm from "../../components/TaskForm.js";

export default function EditTask() {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Fetch task
        const taskRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${id}`,
          config
        );
        setTask(taskRes.data);

        // Fetch users for assignment
        const usersRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`,
          config
        );
        setUsers(usersRes.data);
      } catch (error) {
        toast.error("Failed to fetch task data");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  const handleSuccess = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        Task not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-6">Edit Task</h1>
          <TaskForm task={task} users={users} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
