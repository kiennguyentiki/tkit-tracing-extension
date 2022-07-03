import { root } from "postcss";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";

/** font awesome */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faAngleRight, faAngleDown } from "@fortawesome/free-solid-svg-icons";
library.add(faAngleRight, faAngleDown);

import { processFile } from "../utils";

const UploadFile = ({ handleUpload, file }) => {
  return (
    <div className="flex flex-col justify-content">
      <h1>Tkit Tracing for Graylog</h1>
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

const SpanContainer = ({ root }) => {
  return (
    <div className="relative flex min-h-screen flex-col space-y-1">
      <Span span={root} root={root} />
    </div>
  );
};

const Span = ({ span, root }) => {
  const [expand, setExpand] = useState(false);
  const handeClick = () => {
    setExpand(!expand);
  };

  const startPercent = ((span.start - root.start) / root.duration) * 100;
  const sizePercent = (span.duration / root.duration) * 100;
  const duration = Math.floor(span.duration * 100) / 100;
  return (
    <>
      <div className="flex flex-row" onClick={handeClick}>
        <div className="text-right" style={{ width: `${startPercent}%` }}>
          {startPercent > 10 && `${duration}ms`}
        </div>
        <div
          className="px-2 bg-green-500 has-tooltip"
          style={{ width: `${sizePercent}%` }}
        >
          <span className="tooltip rounded shadow-lg p-1 bg-gray-200 p-4 mt-8">
            {span.name}
          </span>
          <FontAwesomeIcon icon={expand ? "angle-down" : "angle-right"} />{" "}
          {sizePercent >= 100 && `${duration}ms`}
        </div>
      </div>
      {expand &&
        span.children.map((item) => (
          <Span key={item.name} root={root} span={item} />
        ))}
    </>
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
      {!root && <UploadFile file={file} handleUpload={handleUpload} />}
      {root && <SpanContainer root={root} />}
    </div>
  );
}
