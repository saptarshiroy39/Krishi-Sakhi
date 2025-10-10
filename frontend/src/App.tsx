import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import { NotificationProvider } from './contexts/NotificationContext.tsx'
import Layout from './components/Layout.tsx'
import Home from './pages/Home.tsx'
import Activities from './pages/Activities.tsx'
import Chat from './pages/Chat.tsx'
import Schemes from './pages/Schemes.tsx'
import Knowledge from './pages/Knowledge.tsx'
import Profile from './pages/Profile.tsx'
import Notifications from './pages/Notifications.tsx'
import LoginSignup from './pages/LoginSignup.tsx'

const AppContent = () => {
  const location = useLocation()
  const hideLayoutRoutes = ['/login', '/signup']
  const shouldHideLayout = hideLayoutRoutes.includes(location.pathname)

  if (shouldHideLayout) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Routes>
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/signup" element={<LoginSignup />} />
        </Routes>
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App