import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import RepoAnalyzer from '@/components/RepoAnalyzer';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="repo-analyzer-theme">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <RepoAnalyzer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;