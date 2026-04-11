/**
 * Stress Test — Virtual Vault E-Commerce API
 * Author: Cleon Tan De Xuan (A0252030B)
 *
 * Purpose:
 *   Unlike volume testing (big data, fixed VUs), stress testing ramps concurrent
 *   users aggressively to locate the system's breaking point — the concurrency level
 *   at which response times degrade significantly or errors appear.
 *
 * Endpoints under test (aligned with Cleon's MS1/MS2 scope):
 *   1. GET  /api/v1/product/get-product         — full product listing (homepage)
 *   2. GET  /api/v1/product/product-list/:page  — paginated listing
 *   3. GET  /api/v1/product/product-count       — total product count
 *   4. GET  /api/v1/product/search/:keyword     — regex search (CPU-intensive)
 *   5. POST /api/v1/auth/login                  — authentication (bcrypt, CPU-intensive)
 *
 * Stress profile (ramp-up stages):
 *   Warm-up  →  Normal Load  →  Stress Zone  →  Breaking Point  →  Cool-down
 *   10 VUs       50 VUs          100 VUs          200 VUs           0 VUs
 *
 * Run command:
 *   K6_WEB_DASHBOARD=true \
 *   K6_WEB_DASHBOARD_EXPORT=nft/stress-test-report.html \
 *   K6_WEB_DASHBOARD_PERIOD=1s \
 *   k6 run nft/stress-test.k6.js
 *
 * Assumptions:
 *   - Backend server is running on localhost:6060
 *   - Database has at least a small number of existing products (normal dev state)
 *   - No pre-seeding required; stress tests concurrency, not data volume
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// A dedicated user for the stress test; setup() will register + login once.
const STRESS_USER_EMAIL = "nft.stress.cleon@test.com";
const STRESS_USER_PASSWORD = "StressTest123!";

// Search keywords that simulate realistic user behaviour.
const SEARCH_KEYWORDS = ["phone", "shirt", "book", "laptop", "watch", "a", "the"];

// ---------------------------------------------------------------------------
// Custom per-endpoint metrics (separate from k6's built-in http_req_duration)
// ---------------------------------------------------------------------------

const productListDuration   = new Trend("duration_product_list",      true);
const paginatedListDuration = new Trend("duration_paginated_list",    true);
const productCountDuration  = new Trend("duration_product_count",     true);
const searchDuration        = new Trend("duration_product_search",    true);
const loginDuration         = new Trend("duration_login",             true);
const customErrorRate       = new Rate("custom_error_rate");

// ---------------------------------------------------------------------------
// Test options — stress ramp-up profile
// ---------------------------------------------------------------------------

export const options = {
  stages: [
    { duration: "30s", target: 10  }, // Warm-up: 0 → 10 VUs
    { duration: "60s", target: 50  }, // Normal load: 10 → 50 VUs
    { duration: "60s", target: 100 }, // Stress zone: 50 → 100 VUs
    { duration: "60s", target: 200 }, // Breaking-point search: 100 → 200 VUs
    { duration: "30s", target: 0   }, // Cool-down: ramp back to 0
  ],

  thresholds: {
    // Global: 95th-percentile across all requests must stay under 3 s
    http_req_duration: ["p(95)<3000"],
    // Overall HTTP failure rate must stay below 5 %
    http_req_failed: ["rate<0.05"],
    // Custom error rate (checks that returned wrong status / missing body)
    custom_error_rate: ["rate<0.05"],

    // Per-endpoint thresholds (p95):
    // Product listing is a simple indexed find — should be fast
    duration_product_list: ["p(95)<1000"],
    // Paginated listing is also limited and sorted — should be fast
    duration_paginated_list: ["p(95)<1000"],
    // Count uses estimatedDocumentCount — near-instant
    duration_product_count: ["p(95)<500"],
    // Regex search is unindexed — allow more headroom
    duration_product_search: ["p(95)<2000"],
    // Login involves bcrypt comparison — intentionally slower
    duration_login: ["p(95)<5000"],
  },
};

// ---------------------------------------------------------------------------
// Setup — runs ONCE before VUs start; returns shared data to default()
// ---------------------------------------------------------------------------

export function setup() {
  const jsonHeaders = { "Content-Type": "application/json" };

  // Register the stress test user (safe to call if already exists; 400 is ignored)
  http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      name: "NFT Stress Tester",
      email: STRESS_USER_EMAIL,
      password: STRESS_USER_PASSWORD,
      phone: "00000000",
      address: "1 Stress Test Road",
      answer: "nft",
    }),
    { headers: jsonHeaders }
  );

  // Login to obtain an auth token for any protected-route checks
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: STRESS_USER_EMAIL,
      password: STRESS_USER_PASSWORD,
    }),
    { headers: jsonHeaders }
  );

  const token = loginRes.json("token") || "";
  console.log(`[setup] Auth token obtained: ${token ? "YES" : "NO (protected routes will be skipped)"}`);

  return { token };
}

// ---------------------------------------------------------------------------
// Default function — executed by every VU on every iteration
// ---------------------------------------------------------------------------

export default function (data) {
  const jsonHeaders = { "Content-Type": "application/json" };

  // ── Group 1: Full Product Listing ────────────────────────────────────────
  // Simulates a user landing on the homepage.
  // Controller: getProductController — .find({}).limit(12).sort({ createdAt: -1 })
  group("GET /api/v1/product/get-product", () => {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product`);
    productListDuration.add(res.timings.duration);

    const passed = check(res, {
      "product list: status 200": (r) => r.status === 200,
      "product list: success flag true": (r) => r.json("success") === true,
      "product list: products array present": (r) =>
        Array.isArray(r.json("products")),
    });
    customErrorRate.add(!passed);
  });

  sleep(0.5);

  // ── Group 2: Paginated Product List ──────────────────────────────────────
  // Simulates "Load More" on the homepage.
  // Controller: productListController — .skip().limit(6)
  group("GET /api/v1/product/product-list/:page", () => {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`);
    paginatedListDuration.add(res.timings.duration);

    const passed = check(res, {
      "paginated list: status 200": (r) => r.status === 200,
      "paginated list: success flag true": (r) => r.json("success") === true,
    });
    customErrorRate.add(!passed);
  });

  sleep(0.3);

  // ── Group 3: Product Count ────────────────────────────────────────────────
  // Simulates the count request made alongside pagination on the homepage.
  // Controller: productCountController — .estimatedDocumentCount()
  group("GET /api/v1/product/product-count", () => {
    const res = http.get(`${BASE_URL}/api/v1/product/product-count`);
    productCountDuration.add(res.timings.duration);

    const passed = check(res, {
      "product count: status 200": (r) => r.status === 200,
      "product count: total is a number": (r) =>
        typeof r.json("total") === "number",
    });
    customErrorRate.add(!passed);
  });

  sleep(0.3);

  // ── Group 4: Search (unindexed regex — CPU-intensive) ────────────────────
  // Simulates a user typing into the search bar.
  // Controller: searchProductController — $regex on name + description (no index)
  group("GET /api/v1/product/search/:keyword", () => {
    const keyword =
      SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const res = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`);
    searchDuration.add(res.timings.duration);

    const passed = check(res, {
      "search: status 200": (r) => r.status === 200,
      "search: response is array": (r) => Array.isArray(r.json()),
    });
    customErrorRate.add(!passed);
  });

  sleep(0.5);

  // ── Group 5: Login (bcrypt — CPU-intensive, ~20 % of iterations) ─────────
  // In a real e-commerce session, login happens once at the start — not every
  // page load. We model this at 20 % of iterations so it doesn't dominate
  // but still generates meaningful concurrent bcrypt load at high VU counts.
  if (Math.random() < 0.2) {
    group("POST /api/v1/auth/login", () => {
      const res = http.post(
        `${BASE_URL}/api/v1/auth/login`,
        JSON.stringify({
          email: STRESS_USER_EMAIL,
          password: STRESS_USER_PASSWORD,
        }),
        { headers: jsonHeaders }
      );
      loginDuration.add(res.timings.duration);

      const passed = check(res, {
        "login: status 200": (r) => r.status === 200,
        "login: success true": (r) => r.json("success") === true,
        "login: token present": (r) =>
          typeof r.json("token") === "string" && r.json("token").length > 0,
      });
      customErrorRate.add(!passed);
    });
  }
}
