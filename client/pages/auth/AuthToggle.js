export default function AuthToggle({ isLogin, setIsLogin }) {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="ml-1.5 font-medium text-indigo-600 hover:text-indigo-500 
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 
                      focus-visible:ring-offset-2 transition-colors duration-200 ease-in-out"
          aria-label={isLogin ? "Switch to sign up" : "Switch to login"}
        >
          {isLogin ? "Sign up" : "Login"}
          <span className="inline-block ml-0.5">→</span>
        </button>
      </p>
    </div>
  );
}
