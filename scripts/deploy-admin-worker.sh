
#!/bin/bash

# Script to deploy the Cloudflare admin API worker

echo "Deploying Cloudflare Admin API worker..."
npx wrangler deploy -c wrangler.admin-worker.toml

echo "Worker deployment complete."
echo "Testing worker health..."
curl -s https://admin-api-worker.mythicmasters.workers.dev/health | grep -q "ok" && \
  echo "Worker is healthy and responding to requests." || \
  echo "Worker health check failed. Check deployment logs."
