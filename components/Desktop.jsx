"use client";

import { useState, useRef, useEffect } from "react";
import Emulator from "./Screen/Emulator"; 
import Notepad from "./Notepad"; 

export default function Desktop() {
  const [desktopItems, setDesktopItems] = useState([
    { name: "My_Computer", type: "system", isFolder: true },
    { name: "Trash_Bin", type: "system", isFolder: true }
  ]);
  const [currentPath, setCurrentPath] = useState("/"); 
  
  const [activeWindow, setActiveWindow] = useState("none"); 
  const [activeFile, setActiveFile] = useState({ filename: "", content: "" });
  
  const commandRef = useRef(null);

  // Boot up using the absolute path!
  useEffect(() => {
    const timer = setTimeout(() => {
      if (commandRef.current && commandRef.current.sendCommand) {
        commandRef.current.sendCommand("/guils");
      }
    }, 4000); 
    return () => clearTimeout(timer);
  }, []);

  // CATCH Explicit objects from the Emulator!
  const handleUpdateIcons = (incomingItem) => {
    // Failsafe: Ignore if it's not a proper object from our new scraper
    if (!incomingItem || typeof incomingItem === "string") return; 

    setDesktopItems((prev) => {
      const cleanName = incomingItem.name;
      const systemFiles = ['shell', 'ls', 'cat', 'echo', 'mkdir', 'rm', 'writefile', 'clear', 'touch', 'cp', 'guils', 'pwd', 'guicat'];
      
      if (systemFiles.includes(cleanName) || cleanName === "." || cleanName === "..") return prev;
      if (prev.some(item => item.name === cleanName)) return prev;

      return [...prev, { name: cleanName, type: "user", isFolder: incomingItem.isFolder }];
    });
  };

  const handleOpenFile = (filename, content) => {
    setActiveFile({ filename, content });
    setActiveWindow("notepad"); 
  };

  const handleSaveToPintos = (command) => {
    if (commandRef.current) commandRef.current.sendCommand(command);
  };

  // THE DOUBLE CLICK ROUTER
  const handleDoubleClick = (item) => {
    
    // System Icons
    if (item.name === "My_Computer") {
        setActiveWindow("explorer"); 
        return; 
    }
    if (item.name === "Trash_Bin") {
        alert("The Trash Bin is empty!");
        return; 
    }

    // FOLDER MODE
    if (item.isFolder) {
       setDesktopItems([
          { name: "My_Computer", type: "system", isFolder: true },
          { name: "Trash_Bin", type: "system", isFolder: true }
       ]); 
       
       commandRef.current.sendCommand(`cd ${item.name}`); 
       
       setTimeout(() => {
         commandRef.current.sendCommand("/guils"); 
       }, 500); 
       
       setCurrentPath(prev => prev + item.name + "/");
       setActiveWindow("explorer"); 
    } 
    // NOTEPAD MODE
    else {
       commandRef.current.sendCommand(`/guicat ${item.name}`);
    }
  };

  const handleGoBack = () => {
      setDesktopItems([
          { name: "My_Computer", type: "system", isFolder: true },
          { name: "Trash_Bin", type: "system", isFolder: true }
      ]);
      commandRef.current.sendCommand("cd ..");
      
      setTimeout(() => {
         commandRef.current.sendCommand("/guils");
      }, 500);
      
      const pathArray = currentPath.split("/").filter(Boolean);
      pathArray.pop();
      setCurrentPath("/" + (pathArray.length > 0 ? pathArray.join("/") + "/" : ""));
  };

  const closeExplorer = () => {
      setActiveWindow("none");
      setDesktopItems([
          { name: "My_Computer", type: "system", isFolder: true },
          { name: "Trash_Bin", type: "system", isFolder: true }
      ]);
      commandRef.current.sendCommand("cd /");
      
      setTimeout(() => {
         commandRef.current.sendCommand("/guils");
      }, 500);
      setCurrentPath("/");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-blue-900 font-sans">
      
      {/* BACKGROUND EMULATOR */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <Emulator 
          commandRef={commandRef} 
          onUpdateIcons={handleUpdateIcons} 
          onOpenFile={handleOpenFile} 
        />
      </div>

      {/* DESKTOP ICONS */}
      {activeWindow === "none" && (
        <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col flex-wrap gap-4 items-start content-start">
          {desktopItems.map((item, index) => (
            <div
              key={index}
              className="w-20 flex flex-col items-center justify-center p-2 rounded hover:bg-white/20 cursor-pointer pointer-events-auto group transition-all"
              onDoubleClick={() => handleDoubleClick(item)}
            >
              <span className="text-4xl drop-shadow-lg">
                  {item.type === "system" ? (item.name === "My_Computer" ? "🖥️" : "🗑️") : (item.isFolder ? "📁" : "📄")}
              </span>
              <span className="text-white text-xs mt-1 text-center font-semibold drop-shadow-md break-all">{item.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* WINDOW 1: THE FILE EXPLORER */}
      {activeWindow === "explorer" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-white rounded-lg shadow-2xl z-40 flex flex-col overflow-hidden border border-gray-400 pointer-events-auto">
          
          <div className="bg-gray-200 border-b border-gray-400 px-3 py-1 flex justify-between items-center cursor-default">
             <span className="text-sm font-semibold text-gray-700">File Explorer</span>
             <button onClick={closeExplorer} className="text-red-500 font-bold hover:bg-red-200 px-2 rounded">X</button>
          </div>

          <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex items-center gap-2">
             <span className="text-sm text-gray-600 font-bold">Path:</span>
             <div className="bg-white border border-gray-300 px-2 py-1 text-sm flex-1 font-mono text-gray-700">
               {currentPath}
             </div>
          </div>

          <div className="flex-1 bg-white p-4 flex flex-wrap content-start gap-4 overflow-y-auto">
            {currentPath !== "/" && (
               <div className="w-20 flex flex-col items-center justify-center p-2 rounded hover:bg-blue-100 cursor-pointer transition-all" onDoubleClick={handleGoBack}>
                 <span className="text-4xl">🔙</span>
                 <span className="text-gray-800 text-xs mt-1 text-center font-semibold break-all">Go Back</span>
               </div>
            )}

            {desktopItems.map((item, index) => {
                if (item.type === "system") return null; 

                return (
                  <div
                    key={index}
                    className="w-20 flex flex-col items-center justify-center p-2 rounded hover:bg-blue-100 cursor-pointer transition-all"
                    onDoubleClick={() => handleDoubleClick(item)}
                  >
                    <span className="text-4xl">{item.isFolder ? "📁" : "📄"}</span>
                    <span className="text-gray-800 text-xs mt-1 text-center font-semibold break-all">{item.name}</span>
                  </div>
                );
            })}
          </div>
        </div>
      )}

      {/* WINDOW 2: THE NOTEPAD */}
      {activeWindow === "notepad" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-400 pointer-events-auto">
          <div className="bg-gray-200 border-b border-gray-400 px-3 py-1 flex justify-between items-center cursor-default">
             <span className="text-sm font-semibold text-gray-700">Notepad - {activeFile.filename}</span>
             <button onClick={() => setActiveWindow("none")} className="text-red-500 font-bold hover:bg-red-200 px-2 rounded">X</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Notepad initialFile={activeFile.filename} initialContent={activeFile.content} onSave={handleSaveToPintos} />
          </div>
        </div>
      )}

    </div>
  );
}