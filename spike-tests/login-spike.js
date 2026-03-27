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

export default function () {
  // pick random user (1–100)
  const userId = Math.floor(Math.random() * 100) + 1;

  const payload = JSON.stringify({
    email: `testuser${userId}@example.com`,
    password: "123456",
  });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "login success or handled failure": (r) =>
      r.status === 200 || r.status === 400,
    "response time < 2s": (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
