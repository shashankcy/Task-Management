import AuthInput from "./AuthInput";
import AuthToggle from "./AuthToggle";

export default function AuthForm({
  isLogin,
  setIsLogin,
  formData = { name: "", email: "", password: "" }, // Default values to avoid undefined errors
  handleChange,
  handleSubmit,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Show Full Name input only if not in login mode */}
      {!isLogin && (
        <AuthInput
          label="Full Name"
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      )}

      {/* Email Input */}
      <AuthInput
        label="Email Address"
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      {/* Password Input */}
      <AuthInput
        label="Password"
        type="password"
        id="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
        minLength="6"
      />

      <div className="pt-1">
        <button
          type="submit"
          className="w-full flex justify-center items-center gap-x-2 py-3 px-4 
                    bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg
                    shadow-sm transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isLogin ? (
            <>
              <span>Sign In</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </>
          )}
        </button>
      </div>

      <AuthToggle isLogin={isLogin} setIsLogin={setIsLogin} />
    </form>
  );
}
