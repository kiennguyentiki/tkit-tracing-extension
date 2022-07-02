const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

let results = [];

function parseFile(filePath) {
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      results.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0));
      console.log(results.length);
      results
        .filter((item) => item.grpc_time_ms != "" || item.elapsed)
        .forEach((item, index) => {
          if (item.grpc_time_ms) {
            console.log(
              parseFloat(item.ts),
              item.grpc_service,
              item.grpc_method,
              item.grpc_time_ms
            );
          } else {
            // console.log(
            //   "    ",
            //   parseFloat(item.ts),
            //   item.grpc_service,
            //   item.grpc_method,
            //   item.sql,
            //   item.elapsed
            // );
          }
        });
    });
}

parseFile(path.join(__dirname, "..", "test", "fixtures", "message1.csv"));
