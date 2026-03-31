'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const Emulator = () => {
    const screenRef = useRef(null);
    const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
    const [emulatorInstance, setEmulatorInstance] = useState(null);

    useEffect(() => {
        if (isLibraryLoaded && !emulatorInstance && screenRef.current) {

            // @ts-ignore
            const V86Starter = window.V86;

            if (!V86Starter) {
                console.error("❌ Critical: window.V86 is missing.");
                return;
            }

            console.log("✅ V86 Constructor Found. Booting OS...");

            const mountDiskAndBoot = async () => {
                try {
                    console.log("⬇️ Downloading OS image...");
                    // Manually fetch the disk image to ensure it's loaded before passing to V86
                    const response = await fetch("/images/pintos.img");

                    if (!response.ok) {
                        throw new Error(`Failed to load disk image: ${response.status} ${response.statusText}`);
                    }

                    const buffer = await response.arrayBuffer();
                    console.log(`✅ Image loaded. Size: ${buffer.byteLength} bytes`);

                    const emulator = new V86Starter({
                        wasm_path: "/v86/v86.wasm",
                        memory_size: 32 * 1024 * 1024,
                        vga_memory_size: 2 * 1024 * 1024,
                        screen_container: screenRef.current,
                        bios: { url: "/bios/seabios.bin" },
                        vga_bios: { url: "/bios/vgabios.bin" },

                        // Pass the downloaded buffer directly
                        hda: {
                            buffer: buffer,
                            name: "pintos.img",
                            size: buffer.byteLength,
                        },

                        autostart: true,
                    });

                    setEmulatorInstance(emulator);
                } catch (e) {
                    console.error("❌ Crash during boot or disk load:", e);
                }
            };

            mountDiskAndBoot();
        }

        return () => {
            if (emulatorInstance) {
                // @ts-ignore
                emulatorInstance.destroy();
            }
        };
    }, [isLibraryLoaded]);

    return (
        <div className="w-full h-full bg-black relative flex flex-col items-center justify-center">
            {/* Using the local library to match local WASM */}
            <Script
                src="/v86/libv86.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log("✅ Library Loaded.");
                    setIsLibraryLoaded(true);
                }}
            />

            <div ref={screenRef} className="absolute inset-0 bg-black">
                <div style={{ whiteSpace: "pre", font: "14px monospace", color: "white" }}></div>
                <canvas className="w-full h-full block"></canvas>
            </div>

            {!isLibraryLoaded && <div className="text-white z-50">Loading Engine...</div>}
        </div>
    );
};

export default Emulator;