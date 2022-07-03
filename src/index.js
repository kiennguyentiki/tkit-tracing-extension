const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

function normalizeTimestamp(ts) {
  const length = Math.floor(ts).toString().length;
  return ts * Math.pow(10, 13 - length);
}

function getRootSpan(rows) {
  const firstRow = rows.filter((item) => item.message === "Request started")[0];
  const lastRow = rows.filter((item) => item.message === "Request finished")[0];
  return {
    name: "root",
    type: "root",
    start: firstRow.ts,
    duration: lastRow.ts - firstRow.ts,
    end: lastRow.ts,
    children: [],
    _spanCache: {},
  };
}

function addGrpcSpans(root, rows) {
  rows
    .filter((item) => item.grpc_time_ms != "")
    .forEach((item) => {
      const duration = parseFloat(item.grpc_time_ms);
      const span = {
        type: "grpc",
        name: `${item.grpc_service}/${item.grpc_method}`,
        start: item.ts - duration,
        duration: duration,
        end: item.ts,
        children: [],
      };
      root._spanCache[span.name] = span;
      root.children.push(span);
    });
}

function addSqlSpans(root, rows) {
  rows
    .filter((item) => item.sql)
    .forEach((item) => {
      const grpcKey = `${item.grpc_service}/${item.grpc_method}`;
      const grpcSpan = root._spanCache[grpcKey];
      if (!grpcSpan) return;
      let duration = item.elapsed;
      if (duration.endsWith("ms")) {
        duration = parseFloat(duration.slice(0, -2));
      } else {
        duration = parseFloat(duration.slice(0, -2)) / 1000;
      }
      const span = {
        type: "sql",
        name: item.sql,
        start: item.ts - duration,
        duration,
        end: item.ts,
        children: [],
      };
      grpcSpan.children.push(span);
    });
}

function sortSpans(root) {
  // sort root spans
  root.children.sort((a, b) =>
    a.start > b.start ? 1 : a.start < b.start ? -1 : 0
  );

  // sort children span
  root.children.forEach((span) => {
    span.children.sort((a, b) =>
      a.start > b.start ? 1 : a.start < b.start ? -1 : 0
    );
  });
}

function printSpan(root, span) {
  console.log(`
    <div class="flex flex-row">
        <div style="width: ${
          ((span.start - root.start) / root.duration) * 100
        }%"></div>
        <div class="px-2 bg-green-500 has-tooltip" style="width: ${
          (span.duration / root.duration) * 100
        }%">
            <span class='tooltip rounded shadow-lg p-1 bg-gray-100 text-red-500 mt-8'>${
              span.name
            }</span>
            ${span.type}: ${span.duration}ms
        </div>
    </div>
`);
  span.children.forEach((item) => printSpan(root, item));
}

function parseFile(filePath) {
  let rows = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => rows.push(data))
    .on("end", () => {
      // normalize timestamp
      rows = rows.map((item) => ({
        ...item,
        ts: normalizeTimestamp(parseFloat(item.ts)),
      }));

      // sort log by timestamp
      rows.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0));
      const root = getRootSpan(rows);
      addGrpcSpans(root, rows);
      addSqlSpans(root, rows);
      sortSpans(root);
      console.log(
        `<div class="relative flex min-h-screen flex-col space-y-1">`
      );
      printSpan(root, root);
      console.log(`</div>`);
    });
}

parseFile(path.join(__dirname, "..", "test", "fixtures", "message1.csv"));
