import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import config from '../config'

export default function GoogleLoginButton() {
      const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
   navigate("/landingPage");
  };

  return (
    <div className="w-full">
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                   text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 
                   disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            Connecting...
          </div>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M21.35 11.1H12v2.82h5.38c-.23 1.23-.93 2.27-1.97 2.95v2.45h3.18c1.86-1.72 2.93-4.25 2.93-7.22 0-.63-.06-1.24-.17-1.83z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.18-2.45c-.88.59-2 .93-3.43.93-2.64 0-4.87-1.78-5.66-4.18H3.05v2.54C4.69 19.99 8.09 22 12 22z" />
              <path fill="#FBBC05" d="M6.34 13.87c-.2-.59-.31-1.22-.31-1.87 0-.65.11-1.28.31-1.87V7.59H3.05A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.05 4.41l3.29-2.54z" />
              <path fill="#EA4335" d="M12 6.54c1.47 0 2.79.51 3.83 1.51l2.86-2.86C16.96 3.9 14.7 3 12 3 8.09 3 4.69 5.01 3.05 7.59l3.29 2.54c.79-2.4 3.02-4.18 5.66-4.18z" />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}