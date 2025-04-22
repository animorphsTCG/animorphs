
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { WebSocket } from 'k6/experimental/websockets';

// Error rate metric
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 25 },  // Ramp up to 25 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '60s', target: 100 }, // Ramp up to 100 users
    { duration: '60s', target: 200 }, // Ramp up to 200 users
    { duration: '60s', target: 200 }, // Stay at 200 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    // We want fewer than 1% of requests to fail
    'errors': ['rate<0.01'],
    'http_req_duration': ['p(95)<500'],
  },
};

export default function() {
  const BASE_URL = 'https://orrmjadspjsbdfnhnkgu.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycm1qYWRzcGpzYmRmbmhua2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODQ0MTksImV4cCI6MjA1OTE2MDQxOX0.p8Du23Cz-I-ja9yc0howqrtboJxBZp9muuFY4xVSPoU';
  
  // Simulate user login flow (using test accounts)
  const loginPayload = JSON.stringify({
    email: `testuser${__VU}@example.com`,
    password: 'password123',
  });
  
  const loginParams = {
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
  };
  
  // 1. Try to login
  const loginRes = http.post(
    `${BASE_URL}/auth/v1/token?grant_type=password`, 
    loginPayload, 
    loginParams
  );
  
  // Check if login was successful
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  if (!loginSuccess) {
    console.error(`Login failed for VU ${__VU}: ${loginRes.status} ${loginRes.body}`);
    errorRate.add(1);
    sleep(1);
    return;
  }
  
  const userData = JSON.parse(loginRes.body);
  const token = userData.access_token;
  
  // 2. Get user profile (using our RPC function)
  const profileParams = {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const profileRes = http.post(
    `${BASE_URL}/rest/v1/rpc/check_paid`, 
    JSON.stringify({ user_id: userData.user.id }), 
    profileParams
  );
  
  check(profileRes, {
    'profile fetch successful': (r) => r.status === 200,
  });
  
  // 3. Set up WebSocket connection to simulate realtime subscription
  try {
    const wsUrl = `wss://orrmjadspjsbdfnhnkgu.supabase.co/realtime/v1/websocket?apikey=${ANON_KEY}&vsn=1.0.0`;
    
    const ws = new WebSocket(wsUrl);
    
    // Handle WebSocket lifecycle
    ws.addEventListener('open', () => {
      // Send auth message
      ws.send(JSON.stringify({
        topic: 'realtime',
        event: 'phx_join',
        payload: {
          access_token: token,
        },
        ref: 1,
      }));
      
      // Subscribe to payment status channel for this user
      ws.send(JSON.stringify({
        topic: `realtime:payment_status:id=eq.${userData.user.id}`,
        event: 'phx_join',
        payload: {},
        ref: 2,
      }));
    });
    
    // Wait for a few seconds to simulate realtime connection
    sleep(5);
    
    // Close WebSocket properly
    ws.close();
  } catch (e) {
    console.error(`WebSocket error for VU ${__VU}: ${e}`);
    errorRate.add(1);
  }
  
  // 4. Make API calls to simulate game activities
  const battleModeRes = http.get(
    `${BASE_URL}/rest/v1/battle_lobbies?select=*&limit=5`,
    profileParams
  );
  
  check(battleModeRes, {
    'battle modes fetch successful': (r) => r.status === 200,
  });
  
  // Sleep between iterations to simulate realistic user behavior
  sleep(Math.random() * 3 + 2); // Sleep between 2-5 seconds
}
