import React, { useState, useEffect } from 'react';

const FileExplorer = ({ emulator }) => {
  // This state holds the JSON array from your C code!
  const [items, setItems] = useState([]);

  // Fetch the folders as soon as the window opens
  useEffect(() => {
    refreshDirectory();
  }, []);

  const refreshDirectory = async () => {
    // 1. Secretly run the command in the background
    const output = await emulator.runCommand("guils");
    
    // 2. Parse the JSON string into a real Javascript array
    try {
      // Find the JSON part of the output (in case the terminal printed extra spaces)
      const jsonStart = output.indexOf('[');
      const jsonEnd = output.lastIndexOf(']') + 1;
      const cleanJson = output.substring(jsonStart, jsonEnd);
      
      const parsedItems = JSON.parse(cleanJson);
      setItems(parsedItems);
    } catch (error) {
      console.error("Failed to parse directory JSON:", error);
    }
  };

const handleDoubleClick = async (item) => {
    if (item.type === "folder") {
      // 1. Tell the OS to change directories
      await emulator.runCommand(`cd ${item.name}`);
      
      // 2. Fetch the newly updated folder list!
      await refreshDirectory();
    } else {
      // It's a file! Maybe open it in a text editor?
      console.log(`Opening file: ${item.name}`);
      await emulator.runCommand(`guicat ${item.name}`); // If you want to read it!
    }
  };

  return (
    <div className="file-explorer-grid">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="file-item"
          onDoubleClick={() => handleDoubleClick(item)}
          style={{ padding: '10px', textAlign: 'center', cursor: 'pointer' }}
        >
          {/* Pick the right icon based on the JSON 'type' */}
          <span style={{ fontSize: '40px' }}>
            {item.type === "folder" ? "📁" : "📄"}
          </span>
          
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            {item.name}
          </p>
        </div>
      ))}
    </div>
  );
};

export default FileExplorer;