# 🔔 Push Notification Testing Guide

This guide will help you test and verify that push notifications are working correctly in your school management system.

## 🚀 Quick Setup Checklist

### 1. Environment Setup
- [ ] Ensure you're running the app in **development mode** (`npm run dev`)
- [ ] Open the app in **Chrome** or **Edge** (best support for push notifications)
- [ ] Make sure you're accessing via `localhost` or `https://` (required for service workers)

### 2. VAPID Keys (Optional but Recommended)
```bash
# Generate VAPID keys for production push notifications
npx web-push generate-vapid-keys
```

Add to your `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@domain.com
```

## 🧪 Testing Steps

### Step 1: Basic Permission Test
1. **Open the app** in your browser
2. **Look for the notification prompt** in the bottom-right corner
3. **Click "Enable"** - this should trigger the browser's permission dialog
4. **Allow notifications** when prompted by the browser
5. **Verify** the prompt disappears after allowing

### Step 2: Use the Testing Panel
The testing panel appears in development mode (top-left corner):

#### Test Buttons Explained:
- **Check Status**: Verifies browser support and permission status
- **Test SW**: Checks if Service Worker is active
- **Browser Test**: Sends a direct browser notification
- **Push Test**: Verifies push subscription is active
- **Basic Notif**: Creates a database notification
- **Class Notif**: Sends notifications to a specific class

### Step 3: Manual Testing Scenarios

#### Scenario 1: Create an Event
1. Go to `/list/events`
2. Click "Create New Event"
3. Fill in the form and **select a specific class**
4. Submit the form
5. **Expected Result**: All students in that class + parents + class supervisor should receive notifications

#### Scenario 2: Create an Exam
1. Go to `/list/exams`
2. Create a new exam for a specific class
3. **Expected Result**: Class-wide notifications sent

#### Scenario 3: Create an Announcement
1. Go to `/list/announcements`
2. Create announcement **without selecting a class** (general)
3. **Expected Result**: All users (students, teachers, parents) receive notifications

## 🔍 Debugging Tools

### Browser DevTools
1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Check Service Workers section**:
   - Should show `sw.js` as "Activated and running"
   - Status should be green

4. **Check Console tab** for logs:
   - Service Worker registration messages
   - Notification creation logs
   - Push event logs

### Network Tab
- Monitor API calls to `/api/notifications/`
- Check for any failed requests

### Application Storage
- **Local Storage**: Check for notification dismissal flags
- **Session Storage**: Check for temporary dismissals

## 🐛 Common Issues & Solutions

### Issue 1: "Permission prompt not showing"
**Solutions:**
- Clear browser data for the site
- Check if notifications are blocked in browser settings
- Try incognito/private mode
- Refresh the page

### Issue 2: "Service Worker not registering"
**Solutions:**
- Check console for registration errors
- Verify `public/sw.js` exists
- Ensure you're on `localhost` or `https://`
- Try hard refresh (Ctrl+Shift+R)

### Issue 3: "Push notifications not working"
**Solutions:**
- Verify VAPID keys are set correctly
- Check if push subscription exists in DevTools
- Test with browser notification first
- Check network requests for push API calls

### Issue 4: "Notifications not appearing for class"
**Solutions:**
- Verify class has enrolled students
- Check if class has a supervisor assigned
- Look at database notifications table
- Test with a known class ID

## 📱 Testing on Different Browsers

### Chrome/Edge (Recommended)
- Full push notification support
- Best debugging tools
- Service Worker debugging

### Firefox
- Good push notification support
- May require different VAPID setup
- Check Firefox-specific console logs

### Safari
- Limited push notification support
- May not work in development
- Requires Apple Push Notification service for production

### Mobile Browsers
- Android Chrome: Full support
- iOS Safari: Limited support
- Test on actual devices for mobile

## 🔧 Environment Variables Reference

```env
# Required for production push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com

# Database
DB_URL=your_database_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

## 📊 Testing Checklist

### Basic Functionality
- [ ] Notification permission prompt appears
- [ ] Browser permission dialog works
- [ ] Service Worker registers successfully
- [ ] Database notifications are created
- [ ] In-app notification dropdown works

### Push Notifications (with VAPID keys)
- [ ] Push subscription is created
- [ ] Browser notifications appear
- [ ] Notification click opens correct page
- [ ] Notification actions work (View/Dismiss)
- [ ] Multiple notifications don't duplicate

### Class-wise Notifications
- [ ] Class-specific events notify class members
- [ ] Class supervisor receives notifications
- [ ] Parents of class students receive notifications
- [ ] General announcements notify all users

### Edge Cases
- [ ] Denied permissions are handled gracefully
- [ ] Offline functionality works
- [ ] Service Worker updates correctly
- [ ] Multiple browser tabs work correctly

## 🚨 Production Deployment

### Before Going Live:
1. **Set up VAPID keys** in production environment
2. **Test with HTTPS** domain
3. **Configure proper CSP headers** for service workers
4. **Test notification delivery** with real users
5. **Set up monitoring** for push notification failures
6. **Configure rate limiting** for notification APIs

### Monitoring in Production:
- Track notification delivery rates
- Monitor service worker registration failures
- Log push subscription errors
- Track user permission grant/deny rates

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Test in incognito mode
4. Try a different browser
5. Check the database for notification records

## 🎯 Success Criteria

Your notification system is working correctly when:
- ✅ Permission prompt appears on first visit
- ✅ Browser shows native permission dialog
- ✅ Service Worker is active and running
- ✅ Database notifications are created for events
- ✅ Browser notifications appear (if VAPID keys set)
- ✅ Class-wise notifications target correct users
- ✅ Notification clicks navigate to correct pages
- ✅ System works across browser sessions

---

**Happy Testing! 🎉**
