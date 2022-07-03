import Papa from "papaparse";

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
      if (!item.grpc_time_ms || !item.grpc_service || !item.grpc_method) return;
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

async function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        resolve(result.data);
      },
    });
  });
}

export async function processFile(file) {
  let rows = await parseCsvFile(file);
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
  return root;
}
