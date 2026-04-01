"use client";

import { useState, useRef } from "react";
import Emulator from "./Screen/Emulator"; // Adjust this import path if needed!

export default function Desktop() {
  // Give it two default icons so you can immediately see where they appear!
const [desktopIcons, setDesktopIcons] = useState(new Set(["My_Computer", "Trash_Bin"]));
  const commandRef = useRef(null);

  // This function receives the filenames from Emulator.jsx
  const handleUpdateIcons = (newFilename) => {
    setDesktopIcons((prev) => {
      const next = new Set(prev);
      // Ignore system programs. Only show user-created files!
      const systemFiles = ['shell', 'ls', 'cat', 'echo', 'mkdir', 'rm', 'writefile', 'clear', 'touch', 'cp', 'guils'];
      
      if (!systemFiles.includes(newFilename)) {
        next.add(newFilename);
      }
      return next;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      
      {/* 1. BACKGROUND: The Pintos Terminal */}
      <div className="absolute inset-0 z-0">
        <Emulator commandRef={commandRef} onUpdateIcons={handleUpdateIcons} />
      </div>

      {/* 2. FOREGROUND: The Desktop Icons */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col flex-wrap gap-4 items-start content-start">
        {Array.from(desktopIcons).map((file, index) => {
          const isFolder = !file.includes("."); // Simple logic: if no dot, it's a folder

          return (
            <div
              key={index}
              className="w-20 flex flex-col items-center justify-center p-2 rounded hover:bg-white/20 cursor-pointer pointer-events-auto group transition-all"
              onDoubleClick={() => alert(`We will hook this up to Notepad next: ${file}`)}
            >
              <span className="text-4xl drop-shadow-lg">
                {isFolder ? "📁" : "📄"}
              </span>
              <span className="text-white text-xs mt-1 text-center font-semibold drop-shadow-md break-all">
                {file}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}