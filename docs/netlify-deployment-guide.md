
# Netlify Deployment Guide for Animorphs Web Game

This document provides instructions for deploying the Animorphs web game to Netlify Free tier.

## Prerequisites

- GitHub account with access to the repository (https://github.com/animorphsTCG/animorphs.git)
- Netlify account (free tier)
- Supabase project credentials

## Deployment Steps

### 1. Connect & Build

1. Log in to your Netlify account
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select the repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

### 2. Environment Variables

Add the following environment variables in Netlify UI under "Site settings → Build & deploy → Environment":

```
VITE_SUPABASE_URL=https://orrmjadspjsbdfnhnkgu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycm1qYWRzcGpzYmRmbmhua2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODQ0MTksImV4cCI6MjA1OTE2MDQxOX0.p8Du23Cz-I-ja9yc0howqrtboJxBZp9muuFY4xVSPoU
```

Note: Never commit sensitive keys to your repository. Always use environment variables.

### 3. Custom Domain & SSL

1. Go to "Domain Management" in your Netlify site settings
2. Click "Add custom domain"
3. Enter `animorphs.lovable.app` and follow the verification process
4. Add the required DNS records to your domain registrar:
   - Type: CNAME
   - Name: animorphs
   - Value: [your-netlify-site].netlify.app
5. SSL will be provisioned automatically by Netlify (Let's Encrypt)

### 4. Continuous Deployment

1. Ensure "Production branch" is set to "main" under "Build & deploy" settings
2. Enable "Deploy previews" for pull requests
3. Set up notifications (optional):
   - Go to "Deploy notifications"
   - Add email or webhook notifications for success/failure alerts

### 5. Collaborators & Notifications

1. Go to "Site settings" → "General" → "Site details" → "Site collaborators"
2. Invite `lara32replica@gmail.com` and `danmar.dvdw@gmail.com` with appropriate permissions

### 6. Usage Monitoring

1. Go to "Site settings" → "General" → "Usage" → "Notifications"
2. Configure notifications for 50%, 75%, 90%, and 100% of bandwidth, build minutes, and function usage

## Free Tier Limits

- Bandwidth: 100 GB per month
- Build minutes: 300 per month
- Function invocations: 125,000 per month

## Troubleshooting

If you encounter issues with client-side routing, check that:
- The `netlify.toml` file is correctly configured with redirects
- The `public/_redirects` file exists with the correct content

For other issues, check Netlify's deploy logs under "Deploys" in your site dashboard.
