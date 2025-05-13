
@echo off
echo Deploying Cloudflare D1 database worker...
npx wrangler deploy -c wrangler.db-worker.toml

echo Worker deployment complete.
echo Testing worker health...
curl -s https://db-worker.mythicmasters.workers.dev/health
echo.
echo If you see {"status":"ok"} above, the worker is healthy.
