import { FileViewer } from "@workspace/web/components/file-viewer/types";
import { PDFFileViewer } from "@workspace/web/components/file-viewer/viewers/pdf-file-viewer";
import { UnsupportedFileViewer } from "@workspace/web/components/file-viewer/viewers/unsupported-file-viewer";
import { ImageFileViewer } from "@workspace/web/components/file-viewer/viewers/image-file-viewer";
import { WordFileViewer } from "@workspace/web/components/file-viewer/viewers/word-file-viewer";



export const FileViewers: FileViewer = (props) => {

  console.log(props.data.blob.type);

  switch (props.data.blob.type) {
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return (<WordFileViewer {...props} />);
    case "application/pdf":
      return (<PDFFileViewer {...props} />);
    case "image/png":
    case "image/jpeg":
    case "image/gif":
    case "image/webp":
    case "image/svg+xml":
    case "image/bmp":
    case "image/tiff":
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
    case "image/avif":
      return (<ImageFileViewer {...props} />);
    default:
      return (
        <UnsupportedFileViewer {...props} />
      );
  }

};