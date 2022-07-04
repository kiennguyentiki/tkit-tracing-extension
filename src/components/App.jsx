import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";

import { processFile } from "../utils";
import TracingView from "./TracingView";

const UploadFile = ({ handleUpload, file }) => {
  return (
    <div className="flex flex-col items-center">
      <h1>Tkit Tracing for Graylog</h1>
      <div>Please export Graylog log with these field</div>
      <ul>
        {[
          "message",
          "timestamp",
          "ts",
          "sql",
          "elapsed",
          "grpc_service",
          "grpc_method",
          "grpc_time_ms",
        ].map((item) => (
          <li key={item} className="pl-2">
            + {item}
          </li>
        ))}
      </ul>
      <div className="pb-4">
        After that, export your log to CSV, then drag into this page
      </div>
      <FileUploader
        multiple={false}
        handleChange={handleUpload}
        name="file"
        types={["csv"]}
      />
      <p>{file ? `File name: ${file.name}` : "No files uploaded yet"}</p>
    </div>
  );
};

const Navigator = () => {
  return (
    <nav className="bg-white border-gray-200 px-2 sm:px-4 py-2.5 dark:bg-gray-800">
      <div className="container flex flex-wrap items-start">
        <a href="/" className="flex">
          <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
            Tkit Tracing UI
          </span>
        </a>
      </div>
    </nav>
  );
};

export default function App() {
  const [file, setFile] = useState(null);
  const [root, setRoot] = useState(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setFile(file);
    const rootSpan = await processFile(file);
    console.log(rootSpan);
    setRoot(rootSpan);
  };

  return (
    <div className="flex flex-col w-full">
      <Navigator />
      {!root && <UploadFile file={file} handleUpload={handleUpload} />}
      {root && <TracingView root={root} />}
    </div>
  );
}
