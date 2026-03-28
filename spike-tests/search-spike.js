import http from "k6/http";
import { sleep, check } from "k6";
import { spikeStages, BASE_URL } from "./config.js";

export const options = {
  stages: spikeStages,
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.1"],
  },
};

const keywords = ["phone", "laptop", "watch", "bag"];

export default function () {
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];

  const res = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`, {
    tags: { endpoint: "search-product" },
  });

  check(res, {
    "search success": (r) => r.status === 200,
    "response time < 2s": (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
