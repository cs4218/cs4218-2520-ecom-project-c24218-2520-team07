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

const ADMIN_TOKEN = __ENV.ADMIN_TOKEN;
const CATEGORY_ID = __ENV.CATEGORY_ID;

export default function () {
  const payload = {
    name: `Spike Product ${Date.now()}-${Math.random()}`,
    description: "Created during spike test",
    price: "100",
    quantity: "10",
    shipping: "1",
    category: CATEGORY_ID,
  };

  const res = http.post(`${BASE_URL}/api/v1/product/create-product`, payload, {
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    tags: { endpoint: "create-product" },
    timeout: "30s",
  });

  check(res, {
    "product created or handled": (r) =>
      r.status === 200 || r.status === 201 || r.status === 400,
    "response time < 2s": (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
