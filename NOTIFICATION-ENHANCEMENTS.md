# Notification Enhancements - Sound & Auto-Refresh

## 🔔 Features Added

### 1. **Sound Notifications**
Play a pleasant two-tone sound when new notifications arrive.

**Features:**
- ✅ Web Audio API (no external files needed)
- ✅ Two-tone pleasant notification sound
- ✅ User preference stored in localStorage
- ✅ Test sound button in settings
- ✅ Only plays for NEW unread notifications
- ✅ Doesn't play on first page load (existing notifications)

**Files:**
- `client/src/lib/notificationSound.ts` - Sound utility functions
- `client/src/components/notifications/NotificationSettings.tsx` - UI for sound settings

---

### 2. **Improved Auto-Refresh (Polling Strategies)**

Three polling strategies available without WebSocket:

#### **Option 1: Fixed Interval (Default)**
```typescript
useNotifications({
  refetchInterval: 30000, // 30 seconds
  pollingStrategy: 'fixed'
})
```
- Polls every 30 seconds regardless of page state
- Simple and predictable
- **Current default behavior**

#### **Option 2: Adaptive Polling**
```typescript
useNotifications({
  refetchInterval: 30000,
  pollingStrategy: 'adaptive'
})
```
- **30 seconds** when page is focused
- **60 seconds** when page is not focused (saves bandwidth)
- Adapts to user activity

#### **Option 3: Visibility-Based Polling**
```typescript
useNotifications({
  pollingStrategy: 'visibility'
})
```
- Polls every 30 seconds when tab is **visible**
- **Stops polling** completely when tab is hidden
- Resumes when tab becomes visible again
- Best for battery/bandwidth conservation

---

### 3. **Server-Side Enhancements**

#### **Enhanced GET /api/notifications endpoint**

Now supports additional query parameters:

```typescript
// Get only NEW notifications since timestamp
GET /api/notifications?since=2025-11-12T10:30:00Z

// Get only unread notifications
GET /api/notifications?unreadOnly=true

// Combine filters
GET /api/notifications?since=2025-11-12T10:30:00Z&unreadOnly=true&limit=20
```

**Query Parameters:**
- `limit` - Max notifications to return (default: 50, max: 100)
- `offset` - Skip N notifications (pagination)
- `since` - ISO timestamp, get notifications created after this time
- `unreadOnly` - Return only unread notifications (true/false)

**Benefits:**
- Reduces data transfer (only fetch what changed)
- Faster response times
- More efficient polling

---

## 🎯 How It Works

### Sound Detection Algorithm

```typescript
// On each poll:
1. Fetch latest notifications from server
2. Compare current notification IDs with previous poll
3. Identify NEW notification IDs (not in previous set)
4. Filter for unread notifications
5. If new unread notifications found:
   - Check if sound is enabled (localStorage)
   - Play notification tone
6. Update previous notification IDs for next poll
```

**Key Features:**
- ✅ Only plays for NEW notifications (not on page reload)
- ✅ Only plays for UNREAD notifications
- ✅ Prevents sound spam (tracks what was already seen)
- ✅ Respects user preference (can be disabled)

---

## 📱 Usage Examples

### Basic Usage (Default)
```typescript
const { notifications, unreadCount } = useNotifications();
// Sound enabled, fixed 30-second polling
```

### Disable Sound
```typescript
const { notifications } = useNotifications({
  enableSound: false
});
```

### Adaptive Polling (Recommended)
```typescript
const { notifications } = useNotifications({
  pollingStrategy: 'adaptive', // 30s focused, 60s unfocused
  enableSound: true
});
```

### Battery Saver Mode
```typescript
const { notifications } = useNotifications({
  pollingStrategy: 'visibility', // Stop polling when hidden
  enableSound: true
});
```

### Dashboard (More Notifications, Slower Polling)
```typescript
const { notifications } = useNotifications({
  limit: 100, // Show more notifications
  refetchInterval: 60000, // Poll every minute
  pollingStrategy: 'adaptive'
});
```

---

## 🔧 Configuration

### User Sound Preference

Stored in `localStorage`:
```typescript
// Enable sound
setSoundPreference(true);

// Disable sound
setSoundPreference(false);

// Check current setting
const isEnabled = getSoundPreference();
```

### Custom Polling Intervals

```typescript
// Bell icon (frequent updates)
useNotifications({ refetchInterval: 15000 }) // 15 seconds

// Dashboard (less frequent)
useNotifications({ refetchInterval: 60000 }) // 1 minute

// Disable auto-refresh
useNotifications({ refetchInterval: false })
```

---

## 🚀 Polling Strategies Comparison

| Strategy | Active Tab | Hidden Tab | Battery Impact | Bandwidth | Use Case |
|----------|-----------|------------|----------------|-----------|----------|
| **Fixed** | 30s | 30s | Medium | Medium | Default, predictable |
| **Adaptive** | 30s | 60s | Low | Low | **Recommended** |
| **Visibility** | 30s | Stopped | Very Low | Very Low | Battery-critical devices |

---

## 🎨 UI Components

### Notification Bell
- Shows unread count badge
- Plays sound on new notifications
- Updates every 30 seconds (default)
- Located in header

### Notification Settings
- Toggle sound on/off
- Test sound button
- Auto-refresh status indicator
- Accessible from user profile

### Dashboard Notifications
- Full notification list
- "Mark All as Read" button
- "Clear All" button
- Auto-refreshes every 30 seconds

---

## 📊 Performance Considerations

### Network Efficiency

**Before (Old System):**
```
Every 30s: Fetch ALL 50 notifications (5-10KB)
```

**After (Optimized):**
```
// Option 1: Only fetch new notifications
Every 30s: ?since=lastPoll (0-2KB typically)

// Option 2: Only when visible
When hidden: No requests (0KB)
When visible: Normal polling
```

### Sound Performance

- **Web Audio API** - Native browser, no file downloads
- **Generated tones** - No external audio files needed
- **One-time init** - Audio context initialized on first user interaction
- **Lightweight** - ~100ms to generate and play sound

---

## 🔒 Browser Compatibility

### Sound Support
✅ Chrome 35+
✅ Firefox 25+
✅ Safari 14.1+
✅ Edge 79+
❌ Internet Explorer (not supported)

### Polling Support
✅ All modern browsers
✅ Falls back gracefully if features unavailable

---

## 🐛 Troubleshooting

### Sound Not Playing?

**1. Check browser compatibility**
```typescript
import { canPlaySound } from '@/lib/notificationSound';
if (!canPlaySound()) {
  console.log('Browser does not support Web Audio API');
}
```

**2. Check user preference**
```typescript
const soundEnabled = getSoundPreference();
console.log('Sound enabled:', soundEnabled);
```

**3. Check for user interaction**
Sound requires user interaction first (browser restriction):
- Click anywhere on the page
- Press any key
- Sound will work after first interaction

### Notifications Not Updating?

**1. Check polling is enabled**
```typescript
const { isLoading, error } = useNotifications();
console.log('Loading:', isLoading);
console.log('Error:', error);
```

**2. Check network tab**
- Should see GET requests to `/api/notifications` every 30s
- Look for 200 OK responses

**3. Check visibility state (if using visibility strategy)**
```typescript
document.addEventListener('visibilitychange', () => {
  console.log('Page visible:', !document.hidden);
});
```

---

## 🔮 Future Enhancements

### Planned Features (Not Yet Implemented)

**1. WebSocket Support**
```typescript
useNotifications({
  transport: 'websocket' // Real-time, no polling needed
})
```

**2. Custom Sound Upload**
```typescript
useNotifications({
  customSoundUrl: '/sounds/notification.mp3'
})
```

**3. Do Not Disturb Mode**
```typescript
useNotifications({
  quietHours: { start: '22:00', end: '08:00' }
})
```

**4. Notification Grouping**
```typescript
// "You have 5 new ticket notifications" instead of 5 separate sounds
```

---

## 📚 Related Files

**Frontend:**
- `client/src/hooks/use-notifications.ts` - Main notification hook
- `client/src/lib/notificationSound.ts` - Sound utility
- `client/src/components/notifications/NotificationBell.tsx` - Bell icon
- `client/src/components/notifications/NotificationSettings.tsx` - Settings UI
- `client/src/components/dashboard/Notifications.tsx` - Full list

**Backend:**
- `server/routes/notifications.ts` - API endpoints
- `server/services/notificationService.ts` - Notification creation

**Documentation:**
- `NOTIFICATION-ROOT-CAUSE-ANALYSIS.md` - Root cause analysis
- `docs/NOTIFICATION-CENTRALIZATION-OPTIONS.md` - Centralization options

---

## ✅ Testing Checklist

### Sound Tests
- [ ] Create new ticket with assignment → Sound plays
- [ ] Assign asset to employee → Sound plays
- [ ] Mark notification as read → No sound on next poll
- [ ] Disable sound in settings → No sound plays
- [ ] Enable sound → Test button works
- [ ] Reload page → No sound for existing notifications

### Polling Tests
- [ ] Notifications update every 30 seconds
- [ ] Switch to another tab → Still polling (fixed strategy)
- [ ] Switch to adaptive → Slower when unfocused
- [ ] Switch to visibility → Stops when hidden
- [ ] Network tab shows requests at correct intervals

### API Tests
```bash
# Test since parameter
curl "http://localhost:5000/api/notifications?since=2025-11-12T10:00:00Z"

# Test unreadOnly
curl "http://localhost:5000/api/notifications?unreadOnly=true"

# Test combined
curl "http://localhost:5000/api/notifications?since=2025-11-12T10:00:00Z&unreadOnly=true&limit=10"
```

---

## 📖 Conclusion

This implementation provides:
- ✅ **Sound notifications** without external files
- ✅ **Efficient polling** with 3 strategies
- ✅ **Optimized API** with filtering options
- ✅ **User control** over sound preferences
- ✅ **Battery-friendly** options
- ✅ **No WebSocket** dependency (easier deployment)

All without requiring WebSocket infrastructure!
