import { FileViewerProps } from "@workspace/web/components/file-viewer/types";
import { UnsupportedFileViewer } from "@workspace/web/components/file-viewer/viewers/unsupported-file-viewer";
import { PDFFileViewer } from "@workspace/web/components/file-viewer/viewers/pdf-file-viewer";

function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}


export const WordFileViewer = (props: FileViewerProps) => {

  console.log(props.data.info.user_metadata)

  if(
    props.data.info.user_metadata !== null &&
    typeof props.data.info.user_metadata === "object" &&
    "preview" in props.data.info.user_metadata &&
    typeof props.data.info.user_metadata.preview === "string"
  ) return (
    <PDFFileViewer
      {...props}
      data={{
        ...props.data,
        blob: dataUriToBlob(props.data.info.user_metadata.preview)
      }}
    />
  )

  return (
    <UnsupportedFileViewer {...props} />
  );

}