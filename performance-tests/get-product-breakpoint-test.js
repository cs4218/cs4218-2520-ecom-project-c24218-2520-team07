import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Official k6 Breakpoint / Capacity Test
// Automatically stops at EXACT breaking point
export const options = {
  stages: [
    { duration: '12m', target: 3000 },  // Slow linear ramp from 0 -> 3000 VUs
  ],

  thresholds: {
    http_req_duration: [
      { threshold: 'p(95)<500', abortOnFail: true }
    ],
    http_req_failed: [
      { threshold: 'rate<0.01', abortOnFail: true }
    ],
  },

  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function () {
  const url = 'http://localhost:6060/api/v1/product/get-product';

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    redirects: 10,
    followRedirects: true,
  };

  const response = http.get(url, params);

  check(response, {
    'status is 200 OK': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'valid JSON response': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
  });
}

export function handleSummary(data) {
  return {
    "performance-tests/breakpoint-test-results.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
