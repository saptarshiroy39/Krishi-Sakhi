import React from 'react'
import Header from './Header.tsx'
import BottomNav from './BottomNav.tsx'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 pb-20 pt-16 max-w-4xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

export default Layout