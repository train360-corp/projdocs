"use client";

import { useRef } from "react";
import { FileViewerProps } from "@workspace/web/components/file-viewer/types";
import { usePDFJS } from "@workspace/web/hooks/use-pdfjs";



export const PDFFileViewer = ({ data: { blob } }: FileViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  usePDFJS(async (pdfjs) => {
    const pdf = await pdfjs.getDocument(await blob.arrayBuffer()).promise;

    const container = containerRef.current;
    if (!container) return;

    // Clear previously rendered canvases
    container.innerHTML = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = "w-full h-auto border shadow last:mb-0 mb-6";

      const context = canvas.getContext("2d")!;
      await page.render({ canvasContext: context, viewport, canvas }).promise;

      container.appendChild(canvas);
    }
  }, [ blob.size ]);

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 p-4 rounded-lg shadow-inner">
      <div ref={containerRef} className="flex flex-col items-center gap-4"/>
    </div>
  );
};