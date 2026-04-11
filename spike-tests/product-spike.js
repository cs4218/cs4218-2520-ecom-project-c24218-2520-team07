import http from "k6/http";
import { sleep, check } from "k6";
import { spikeStages, BASE_URL } from "./config.js";

export const options = {
  stages: spikeStages,
  thresholds: {
    http_req_duration: ["p(95)<2000"], // performance target
    http_req_failed: ["rate<0.1"], // reliability target
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
    tags: { endpoint: "get-product" }, // added tag
  });

  check(res, {
    "products fetched": (r) => r.status === 200,
    "response time < 2s": (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
