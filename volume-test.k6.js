// LIM YIH FEI, A0256993J

import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Test configuration
export const options = {
    // Volume testing: Testing how the DB heavily fetching, counting, and skipping
    // behaves against the 10,000 seeded products.
    stages: [
        { duration: '10s', target: 5 },  // Ramp up to 5 concurrent users
        { duration: '30s', target: 5 },  // Stay at 5 users (constant pressure)
        { duration: '10s', target: 0 },  // Ramp down back to 0
    ],
    thresholds: {
        http_req_duration: ['p(90)<2500'], // 90% of requests must finish within 2.5s
        http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
    },
};

export default function () {
    const BASE_URL = 'http://localhost:6060/api/v1/product';
    
    group('Component 1: Regex Search Volume Test', function () {
        const keyword = 'Volume';
        const res = http.get(`${BASE_URL}/search/${keyword}`);
        check(res, {
            'search status 200': (r) => r.status === 200,
            'search handles high volume data': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return Array.isArray(body) && body.length > 0;
                } catch (e) {
                    return false;
                }
            }
        });
    });

    group('Component 2: Global Database Count Scan', function () {
        const res = http.get(`${BASE_URL}/product-count`);
        check(res, {
            'count status 200': (r) => r.status === 200,
            'count total exceeds 10k': (r) => {
                try {
                    return JSON.parse(r.body).total >= 10000;
                } catch (e) {
                    return false;
                }
            }
        });
    });

    group('Component 3: Deep Pagination Stress', function () {
        // Hitting page 1500 forces the Database offest to skip roughly 9,000 records
        const res = http.get(`${BASE_URL}/product-list/1500`);
        check(res, {
            'pagination status 200': (r) => r.status === 200,
            'pagination request succeeds': (r) => {
                try {
                    return JSON.parse(r.body).success === true;
                } catch (e) {
                    return false;
                }
            }
        });
    });

    sleep(1);
}
