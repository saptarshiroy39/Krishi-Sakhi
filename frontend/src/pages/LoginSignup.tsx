import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Sun, Moon, Globe } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'

const LoginSignup: React.FC = () => {
  const navigate = useNavigate()
  const { t, toggleLanguage, language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Navigate to home page after successful login
      navigate('/')
    }, 2000)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (signupData.password !== signupData.confirmPassword) {
      alert(t('passwordMismatch', { en: 'Passwords do not match', ml: 'പാസ്വേഡുകൾ പൊരുത്തപ്പെടുന്നില്ല' }))
      return
    }
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Navigate to home page after successful signup
      navigate('/')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Content Section */}
      <div className="w-full max-w-md mx-auto px-6 py-12">
        {/* Form Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 mb-6">
          
          {/* Login/Signup Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium ${
                isLogin 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('login', { en: 'Login', ml: 'ലോഗിൻ' })}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium ${
                !isLogin 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('signup', { en: 'Sign Up', ml: 'സൈൻ അപ്പ്' })}
            </button>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email or Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                  {t('emailOrPhone', { en: 'Email or Phone', ml: 'ഇമെയിൽ അല്ലെങ്കിൽ ഫോൺ' })}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 "
                    placeholder={t('emailOrPhonePlaceholder', { en: 'Enter your email or phone number', ml: 'നിങ്ങളുടെ ഇമെയിൽ അല്ലെങ്കിൽ ഫോൺ നമ്പർ നൽകുക' })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                  {t('password', { en: 'Password', ml: 'പാസ്വേഡ്' })}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 "
                    placeholder={t('passwordPlaceholder', { en: 'Enter your password', ml: 'നിങ്ങളുടെ പാസ്വേഡ് നൽകുക' })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 "
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary-500">
                    {t('forgotPassword', { en: 'Forgot Password?', ml: 'പാസ്വേഡ് മറന്നോ?' })}
                  </Link>
                </div>              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-500 text-white py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('login', { en: 'Login', ml: 'ലോഗിൻ' })
                )}
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                  {t('fullName', { en: 'Full Name', ml: 'പൂർണ്ണ നാമം' })}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 "
                    placeholder={t('namePlaceholder', { en: 'Enter your full name', ml: 'നിങ്ങളുടെ പൂർണ്ണ നാമം നൽകുക' })}
                    required
                  />
                </div>
              </div>

              {/* Email or Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                  {t('emailOrPhone', { en: 'Email or Phone', ml: 'ഇമെയിൽ അല്ലെങ്കിൽ ഫോൺ' })}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 "
                    placeholder={t('emailOrPhonePlaceholder', { en: 'Enter your email or phone number', ml: 'നിങ്ങളുടെ ഇമെയിൽ അല്ലെങ്കിൽ ഫോൺ നമ്പർ നൽകുക' })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                  {t('password', { en: 'Password', ml: 'പാസ്വേഡ്' })}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 "
                    placeholder={t('passwordPlaceholder', { en: 'Enter your password', ml: 'നിങ്ങളുടെ പാസ്വേഡ് നൽകുക' })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 "
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                  {t('confirmPassword', { en: 'Confirm Password', ml: 'പാസ്വേഡ് സ്ഥിരീകരിക്കുക' })}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 "
                    placeholder={t('confirmPasswordPlaceholder', { en: 'Confirm your password', ml: 'നിങ്ങളുടെ പാസ്വേഡ് സ്ഥിരീകരിക്കുക' })}
                    required
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-[14px] h-[14px] text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-1 flex-shrink-0"
                  required
                />
                <label htmlFor="terms" className="text-[11px] leading-tight text-gray-600 dark:text-gray-400">
                  {t('termsAgree', { en: 'I agree to the', ml: 'ഞാൻ സമ്മതിക്കുന്നു' })}{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                    {t('termsConditions', { en: 'Terms & Conditions', ml: 'നിയമങ്ങളും വ്യവസ്ഥകളും' })}
                  </Link>
                </label>
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('createAccount', { en: 'Create Account', ml: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക' })
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? (
              <p>
                {t('noAccount', { en: "Don't have an account?", ml: 'അക്കൗണ്ടില്ലേ?' })}{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary-600 font-medium"
                >
                  {t('signupNow', { en: 'Sign up now', ml: 'ഇപ്പോൾ സൈൻ അപ്പ് ചെയ്യുക' })}
                </button>
              </p>
            ) : (
              <p>
                {t('haveAccount', { en: 'Already have an account?', ml: 'ഇതിനകം അക്കൗണ്ടുണ്ടോ?' })}{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary-600 font-medium"
                >
                  {t('loginNow', { en: 'Login now', ml: 'ഇപ്പോൾ ലോഗിൻ ചെയ്യുക' })}
                </button>
              </p>
            )}

            {/* Language and Theme Toggle Buttons */}
            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'ML' : 'EN'}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSignup
