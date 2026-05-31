import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';

export const options = {
  stages: [
    { duration: '30s', target: 5  },
    { duration: '1m',  target: 10 },
    { duration: '30s', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors:            ['rate<0.05'],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/actuator/health/readiness`);
  check(health, { 'health UP': (r) => r.status === 200 });
  errorRate.add(health.status !== 200);

  const employees = http.get(`${BASE_URL}/api/employees`);
  check(employees, {
    'employees 200': (r) => r.status === 200,
    'has data':      (r) => r.body.length > 0,
  });
  errorRate.add(employees.status !== 200);
  responseTime.add(employees.timings.duration);

  const hello = http.get(`${BASE_URL}/api/hello`);
  check(hello, { 'hello 200': (r) => r.status === 200 });
  errorRate.add(hello.status !== 200);

  sleep(1);
}
