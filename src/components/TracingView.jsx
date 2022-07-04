/** font awesome */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faAngleRight, faAngleDown } from "@fortawesome/free-solid-svg-icons";
library.add(faAngleRight, faAngleDown);

import { useState } from "react";

function formatNumber(duration, size = 2) {
  return Math.floor(duration * Math.pow(10, size)) / Math.pow(10, size);
}

function spanColorBorder(span) {
  return span.type === "sql" ? "border-red-500" : "border-green-500";
}

function spanColor(span) {
  return span.type === "sql" ? "bg-red-500" : "bg-green-500";
}

function spanColorFade(span) {
  return span.type === "sql" ? "bg-red-200" : "bg-green-200";
}

const PercentView = ({ size, className, onClick, children }) => {
  const defaultHandler = () => {};
  return (
    <div
      className={`flex items-center h-8 text-sm ${className ? className : ""}`}
      style={{
        flexBasis: `${size}%`,
        maxWidth: `${size}%`,
      }}
      onClick={onClick ? onClick : defaultHandler}
    >
      {children}
    </div>
  );
};

const TracingTimelineHeader = ({ config }) => {
  const duration = config.duration;
  return (
    <div
      className="flex flex-row border-0 border-b border-solid border-gray-300"
      style={{ backgroundColor: "#ececec" }}
    >
      <PercentView size={config.sidebarSize} className="pl-2">
        Service & Operation
      </PercentView>
      <PercentView size={100 - config.sidebarSize} className="relative">
        <div className="relative flex flex-grow h-full">
          {[0, 25, 50, 70].map((value) => (
            <div
              key={`tracing-header-${value}`}
              className="flex flex-grow h-full border-0 border-l border-solid border-gray-300 items-center text-xs pl-1"
            >
              <span className="absolute">
                {formatNumber((duration * value) / 100)}ms
              </span>
            </div>
          ))}
        </div>
        <div className="absolute w-full h-full flex flex-row-reverse">
          <div className="flex h-full items-center text-xs pr-1">
            {formatNumber(duration)}ms
          </div>
        </div>
      </PercentView>
    </div>
  );
};

const SpanSidebar = ({ span, isExpand, toggleDetail, toggleExpand }) => {
  return (
    <div className="flex flex-row flex-grow">
      <div
        style={{ marginLeft: `${span.level * 1.25}rem` }}
        className="w-5 text-center hover:bg-gray-200"
        onClick={toggleExpand}
      >
        {span.children.length > 0 && (
          <FontAwesomeIcon icon={isExpand ? "angle-down" : "angle-right"} />
        )}
      </div>
      <div
        className={`flex-grow text-sm border-0 border-l-4 border-solid ${spanColorBorder(
          span
        )} pl-1`}
        onClick={toggleDetail}
      >
        {span.type}
      </div>
    </div>
  );
};

const SpanView = ({ span, config, toggleDetail }) => {
  const spanSize = (span.duration / config.duration) * 100;
  const spanLeft = ((span.start - config.start) / config.duration) * 100;
  const showLeft = spanLeft > 50;
  const showRight = spanLeft + spanSize < 50;

  return (
    <>
      <div className="relative flex flex-grow h-full">
        {[0, 25, 50, 70].map((value) => (
          <div
            key={`tracing-header-${value}`}
            className="flex flex-grow h-full border-0 border-l border-solid border-gray-300 items-center text-xs pl-1"
          ></div>
        ))}
      </div>
      <div
        className="absolute flex flex-grow items-center w-full"
        onClick={toggleDetail}
      >
        <div
          className="flex flex-row relative"
          style={{ width: `${spanLeft}%` }}
        >
          {showLeft && (
            <div className="flex flex-grow flex-row-reverse text-xs pr-2 text-gray-400">
              {formatNumber(span.duration)}ms
            </div>
          )}
        </div>
        <div
          className={`rounded ${spanColor(span)}`}
          style={{ width: `${spanSize}%`, height: "10px" }}
        />
        {showRight && (
          <div className="flex flex-grow flex-row text-xs pl-2 text-gray-400">
            {formatNumber(span.duration)}ms
          </div>
        )}
      </div>
    </>
  );
};

const SpanDetailSidebar = ({ span, toggleDetail }) => {
  return (
    <div className="flex flex-row flex-grow">
      <div
        style={{ marginLeft: `${span.level * 1.25}rem` }}
        className="w-5 text-center hover:bg-gray-200"
      />
      <div
        className={`flex-grow h-full border-0 border-l-4 border-solid ${spanColorBorder(
          span
        )} pl-1 ${spanColorFade(span)} cursor-pointer`}
        onClick={toggleDetail}
      ></div>
    </div>
  );
};

const SpanDetailView = ({ span, config }) => {
  return (
    <div
      className={`flex flex-col flex-grow border border-solid border-gray-300 p-4 space-y-4`}
    >
      <div className="flex flex-row flex-grow border-0 pb-2 border-solid border-gray-300 border-b">
        <div className="flex flex-grow">{span.type}</div>
        <div className="flex flex-row-reverse flex-grow space-x-2 space-x-reverse">
          <div>Duration: {formatNumber(span.duration)}ms</div>
          <div>Start: {formatNumber(span.start - config.start)}ms</div>
        </div>
      </div>
      <div className="flex flex-col flex-grow">
        {span.type === "grpc" && (
          <>
            <div>
              grpc service: <code>{span.name.split("/")[0]}</code>
            </div>
            <div>
              grpc method: <code>{span.name.split("/")[1]}</code>
            </div>
          </>
        )}
        {span.type === "sql" && (
          <div>
            sql: <code>{span.name}</code>
          </div>
        )}
      </div>
    </div>
  );
};

const SpanDetail = ({ span, config, toggleDetail }) => {
  return (
    <div className="flex flex-row flex-grow items-stretch">
      <PercentView size={config.sidebarSize} className="items-stretch h-full">
        <SpanDetailSidebar span={span} toggleDetail={toggleDetail} />
      </PercentView>
      <PercentView
        size={100 - config.sidebarSize}
        className="relative h-full items-stretch"
      >
        <SpanDetailView span={span} config={config} />
      </PercentView>
    </div>
  );
};

const TracingTimelineSpan = ({ span, config }) => {
  const [isDetail, setIsDetail] = useState(false);
  const [isExpand, setIsExpand] = useState(span.level > config.extendLevel);
  const toggleDetail = () => {
    setIsDetail(!isDetail);
  };
  const toggleExpand = () => {
    setIsExpand(!isExpand);
  };

  return (
    <>
      <div className="flex flex-row flex-grow cursor-pointer">
        <PercentView size={config.sidebarSize}>
          <SpanSidebar
            span={span}
            toggleDetail={toggleDetail}
            toggleExpand={toggleExpand}
          />
        </PercentView>
        <PercentView
          size={100 - config.sidebarSize}
          onClick={toggleDetail}
          className="relative hover:border-0 hover:border-y hover:border-solid hover:border-gray-300"
        >
          <SpanView span={span} toggleDetail={toggleDetail} config={config} />
        </PercentView>
      </div>
      {isDetail && <SpanDetail span={span} config={config} />}
      {isExpand &&
        span.children.map((item) => (
          <TracingTimelineSpan
            span={item}
            config={config}
            toggleDetail={toggleDetail}
          />
        ))}
    </>
  );
};

function TracingTimelineViewer({ root }) {
  const config = {
    sidebarSize: 20,
    extendLevel: 6,
    start: root.start,
    duration: root.duration,
  };
  return (
    <div className="border-b border-solid">
      <TracingTimelineHeader config={config} />
      <TracingTimelineSpan span={root} config={config} />
    </div>
  );
}

export default TracingTimelineViewer;
