import { File, FileUp } from "lucide-react";
import { useDropzone } from "react-dropzone";

export const Dropzone: React.FC = () => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => console.log(files),
  });

  return (
    <div
      {...getRootProps()}
      className="flex flex-col items-center cursor-pointer py-12 border-2 border-dotted border-gray-300 rounded-xl text-muted-foreground"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <div className="flex flex-col gap-4 items-center justify-center">
          <FileUp size={32} />
          <p>Drag and Drop file here or <span className="underline font-medium">Choose file</span></p>
        </div>
      )}
    </div>
  );
};
