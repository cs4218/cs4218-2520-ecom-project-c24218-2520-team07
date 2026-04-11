/**
 * Performance Breakpoint Test - Create Product Endpoint
 * Written by: Goh En Rui Ryann (A0252528A)
 * 
 * Breakpoint capacity test to determine maximum concurrent users
 * before API performance degrades below acceptable thresholds.
 * Test aborts automatically when failure rate or latency exceeds limits.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Create Product Endpoint Breakpoint Test
export const options = {
  stages: [
    { duration: '12m', target: 1500 },  // Slow linear ramp from 0 -> 1500 VUs
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
  const url = 'http://localhost:6060/api/v1/product';

  const payload = JSON.stringify({
    name: `Test Product ${__VU}`,
    description: "Load test product",
    price: 19.99,
    stock: 100
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    redirects: 10,
    followRedirects: true,
  };

  const response = http.post(url, payload, params);

  check(response, {
    'status is 201 Created': (r) => r.status === 201,
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
    "performance-tests/create-product-breakpoint-results.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
