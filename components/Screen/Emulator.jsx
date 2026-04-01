"use client";

import { useEffect, useRef, useState, useImperativeHandle } from "react";
import Script from "next/script";

const Emulator = ({ commandRef, onUpdateIcons, onOpenFile }) => {
  const screenRef = useRef(null);
  const processedFilesRef = useRef(new Set()); // Memory for GUI icons
  const readCountRef = useRef(0); //Memory for file opening!
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
  }));

  useEffect(() => {
    if (typeof window !== "undefined" && window.V86 && !isLibraryLoaded) {
      setIsLibraryLoaded(true);
    }
  }, [isLibraryLoaded]);

  //VISUAL SCREEN SCRAPER
  useEffect(() => {
    const scanner = setInterval(() => {
      if (screenRef.current && screenRef.current.children[0]) {
        const screenText = screenRef.current.children[0].innerText || "";
        
        // 1. Scrape Desktop Icons
        if (screenText.includes("[GUI]")) {
          const lines = screenText.split('\n');
          lines.forEach(line => {
            if (line.includes("[GUI]")) {
              const filename = line.substring(line.indexOf("[GUI]") + 5).trim();
              if (filename && !processedFilesRef.current.has(filename)) {
                processedFilesRef.current.add(filename);
                if (onUpdateIcons) onUpdateIcons(filename);
              }
            }
          });
        }

        //scrap file contents for Notepad
        if (screenText.includes("[READ]") && screenText.includes("[ENDREAD]")) {
            //cnt how many times [ENDREAD] is on the screen
            const currentReadCount = (screenText.match(/\[ENDREAD\]/g) || []).length;
            
            //only trigger if a NEW file was just printed!
            if (currentReadCount > readCountRef.current) {
                readCountRef.current = currentReadCount; // Update our memory

                const lastReadIdx = screenText.lastIndexOf("[READ]") + 6;
                const lastEndIdx = screenText.lastIndexOf("[ENDREAD]");
                const payload = screenText.substring(lastReadIdx, lastEndIdx);

                const delimiterIdx = payload.indexOf("|");
                if (delimiterIdx > -1) {
                    const filename = payload.substring(0, delimiterIdx).trim();
                    const content = payload.substring(delimiterIdx + 1).trim();

                    if (onOpenFile) {
                        onOpenFile(filename, content);
                        //emulatorInstance.serial0_send("clear\r");
                    }
                }
            }
        }
      }
    }, 1500);

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