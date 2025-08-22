# 🔑 VAPID Keys Setup Guide

VAPID keys are required for push notifications to work properly. Here's how to set them up:

## 🚀 Quick Setup (2 minutes)

### Step 1: Generate VAPID Keys
Run this command in your project directory:
```bash
npx web-push generate-vapid-keys
```

You'll get output like this:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa1lQ...

Private Key:
VkYpKzIxSXlPc1FucmdYWmprbEY...
=======================================
```

### Step 2: Add to Environment Variables
Create or update your `.env.local` file:
```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa1lQ...
VAPID_PRIVATE_KEY=VkYpKzIxSXlPc1FucmdYWmprbEY...
VAPID_SUBJECT=mailto:your-email@example.com
```

### Step 3: Restart Your Development Server
```bash
npm run dev
```

## 🧪 Testing After Setup

1. **Refresh your browser**
2. **Click "Check Status"** in the testing panel
3. **Click "Manual Subscribe"** to create push subscription
4. **Click "Push Test"** to verify it's working

## 🔍 Troubleshooting

### Issue: "VAPID key not found"
**Solution:** Make sure you've added the keys to `.env.local` and restarted the dev server.

### Issue: "Failed to create subscription"
**Solution:** 
1. Check that notification permission is granted
2. Verify VAPID keys are correct
3. Check browser console for errors

### Issue: "Server error"
**Solution:** 
1. Check that your API routes are working
2. Verify the `/api/notifications/push-subscription` endpoint exists
3. Check server logs for errors

## 📱 Production Deployment

For production, you'll need to:
1. Set the same environment variables in your hosting platform
2. Ensure your domain uses HTTPS
3. Test with real users

## 🎯 Success Indicators

You'll know it's working when:
- ✅ "Manual Subscribe" returns success
- ✅ "Push Test" shows active subscription
- ✅ Browser notifications appear when triggered
- ✅ No VAPID-related errors in console

---

**Need help?** Check the main testing guide for more detailed troubleshooting steps.
