import React, { useState, useEffect } from "react";

interface FormData {
  name: string;
}

interface Errors {
  name?: string;
  submit?: string;
}

interface ProfileFormProps {
  onProfileComplete: (name: string) => Promise<void>;
  userEmail: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onProfileComplete, userEmail }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: ''
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await onProfileComplete(formData.name.trim());
    } catch (error) {
      console.error('Profile completion error:', error);
      setErrors({ submit: 'Failed to complete registration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof Errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-400 bg-clip-text text-transparent">
          OpenLingua
        </div>
      </div>

      {/* Main Form Container */}
      <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-400 bg-clip-text text-transparent mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-400 text-sm">
              We're creating your account for <span className="text-purple-400">{userEmail}</span>
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 ${
                  errors.name ? 'border-red-400' : ''
                }`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-sm text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transform'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              By completing registration, you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;