/**
 * CloudMesh Scalability & Concurrent Load Test Script
 * Framework: k6 (https://k6.io/)
 * Target: Production Cloud Distribution (https://cloud-mesh-5606c.web.app)
 * 
 * Execution stages:
 * - Stage 1: 10 VUs for 30s (Warmup & Baseline)
 * - Stage 2: 50 VUs for 1m (Typical Community Incident Traffic)
 * - Stage 3: 100 VUs for 1m (Surge Crisis Event)
 * - Stage 4: 500 VUs for 30s (Stress / Extreme Blackout Surge)
 * - Stage 5: Ramp-down to 0 VUs
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% of requests must complete below 300ms
    http_req_duration: ['p(95)<300'],
    // Error rate must remain under 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://cloud-mesh-5606c.web.app';

export default function () {
  // Test 1: Edge CDN Static Root Delivery (SPA Entry)
  const rootRes = http.get(BASE_URL);
  check(rootRes, {
    'status is 200': (r) => r.status === 200,
    'protocol is HTTP/2 or HTTPS': (r) => r.proto.startsWith('HTTP/2') || r.url.startsWith('https://'),
    'contains CloudMesh title': (r) => r.body.includes('CloudMesh'),
  });

  sleep(1);

  // Test 2: Asset chunk caching latency
  const assetRes = http.get(`${BASE_URL}/favicon.svg`);
  check(assetRes, {
    'asset status is 200 or 304': (r) => r.status === 200 || r.status === 304,
  });

  sleep(1);
}

