# Sentry Integration Setup Guide

TheMatch now uses **Sentry** - the industry-standard error tracking and performance monitoring solution for React Native apps.

## What is Sentry?

Sentry provides:
- **Real-time error tracking** - Get instant notifications when errors occur
- **Performance monitoring** - Track slow screens and API calls
- **Session replay** - See what users did before an error
- **Release tracking** - Track errors by version
- **User context** - Know which users are affected
- **Stack traces** - Full error details with source code
- **Breadcrumbs** - User actions leading to errors

## Setup Instructions

### 1. Create a Sentry Account (Free)

1. Go to https://sentry.io
2. Click "Sign Up" (free tier includes 5,000 errors/month)
3. Choose "Sign up with email" or use GitHub/Google

### 2. Create a Project

1. After signing in, click "Create Project"
2. Select **React Native** as the platform
3. Name your project (e.g., "TheMatch")
4. Click "Create Project"

### 3. Get Your DSN

After creating the project, you'll see a setup page with your DSN (Data Source Name).

It looks like this:
```
https://1234567890abcdef@o1234567.ingest.sentry.io/1234567
```

**Copy this DSN** - you'll need it in the next step.

### 4. Configure Your App

#### Option A: Using .env file (Recommended)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your DSN:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://YOUR_DSN_HERE
   ```

3. Restart your app:
   ```bash
   npm start
   ```

#### Option B: Direct configuration

Edit `lib/utils/sentry.ts` and replace this line:
```typescript
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';
```

With your DSN:
```typescript
const SENTRY_DSN = 'https://YOUR_DSN_HERE';
```

### 5. Verify Setup

1. Start your app
2. You should see in the console:
   ```
   ✅ Sentry initialized successfully
   ```

3. To test error tracking, you can deliberately cause an error:
   ```typescript
   // Add this to any button's onPress
   throw new Error('Test error for Sentry');
   ```

4. Check your Sentry dashboard at https://sentry.io - you should see the error appear within seconds!

## Features Enabled

### ✅ Automatic Error Tracking

All JavaScript errors are automatically tracked:
- Unhandled promise rejections
- React component errors (via Error Boundary)
- Database errors
- API errors

### ✅ Performance Monitoring

Track slow operations:
- Screen load times
- Database query performance
- API response times
- React render performance

### ✅ Breadcrumbs

See user actions before errors:
- Navigation (which screens they visited)
- User interactions (button clicks)
- Database operations
- Console logs

### ✅ Context Information

Every error includes:
- Device info (iOS/Android, version)
- App version
- User actions leading to error
- Environment (development/production)

### ✅ Release Tracking

Track errors by app version:
- See which version has the most errors
- Know if a new release introduces bugs
- Compare error rates between versions

## Using Sentry in Your Code

### Manual Error Tracking

```typescript
import { captureException, captureMessage } from '@/lib/utils/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, {
    customContext: 'value'
  });
}

// Or log a message
captureMessage('Something important happened', 'info');
```

### Adding User Context

```typescript
import { setUser } from '@/lib/utils/sentry';

// When user logs in
setUser({
  id: '123',
  email: 'user@example.com',
  username: 'john_doe'
});

// When user logs out
setUser(null);
```

### Adding Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/utils/sentry';

// Track custom user actions
addBreadcrumb('User created league', 'user_action', {
  leagueName: 'Friday Night Pool',
  gameType: 'pool'
});
```

### Performance Tracking

```typescript
import { startTransaction } from '@/lib/utils/sentry';

const transaction = startTransaction('Load Matches', 'db.query');
try {
  // Your code
  const matches = await loadMatches();
} finally {
  transaction.finish();
}
```

## Sentry Dashboard Features

Once errors start coming in, you can:

### Issues Tab
- View all errors
- See error frequency and trends
- Filter by device, OS, version
- Mark as resolved or ignored

### Performance Tab
- See slowest screens
- Track API performance
- Identify bottlenecks
- Compare performance over time

### Releases Tab
- Track errors by app version
- See if new release is stable
- Compare versions

### Alerts
Set up alerts for:
- New error types
- Error spike (sudden increase)
- Performance degradation
- Email/Slack/PagerDuty notifications

## Privacy & Data

Sentry automatically filters sensitive data:
- Passwords are never sent
- Credit card numbers are masked
- Personal info is redacted
- You control what gets sent

To filter additional data, edit `lib/utils/sentry.ts`:
```typescript
beforeSend(event, hint) {
  // Filter out specific errors
  if (event.message?.includes('ignore-this')) {
    return null; // Don't send to Sentry
  }
  return event;
}
```

## Cost

Sentry free tier includes:
- ✅ 5,000 errors per month
- ✅ 10,000 performance transactions
- ✅ 30 days data retention
- ✅ Unlimited team members
- ✅ Full feature access

This is plenty for most apps! When you exceed limits, they email you.

Paid plans start at $26/month for:
- 50,000 errors/month
- 100,000 transactions
- 90 days retention

## Production vs Development

**Development:**
- Errors logged to console (for debugging)
- Not sent to Sentry (to avoid noise)
- Full error details shown

**Production:**
- Errors sent to Sentry
- User sees friendly error screen
- You get instant notification

## Troubleshooting

### "Sentry DSN not configured" warning

You'll see this in development if DSN is not set. This is normal! Sentry is optional but highly recommended for production.

To enable it, follow steps 1-4 above.

### Errors not appearing in Sentry

1. Check console for "✅ Sentry initialized successfully"
2. Verify DSN is correct (no extra spaces)
3. Make sure you're in production build
4. Check Sentry project is for "React Native" platform
5. Wait 30 seconds - first error can take time to appear

### Too many test errors

In `lib/utils/sentry.ts`, you can filter test errors:
```typescript
beforeSend(event) {
  if (event.message?.includes('Test error')) {
    return null; // Don't send test errors
  }
  return event;
}
```

## Support

- **Sentry Docs:** https://docs.sentry.io/platforms/react-native/
- **Sentry Support:** support@sentry.io
- **Community:** https://forum.sentry.io/

## Summary

✅ **Installed** - @sentry/react-native package
✅ **Configured** - Automatic error and performance tracking
✅ **Integrated** - Logger and Error Boundary use Sentry
✅ **Ready** - Just add your DSN to get started!

**Next steps:**
1. Sign up at https://sentry.io
2. Create React Native project
3. Copy DSN to `.env` file
4. Restart app
5. Watch errors appear in real-time! 🎉
