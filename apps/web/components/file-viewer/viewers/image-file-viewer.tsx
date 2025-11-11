"use client";

import { useEffect, useRef } from "react";
import { FileViewerProps } from "@workspace/web/components/file-viewer/types";



export const ImageFileViewer = ({ data: { blob } }: FileViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing children
    container.innerHTML = "";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    img.alt = "Rendered image";
    img.className = "max-w-full h-auto border shadow rounded";

    container.appendChild(img);

    // Revoke object URL on cleanup
    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [ blob ]);

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 p-4 rounded-lg shadow-inner">
      <div ref={containerRef} className="flex justify-center items-center"/>
    </div>
  );
};