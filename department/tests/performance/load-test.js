import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:18081';

export const options = {
  stages: [
    { duration: '10s', target: 5  },
    { duration: '20s', target: 10 },
    { duration: '10s', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],
    http_req_failed:   ['rate<0.01'],
    errors:            ['rate<0.01'],
  },
};

export default function () {
  let res = http.get(`${BASE_URL}/api/list`);
  const ok = check(res, {
    'list: status 200':           (r) => r.status === 200,
    'list: response time <300ms': (r) => r.timings.duration < 300,
    'list: has body':             (r) => r.body.length > 0,
  });
  errorRate.add(!ok);
  sleep(1);
}
