
#!/bin/bash

# Script to deploy the Cloudflare D1 database worker

echo "Deploying Cloudflare D1 database worker..."
npx wrangler deploy -c wrangler.db-worker.toml

echo "Worker deployment complete."
echo "Testing worker health..."
curl -s https://db-worker.mythicmasters.workers.dev/health | grep -q "ok" && \
  echo "Worker is healthy and responding to requests." || \
  echo "Worker health check failed. Check deployment logs."
