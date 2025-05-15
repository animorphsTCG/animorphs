
@echo off
echo Deploying Cloudflare Admin API worker...
npx wrangler deploy -c wrangler.admin-worker.toml

echo Worker deployment complete.
echo Testing worker health...
curl -s https://admin-api-worker.mythicmasters.workers.dev/health
echo.
echo If you see {"status":"ok"} above, the worker is healthy.
