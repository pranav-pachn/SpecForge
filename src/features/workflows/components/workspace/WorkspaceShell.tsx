"use client";

import React from "react";
import { motion } from "framer-motion";

interface WorkspaceShellProps {
  header: React.ReactNode;
  navigation: React.ReactNode;
  intelligence: React.ReactNode;
  currentStageHeader: React.ReactNode;
  mainContent: React.ReactNode;
  agentActivity: React.ReactNode;
}

export function WorkspaceShell({ 
  header, 
  navigation, 
  intelligence, 
  currentStageHeader, 
  mainContent, 
  agentActivity 
}: WorkspaceShellProps) {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in">
      {/* Top Header Area */}
      {header}

      {/* Main Layout */}
      <div className="flex flex-col gap-8 relative pb-24">
        
        {/* Main Workspace Column (100%) */}
        <div className="w-full">
          {navigation}
          {intelligence}

          <div className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStageHeader}
              {mainContent}
            </motion.div>
          </div>
        </div>

      </div>

      {/* Agent Activity Bottom Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-50/95 dark:bg-[#05050a]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 md:pl-64 transition-transform">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-h-[40vh] overflow-hidden flex flex-col justify-end">
          {agentActivity}
        </div>
      </div>
    </div>
  );
}
