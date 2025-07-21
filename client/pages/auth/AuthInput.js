export default function AuthInput({
  label,
  type,
  id,
  name,
  value,
  onChange,
  required,
  minLength,
}) {
  const placeholderText =
    type === "password"
      ? "••••••••"
      : label
      ? `Enter your ${label.toLowerCase()}`
      : "Enter value";

  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                    transition duration-150 ease-in-out placeholder-gray-400 text-gray-700"
        required={required}
        minLength={minLength}
        placeholder={placeholderText}
      />
      {minLength && type === "password" && (
        <p className="mt-1 text-xs text-gray-500">
          Minimum {minLength} characters
        </p>
      )}
    </div>
  );
}
