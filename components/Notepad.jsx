'use client';

import React, { useState, useEffect } from 'react';

// ADDED: Accepting the initialFile and initialContent props from page.tsx!
export default function Notepad({ onSave, initialFile = "notes.txt", initialContent = "" }) {
  const [filename, setFilename] = useState(initialFile);
  const [content, setContent] = useState(initialContent);
  const [isSaved, setIsSaved] = useState(false);

  // THE MAGIC BRIDGE: If you double-click a different icon, update the Notepad immediately!
  useEffect(() => {
    if (initialFile) setFilename(initialFile);
    if (initialContent !== undefined) setContent(initialContent);
  }, [initialFile, initialContent]);

  const handleSave = () => {
    if (!filename || !content) return;
    
    // Format spaces to underscores so the text stays together
    const safeContent = content.replace(/ /g, "_").replace(/\n/g, "_");
    
    // Call our custom compiled C program
    const command = `writefile ${filename} ${safeContent}`;
    onSave(command);
    
    // Show visual feedback
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white text-black font-sans">
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-2 items-center">
        <span className="text-sm font-semibold">File Name:</span>
        <input 
          type="text" 
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="border border-gray-400 px-1 text-sm outline-none w-32"
        />
        <button 
          onClick={handleSave}
          className={`ml-auto border px-3 py-1 text-sm shadow-sm font-semibold transition-colors ${
            isSaved ? 'bg-green-500 text-white border-green-700' : 'bg-gray-200 border-gray-400 hover:bg-gray-300'
          }`}
        >
          {isSaved ? '✓ Saved!' : 'Save to Pintos'}
        </button>
      </div>
      
      <textarea 
        className="flex-1 w-full p-2 outline-none resize-none font-mono text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck="false"
        placeholder="Type your text here. Click save, then type 'cat notes.txt' in the terminal to see your file!"
      />
    </div>
  );
}