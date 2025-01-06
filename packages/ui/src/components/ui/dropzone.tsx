import { FileUp, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";

export const Dropzone: React.FC<{ 
    file: File | null,
    setFile: (f: File | null) => void,
 }> = ({ file, setFile }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      setFile(acceptedFiles[0]);
    },
  });

  if (file) {
    return (
      <div className="border rounded-md px-3 h-12 flex justify-between items-center relative">
        <span className="text-sm">{file.name}</span>
        <Button onClick={() => setFile(null)} variant={"ghost"} size={"icon"} className="absolute right-2 top-2 h-8 w-8">
            <X size={16} />
        </Button>
      </div>
    );
  } 

  return (
    <div
      {...getRootProps()}
      className="flex flex-col items-center cursor-pointer py-12 border-2 border-dotted border-gray-300 rounded-xl text-muted-foreground"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <div className="flex flex-col gap-4 p-5 text-center items-center justify-center">
          <FileUp size={32} />
          <p>
            Drag and Drop file here or{" "}
            <span className="underline font-medium">Choose file</span>
          </p>
        </div>
      )}
    </div>
  );
};
