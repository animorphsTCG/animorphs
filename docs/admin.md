
# Animorphs TCG - Admin Documentation

## Overview

This document outlines the admin features and capabilities of the Animorphs TCG application. The admin panel provides tools for managing users, songs, payments, Cloudflare deployments, and accessing logs.

## Accessing the Admin Panel

The admin panel can be accessed in two ways:

1. **Shield Icon** - A shield icon (🛡️) is visible in the top-right corner of the application. Clicking this icon will open the authentication dialog when signed in.
2. **Profile Page** - Administrators will see an "Open Admin Panel" button in their profile page.

## Authentication

For security, the admin panel requires two-factor authentication:

### Desktop Authentication

On desktop, administrators authenticate using a Time-based One-Time Password (TOTP):

1. Enter your 6-digit authentication code from your authenticator app
2. The code is verified against your stored TOTP secret

### Mobile Authentication

On mobile devices with supported browsers and hardware:

1. Click "Use Fingerprint" in the authentication dialog
2. Authenticate using your device's biometric sensor (fingerprint)

### Backup Codes

You can generate backup codes as a fallback authentication method:

1. Click "Generate Backup Codes" in the authentication dialog
2. Store these codes securely - each code can only be used once
3. Use a backup code in place of a TOTP code if needed

## Admin Panel Features

The admin panel contains the following sections:

### User Management

- View all registered users
- Filter and search for specific users
- Edit user details and permissions
- Revoke access for non-paying users

### Song Management

- Add new songs to the YouTube music plugin
- Edit song metadata (title, preview times)
- Remove songs from the catalog
- Automatic worker deployment on song changes

### Payment Management

- View all user payments
- Filter by payment status
- Process manual payments
- Issue refunds

### Subscription Management

- View all music subscriptions
- Manage subscription status
- Set expiration dates
- Revoke subscriptions

### Analytics Dashboard

- View usage statistics
- Monitor user activity
- Track payment conversions
- View error rates

### Wrangler Terminal

The Wrangler Terminal provides direct access to Cloudflare operations:

- Run Wrangler commands directly from the admin panel
- View command output in real-time
- Execute database queries against D1
- Deploy worker changes
- Apply migrations

**Common Commands:**

```bash
# Query the database
npx wrangler d1 execute animorphs-db --command "SELECT * FROM profiles LIMIT 5"

# Deploy a worker
npx wrangler publish worker-templates/db-worker.js

# Apply migrations
npx wrangler d1 migrations apply animorphs-db
```

### Cloudflare Logs

- View errors from Cloudflare deployments
- See pending scripts queued for execution
- Mark errors as resolved or ignored
- Execute pending scripts manually

## Automated Deployments

The application includes automatic deployment of Cloudflare resources:

1. When changes are detected in `src/workers/` or `migrations/`, a deployment is triggered
2. The system runs `wrangler publish --remote` and any pending migrations
3. Results are logged and any errors are stored in the `cloudflare_errors` table
4. Errors are surfaced in the admin UI for resolution

## Error Handling

If automated deployments fail:

1. Errors are logged to the `cloudflare_errors` table
2. Admins can view the errors in the Cloudflare Logs section
3. Failed deployments can be retried manually via the Wrangler Terminal
4. Admins can mark errors as "resolved" or "ignored"

## Security Considerations

- Admin access is protected by 2FA (TOTP or WebAuthn)
- All admin API requests require authentication and admin privileges
- Authentication tokens have a short expiry time
- Failed authentication attempts are logged
- Backup codes are stored securely and can only be used once

## Troubleshooting

If you encounter issues with the admin panel:

1. Check the browser console for JavaScript errors
2. Verify your admin permissions in the profiles table
3. Try clearing your browser cache and cookies
4. Ensure your authenticator app's time is synchronized
5. Use a backup code if TOTP authentication fails

For persistent issues, contact the development team.

---

*This documentation is maintained by the Animorphs TCG development team. Last updated: May 2025*
