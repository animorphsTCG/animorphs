
#!/bin/bash

# API Endpoint Testing Script
BASE_URL="http://195.179.228.179/api"

echo "Testing Animorphs TCG API endpoints..."

# Test basic connectivity
echo "1. Testing basic API connectivity..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/cards" && echo " - Cards endpoint: OK" || echo " - Cards endpoint: FAILED"

# Test auth endpoints
echo "2. Testing authentication..."
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"eos_id":"test_user","wallet_address":"0x123456"}' \
  "$BASE_URL/auth/login" > /dev/null && echo " - Login endpoint: OK" || echo " - Login endpoint: FAILED"

# Test card endpoints
echo "3. Testing card endpoints..."
curl -s "$BASE_URL/cards" > /dev/null && echo " - Get all cards: OK" || echo " - Get all cards: FAILED"
curl -s "$BASE_URL/cards/user/1" > /dev/null && echo " - Get user cards: OK" || echo " - Get user cards: FAILED"

# Test battle endpoints
echo "4. Testing battle endpoints..."
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"opponent_id":null}' \
  "$BASE_URL/battle/create" > /dev/null && echo " - Create match: OK" || echo " - Create match: FAILED"

# Test payment endpoints
echo "5. Testing payment endpoints..."
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"type":"deck"}' \
  "$BASE_URL/payments/checkout" > /dev/null && echo " - Payment checkout: OK" || echo " - Payment checkout: FAILED"

# Test music endpoints
echo "6. Testing music endpoints..."
curl -s "$BASE_URL/music/songs" > /dev/null && echo " - Get songs: OK" || echo " - Get songs: FAILED"
curl -s "$BASE_URL/music/user/1" > /dev/null && echo " - Get user songs: OK" || echo " - Get user songs: FAILED"

# Test leaderboard
echo "7. Testing leaderboard..."
curl -s "$BASE_URL/leaderboard" > /dev/null && echo " - Leaderboard: OK" || echo " - Leaderboard: FAILED"

# Test NFT sync
echo "8. Testing NFT sync..."
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"wallet_address":"0x123456"}' \
  "$BASE_URL/nft/sync" > /dev/null && echo " - NFT sync: OK" || echo " - NFT sync: FAILED"

echo "API testing completed!"
