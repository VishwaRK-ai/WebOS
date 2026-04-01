'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Window from '../components/Window';
import Notepad from '../components/Notepad'; 

const Emulator = dynamic(() => import('../components/Screen/Emulator'), {
  ssr: false,
  loading: () => <div className="text-white p-4 font-mono">Loading BIOS...</div>
});

export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false); 
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const commandRef = useRef<{ sendCommand: (cmd: string) => void } | null>(null); 
  
  // State for Desktop Icons and File Contents
  const [desktopIcons, setDesktopIcons] = useState<Set<string>>(new Set(["My_Computer", "Trash_Bin"]));
  const [activeFile, setActiveFile] = useState("");
  const [activeContent, setActiveContent] = useState("");

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const sendCommandToOS = (command: string) => {
    if (!isTerminalOpen) setIsTerminalOpen(true);
    setIsStartMenuOpen(false);
    setTimeout(() => {
      if (commandRef.current) commandRef.current.sendCommand(command);
    }, 150); 
  };

  const handleShutdown = () => {
    setIsStartMenuOpen(false);
    setIsTerminalOpen(false);
    setIsNotepadOpen(false);
  };

  // Triggered when the Emulator Scraper finds the [READ] tag
  const handleOpenFile = (filename: string, content: string) => {
      setActiveFile(filename);
      setActiveContent(content.replace(/_/g, " ")); // Format Pintos spaces
      setIsNotepadOpen(true);
  };

  // Triggered when the Emulator Scraper finds the [GUI] tag
  const handleUpdateIcons = (newFilename: string) => {
    setDesktopIcons((prev) => {
      const next = new Set(prev);
      const systemFiles = ['shell', 'ls', 'cat', 'echo', 'mkdir', 'rm', 'writefile', 'clear', 'touch', 'cp', 'guils', 'pwd', 'guicat'];
      
      if (!systemFiles.includes(newFilename)) {
        next.add(newFilename);
      }
      return next;
    });
  };

  return (
    <div className="w-screen h-screen bg-[#008080] relative flex flex-col overflow-hidden select-none font-sans">
      
      {/* DESKTOP WORKSPACE */}
      <div className="flex-1 p-4 relative" onClick={() => setIsStartMenuOpen(false)}>
        <div className="flex flex-col gap-6 w-20">
          
          <button onDoubleClick={() => sendCommandToOS('shell')} className="flex flex-col items-center gap-1 group outline-none">
            <div className="w-10 h-10 bg-black border-2 border-gray-400 flex items-center justify-center text-green-400 text-lg font-mono shadow-md group-hover:opacity-80">&gt;_</div>
            <span className="text-white text-xs font-semibold px-1 rounded group-focus:bg-blue-800 group-focus:border group-focus:border-dotted">Terminal</span>
          </button>

          <button onDoubleClick={() => setIsNotepadOpen(true)} className="flex flex-col items-center gap-1 group outline-none">
            <div className="w-10 h-10 bg-white border-2 border-blue-600 flex items-center justify-center text-blue-600 text-xl shadow-md group-hover:opacity-80">📝</div>
            <span className="text-white text-xs font-semibold px-1 rounded group-focus:bg-blue-800 group-focus:border group-focus:border-dotted">Notepad</span>
          </button>

          {/* DYNAMIC DESKTOP ICONS */}
          {Array.from(desktopIcons).map((file, index) => {
            const isFolder = !file.includes(".");
            return (
              <button 
                key={index} 
                onDoubleClick={() => sendCommandToOS(`guicat ${file}`)} 
                className="flex flex-col items-center gap-1 group outline-none"
              >
                <div className="text-4xl drop-shadow-md group-hover:opacity-80">
                  {isFolder ? "📁" : "📄"}
                </div>
                <span className="text-white text-xs font-semibold px-1 rounded group-focus:bg-blue-800 group-focus:border group-focus:border-dotted text-center break-all">
                  {file}
                </span>
              </button>
            );
          })}

        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Window title="Pintos OS Terminal" isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)}>
            <Emulator commandRef={commandRef} onUpdateIcons={handleUpdateIcons} onOpenFile={handleOpenFile} />
          </Window>
          
          <Window title={activeFile ? `Notepad - ${activeFile}` : "Notepad"} isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)}>
            <Notepad onSave={sendCommandToOS} initialFile={activeFile} initialContent={activeContent} />
          </Window>
        </div>
      </div>

      {/* START MENU AND TASKBAR HIDDEN FOR BREVITY - KEEP YOUR EXISTING CODE HERE */}
      
      {/* TASKBAR */}
      <div className="h-10 bg-gray-300 border-t-2 border-white flex items-center px-2 z-50">
        <button 
          className={`px-4 py-1 border-2 font-bold text-sm flex items-center gap-2 ${isStartMenuOpen ? 'bg-gray-300 border-t-gray-600 border-l-gray-600 border-b-white border-r-white shadow-inner' : 'bg-gray-200 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-t-gray-600 active:border-l-gray-600 active:border-b-white active:border-r-white'}`}
          onClick={(e) => {
            e.stopPropagation(); 
            setIsStartMenuOpen(!isStartMenuOpen);
          }}
        >
          <span className="text-red-600 text-lg leading-none">⊞</span> Start
        </button>
      </div>

    </div>
  );
}