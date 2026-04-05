'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Window from '../components/Window';
import Notepad from '../components/Notepad'; 
import TicTacToe from '../components/TicTacToe';

const Emulator = dynamic(() => import('../components/Screen/Emulator'), {
  ssr: false,
  loading: () => <div className="text-white p-4 font-mono">Loading BIOS...</div>
});

type DesktopItem = { name: string; type: string; isFolder: boolean };

export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false); 
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false); 
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isTicTacToeOpen, setIsTicTacToeOpen] = useState(false);
  const [tttBoard, setTttBoard] = useState("000000000");
  const [currentTime, setCurrentTime] = useState('');
  
  const commandRef = useRef<{ sendCommand: (cmd: string) => void, sendRaw: (cmd: string) => void } | null>(null); 
  
  const [desktopItems, setDesktopItems] = useState<DesktopItem[]>([
    { name: "My_Computer", type: "system", isFolder: true },
    { name: "Trash_Bin", type: "system", isFolder: true },
    { name: "Tic_Tac_Toe", type: "system", isFolder: false }
  ]);
  const [currentPath, setCurrentPath] = useState("/");
  
  const [activeFile, setActiveFile] = useState("");
  const [activeContent, setActiveContent] = useState("");

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Boot up: Ask for the root directory!
  useEffect(() => {
    const timer = setTimeout(() => {
      if (commandRef.current) commandRef.current.sendCommand("/guils /");
    }, 4000); 
    return () => clearTimeout(timer);
  }, []);

  const sendCommandToOS = (command: string) => {
    if (!isTerminalOpen) setIsTerminalOpen(true);
    setIsStartMenuOpen(false);
    setTimeout(() => {
      if (commandRef.current) commandRef.current.sendCommand(command);
    }, 150); 
  };

  // ATOMIC REPLACE: Guarantees My_Computer is never deleted!
  const handleUpdateIcons = (incomingItems: { name: string, isFolder: boolean }[]) => {
    // Safety check in case the old scraper is still running
    if (!Array.isArray(incomingItems)) return; 

    const systemFiles = ['shell', 'ls', 'cat', 'echo', 'mkdir', 'rm', 'writefile', 'clear', 'touch', 'cp', 'guils', 'pwd', 'guicat'];
    
    const validItems = incomingItems.filter(item => 
      !systemFiles.includes(item.name) && item.name !== "." && item.name !== ".."
    );

    setDesktopItems([
      { name: "My_Computer", type: "system", isFolder: true },
      { name: "Trash_Bin", type: "system", isFolder: true },
      { name: "Tic_Tac_Toe", type: "system", isFolder: false },
      ...validItems.map(item => ({ name: item.name, type: "user", isFolder: item.isFolder }))
    ]);
  };

  const handleOpenFile = (filename: string, content: string) => {
      setActiveFile(filename);
      setActiveContent(content.replace(/_/g, " ")); 
      setIsNotepadOpen(true);
  };

  // --- THE MAGIC NO-CD ROUTER ---
  const handleDoubleClick = (item: DesktopItem) => {
    if (item.type === "system") {
        if (item.name === "My_Computer") {
            setCurrentPath("/");
            setIsFileExplorerOpen(true);
            if (commandRef.current) commandRef.current.sendCommand("/guils /");
        }
        if (item.name === "Trash_Bin") alert("Trash is empty!");
        if (item.name === "Tic_Tac_Toe") {
            if (commandRef.current) commandRef.current.sendCommand("tictactoe");
            setIsTerminalOpen(true);
        }
        return; 
    }

    if (item.isFolder) {
       // Append folder name to path and ask guils to read it directly!
       const newPath = currentPath + item.name + "/";
       setCurrentPath(newPath);
       setIsFileExplorerOpen(true); 
       if (commandRef.current) commandRef.current.sendCommand(`/guils ${newPath}`);
    } else {
       // Ask guicat to read the absolute path!
       if (commandRef.current) commandRef.current.sendCommand(`/guicat ${currentPath}${item.name}`);
    }
  };

  const handleGoBack = () => {
      const pathArray = currentPath.split("/").filter(Boolean);
      pathArray.pop(); 
      const newPath = "/" + (pathArray.length > 0 ? pathArray.join("/") + "/" : "");
      
      setCurrentPath(newPath);
      if (commandRef.current) commandRef.current.sendCommand(`/guils ${newPath}`);
  };

  const handleCloseExplorer = () => {
      setIsFileExplorerOpen(false);
      setCurrentPath("/");
      if (commandRef.current) commandRef.current.sendCommand("/guils /");
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
          {desktopItems.map((item, index) => {
            if (currentPath !== "/" && item.type === "system") return null;

            return (
              <button 
                key={index} 
                onDoubleClick={() => handleDoubleClick(item)} 
                className="flex flex-col items-center gap-1 group outline-none"
              >
                <div className="text-4xl drop-shadow-md group-hover:opacity-80">
                  {item.type === "system" ? (item.name === "My_Computer" ? "🖥️" : item.name === "Trash_Bin" ? "🗑️" : "🎮") : (item.isFolder ? "📁" : "📄")}
                </div>
                <span className="text-white text-xs font-semibold px-1 rounded group-focus:bg-blue-800 group-focus:border group-focus:border-dotted text-center break-all">
                  {item.name}
                </span>
              </button>
            );
          })}

        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Window title="Pintos OS Terminal" isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)}>
            <Emulator 
              commandRef={commandRef} 
              onUpdateIcons={handleUpdateIcons} 
              onOpenFile={handleOpenFile} 
              onTicTacToeState={(board: string) => {
                setTttBoard(board);
                setIsTicTacToeOpen(true);
              }}
            />
          </Window>
          
          <Window title={activeFile ? `Notepad - ${activeFile}` : "Notepad"} isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)}>
            <Notepad onSave={sendCommandToOS} initialFile={activeFile} initialContent={activeContent} />
          </Window>

          <Window title="Tic-Tac-Toe" isOpen={isTicTacToeOpen} onClose={() => setIsTicTacToeOpen(false)}>
            <TicTacToe board={tttBoard} onMove={(str: string) => {
                if (commandRef.current && commandRef.current.sendRaw) {
                    commandRef.current.sendRaw(str);
                }
            }} />
          </Window>

          {/* FILE EXPLORER WINDOW */}
          <Window title={`File Explorer - ${currentPath}`} isOpen={isFileExplorerOpen} onClose={handleCloseExplorer}>
            <div className="flex flex-col h-full bg-white text-black">
              <div className="bg-gray-100 border-b border-gray-300 px-2 py-1 text-sm font-mono text-gray-700">
                Address: {currentPath}
              </div>
              <div className="flex-1 p-4 flex flex-wrap content-start gap-4 overflow-y-auto">
                {currentPath !== "/" && (
                   <button onDoubleClick={handleGoBack} className="flex flex-col items-center gap-1 w-20 hover:bg-blue-100 p-2 rounded border border-transparent">
                     <span className="text-4xl">🔙</span>
                     <span className="text-xs font-semibold text-center break-all text-gray-800">Go Back</span>
                   </button>
                )}

                {desktopItems.map((item, index) => {
                  if (item.type === "system") return null; 
                  return (
                    <button key={index} onDoubleClick={() => handleDoubleClick(item)} className="flex flex-col items-center gap-1 w-20 hover:bg-blue-100 p-2 rounded border border-transparent">
                      <span className="text-4xl">{item.isFolder ? "📁" : "📄"}</span>
                      <span className="text-xs font-semibold text-center break-all text-gray-800">{item.name}</span>
                    </button>
                  );
                })}
                {desktopItems.length === 2 && currentPath !== "/" && (
                  <div className="w-full text-center text-gray-400 mt-10 italic">This folder is empty.</div>
                )}
              </div>
            </div>
          </Window>
        </div>
      </div>
      
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