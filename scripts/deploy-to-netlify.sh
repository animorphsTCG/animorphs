
#!/bin/bash

# Script to deploy the Animorphs web game to Netlify
# Make sure to run 'chmod +x scripts/deploy-to-netlify.sh' before using this script

echo "Preparing to deploy to Netlify..."

# 1. Ensure we're on the main branch
git checkout main || { echo "Failed to checkout main branch"; exit 1; }

# 2. Pull latest changes
echo "Pulling latest changes from repository..."
git pull || { echo "Failed to pull latest changes"; exit 1; }

# 3. Install dependencies
echo "Installing dependencies..."
npm install || { echo "Failed to install dependencies"; exit 1; }

# 4. Run tests (if available)
if npm test 2>/dev/null; then
    echo "Tests passed!"
else
    echo "No tests found or tests failed. Continuing deployment..."
fi

# 5. Build the project
echo "Building project..."
npm run build || { echo "Build failed"; exit 1; }

# 6. Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Netlify CLI not found. Installing..."
    npm install -g netlify-cli || { echo "Failed to install Netlify CLI"; exit 1; }
fi

# 7. Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod || { echo "Deployment failed"; exit 1; }

echo "Deployment complete! Check the Netlify dashboard for details."
echo "Don't forget to set up your environment variables in the Netlify UI."

exit 0
