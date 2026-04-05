"use client";

import { useEffect, useRef, useState, useImperativeHandle } from "react";
import Script from "next/script";

const Emulator = ({ commandRef, onUpdateIcons, onOpenFile, onTicTacToeState }) => {
  const screenRef = useRef(null);
  
  // Track how many GUI blocks and Notepad blocks we've seen
  const guiCountRef = useRef(0); 
  const readCountRef = useRef(0); 
  const tttCountRef = useRef(0); 
  
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(
    typeof window !== "undefined" && !!window.V86
  );
  const [emulatorInstance, setEmulatorInstance] = useState(null);

  useImperativeHandle(commandRef, () => ({
    sendCommand: (command) => {
      if (emulatorInstance) {
        emulatorInstance.serial0_send(command + "\r");
      }
    },
    sendRaw: (str) => {
      if (emulatorInstance) {
        emulatorInstance.serial0_send(str);
      }
    }
  }));

  useEffect(() => {
    if (typeof window !== "undefined" && window.V86 && !isLibraryLoaded) {
      setIsLibraryLoaded(true);
    }
  }, [isLibraryLoaded]);

  // VISUAL SCREEN SCRAPER
  useEffect(() => {
    const scanner = setInterval(() => {
      if (screenRef.current && screenRef.current.children[0]) {
        const screenText = screenRef.current.children[0].innerText || "";
        
        // --- 1. ATOMIC GUI SCRAPER ---
        const currentGuiCount = (screenText.match(/\[GUI_END\]/g) || []).length;
        
        // Failsafe: If the terminal was cleared, reset our counter
        if (currentGuiCount < guiCountRef.current) guiCountRef.current = 0;

        if (currentGuiCount > guiCountRef.current) {
            guiCountRef.current = currentGuiCount;

            const lastStart = screenText.lastIndexOf("[GUI_START]");
            const lastEnd = screenText.lastIndexOf("[GUI_END]");
            
            if (lastStart > -1 && lastEnd > lastStart) {
                const block = screenText.substring(lastStart, lastEnd);
                const lines = block.split('\n');
                const parsedItems = [];

                lines.forEach(line => {
                    if (line.includes("<DIR>")) {
                        const filename = line.split("<DIR>")[1].trim();
                        if (filename) parsedItems.push({ name: filename, isFolder: true });
                    } else if (line.includes("<FILE>")) {
                        const filename = line.split("<FILE>")[1].trim();
                        if (filename) parsedItems.push({ name: filename, isFolder: false });
                    }
                });

                // Send the ENTIRE ARRAY at once!
                if (onUpdateIcons) onUpdateIcons(parsedItems);
            }
        }

        // --- 2. NOTEPAD SCRAPER ---
        const currentReadCount = (screenText.match(/\[ENDREAD\]/g) || []).length;
        if (currentReadCount < readCountRef.current) readCountRef.current = 0;

        if (currentReadCount > readCountRef.current) {
            readCountRef.current = currentReadCount; 

            const lastReadIdx = screenText.lastIndexOf("[READ]") + 6;
            const lastEndIdx = screenText.lastIndexOf("[ENDREAD]");
            const payload = screenText.substring(lastReadIdx, lastEndIdx);

            const delimiterIdx = payload.indexOf("|");
            if (delimiterIdx > -1) {
                const filename = payload.substring(0, delimiterIdx).trim();
                const content = payload.substring(delimiterIdx + 1).trim();

                if (onOpenFile) {
                    onOpenFile(filename, content);
                }
            }
        }

        // --- 3. TICTACTOE SCRAPER ---
        const currentTttCount = (screenText.match(/\[TTT_STATE\]/g) || []).length;
        if (currentTttCount < tttCountRef.current) tttCountRef.current = 0;

        if (currentTttCount > tttCountRef.current) {
            tttCountRef.current = currentTttCount;

            const lastStartIdx = screenText.lastIndexOf("[TTT_STATE]") + 12;
            const lastEndIdx = screenText.lastIndexOf("[ENDTTT_STATE]");
            if (lastStartIdx > 11 && lastEndIdx > lastStartIdx) {
                const boardData = screenText.substring(lastStartIdx, lastEndIdx).trim();
                if (onTicTacToeState) {
                    onTicTacToeState(boardData);
                }
            }
        }

      }
    }, 1000); // Check every 1 second

    return () => clearInterval(scanner);
  }, [onUpdateIcons, onOpenFile, emulatorInstance]);

  // BOOT EMULATOR
  useEffect(() => {
    if (isLibraryLoaded && !emulatorInstance && screenRef.current) {
      const V86Starter = window.V86;
      if (!V86Starter) return;

     const mountDisksAndBoot = async () => {
        try {
          const osRes = await fetch("/images/os.dsk?v=" + Date.now());
          const osBuffer = await osRes.arrayBuffer();

          const fsRes = await fetch("/images/filesys.dsk?v=" + Date.now());
          const fsBuffer = await fsRes.arrayBuffer();

          const emulator = new V86Starter({
            wasm_path: "/v86/v86.wasm",
            memory_size: 32 * 1024 * 1024,
            vga_memory_size: 2 * 1024 * 1024,
            screen_container: screenRef.current,
            bios: { url: "/bios/seabios.bin" },
            vga_bios: { url: "/bios/vgabios.bin" },
            hda: { buffer: osBuffer, name: "os.dsk", size: osBuffer.byteLength },
            hdb: { buffer: fsBuffer, name: "filesys.dsk", size: fsBuffer.byteLength },
            cmdline: "-q run shell",
            autostart: true,
          });

          setEmulatorInstance(emulator);
        } catch (e) {
          console.error("Boot crash:", e);
        }
      };
      mountDisksAndBoot();
    }
    return () => {
      if (emulatorInstance) emulatorInstance.destroy();
    };
  }, [isLibraryLoaded]);

  const handleKeyDown = (e) => {
    if (!emulatorInstance) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Enter") {
      emulatorInstance.serial0_send("\r");
    } else if (e.key === "Backspace") {
      emulatorInstance.serial0_send("\b");
    } else if (e.key.length === 1) {
      emulatorInstance.serial0_send(e.key);
    }
  };

  return (
    <div tabIndex={0} className="w-full h-full bg-black outline-none focus:ring-4 focus:ring-blue-500 cursor-text relative" onClick={(e) => e.currentTarget.focus()} onKeyDown={handleKeyDown}>
      <Script src="/v86/libv86.js" strategy="afterInteractive" onLoad={() => setIsLibraryLoaded(true)} onReady={() => setIsLibraryLoaded(true)} />
      <div ref={screenRef} className="absolute inset-0 pointer-events-none">
        <div style={{ whiteSpace: "pre", font: "14px monospace", color: "white" }}></div>
        <canvas className="w-full h-full block"></canvas>
      </div>
      {!isLibraryLoaded && <div className="absolute text-white z-50 font-mono top-4 left-4">Loading Hardware Engine...</div>}
    </div>
  );
};

export default Emulator;