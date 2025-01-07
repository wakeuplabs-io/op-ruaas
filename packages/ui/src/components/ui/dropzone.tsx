import { cn } from "@/lib/utils";
import { FileUp } from "lucide-react";
import { useDropzone } from "react-dropzone";

export const Dropzone: React.FC<{
  onDrop: (files: File[]) => void;
  className?: string;
}> = ({ onDrop, className }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDrop,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center cursor-pointer py-12 border-4 border-dotted border-gray-300 rounded-xl text-muted-foreground",
        className
      )}
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
