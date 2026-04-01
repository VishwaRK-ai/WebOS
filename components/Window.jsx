'use client';

import React, { useRef } from 'react';
import Draggable from 'react-draggable';

export default function Window({ title, isOpen, onClose, children }) {
  const nodeRef = useRef(null); 

  //use CSS to hide the window instead of destroying the component
  return (
    <Draggable nodeRef={nodeRef} handle=".window-header">
      <div 
        ref={nodeRef} 
        className={`absolute top-10 left-10 w-[720px] h-[540px] bg-gray-200 border-2 border-white border-r-gray-600 border-b-gray-600 flex-col z-50 shadow-2xl ${isOpen ? 'flex' : 'hidden'}`}
      >
        <div className="window-header bg-blue-800 text-white px-2 py-1 flex justify-between items-center cursor-move">
          <span className="font-bold text-sm select-none">{title}</span>
          <button 
            onClick={onClose} 
            className="bg-gray-300 text-black font-bold w-5 h-5 flex items-center justify-center border border-white border-r-gray-600 border-b-gray-600 hover:bg-gray-200"
          >
            X
          </button>
        </div>
        
        <div className="flex-1 bg-black border-[3px] border-gray-600 border-r-white border-b-white overflow-hidden relative">
          {children}
        </div>
      </div>
    </Draggable>
  );
}