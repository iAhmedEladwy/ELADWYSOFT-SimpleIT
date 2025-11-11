# SimpleIT v0.4.7 - Deployment Verification Guide

## 🌐 Server Information
- **URL**: http://192.168.207.144:5000
- **Login Page**: http://192.168.207.144:5000/login
- **Version**: 0.4.7-InAppNotification
- **Environment**: Virtual Machine (Ubuntu/Linux)

---

## 📋 Deployment Steps (Execute on VM)

### Step 1: Pull Latest Changes
```bash
cd /opt/simpleit
sudo git pull origin v0.4.7-InAppNotification
```

### Step 2: Fix Database Constraint
```bash
# Clean orphaned activity logs
sudo -u postgres psql -d simpleit -c "DELETE FROM activity_log WHERE user_id NOT IN (SELECT id FROM users);"
```

### Step 3: Push Schema Changes
```bash
# This creates Super Admin role, system_logs table, notification_preferences table
sudo npm run db:push
```

### Step 4: Create Super Admin User
```bash
# This creates user "dev" with password "SuperDev@2025!"
sudo -u postgres psql -d simpleit -f scripts/migrate-system-logs.sql
```

### Step 5: Restart Application
```bash
# Choose one based on your setup:
sudo systemctl restart simpleit
# OR
pm2 restart simpleit
```

---

## 🧪 Testing Checklist

### Test 1: Regular Admin Access (CRITICAL)
**URL**: http://192.168.207.144:5000/login

1. **Login with existing admin user**
   - Username: [your existing admin username]
   - Password: [your existing admin password]

2. **Verify all modules are visible**:
   - ✅ Dashboard
   - ✅ Employees
   - ✅ Assets
   - ✅ Tickets
   - ✅ Reports
   - ✅ System Config
   - ✅ Admin Console (with dropdown):
     - ✅ Users
     - ✅ Backup & Restore
     - ✅ System Health
     - ✅ Audit Logs
     - ✅ Upgrade Requests
     - ✅ Bulk Operations History
   - ❌ System Logs (should NOT be visible)

3. **Test Notification System**:
   - Check notification bell in header (should show unread count)
   - Click bell → Should show dropdown with last 5 notifications
   - Click Dashboard → Should have "Notifications" tab
   - Navigate to User Profile → Should have "Notifications" tab
   - Test notification preferences toggles

---

### Test 2: Super Admin Access (NEW FEATURE)
**URL**: http://192.168.207.144:5000/login

1. **Login with Super Admin**:
   - Username: `dev`
   - Password: `SuperDev@2025!`

2. **Verify Super Admin sees everything**:
   - ✅ All admin modules (same as Test 1)
   - ✅ All features accessible

3. **Activate Hidden System Logs Menu**:
   - Scroll to bottom of sidebar
   - Look for version text: "SimpleIT v0.4.7"
   - **Triple-click** on the version text
   - ✅ System Logs menu item should appear in Admin Console
   - ✅ Menu item has yellow "DEV" badge
   - ✅ Terminal icon with yellow color

4. **Test System Logs Page**:
   - Click "System Logs" menu item
   - URL should be: http://192.168.207.144:5000/admin-console/system-logs
   - ✅ Page loads without errors
   - ✅ Statistics dashboard shows:
     - Total Logs count
     - Errors (24h) count
     - Unresolved Issues count
     - Top Modules list
   - ✅ Filters are visible (Level, Module, Search, Dates, Status, Limit)
   - ✅ Table shows sample logs (from migration script)
   - ✅ Actions work: Refresh, Export CSV, Cleanup

5. **Test Log Filtering**:
   - Filter by Level: ERROR
   - Filter by Module: "test"
   - Search: "error"
   - Verify table updates correctly

6. **Test Mark as Resolved**:
   - Find an unresolved log
   - Click "Mark Resolved" button
   - Verify badge changes to green "Resolved"

---

### Test 3: Notification Preferences (NEW FEATURE)
**URL**: http://192.168.207.144:5000/profile

1. **Navigate to User Profile**:
   - Click user icon in header
   - Select "Profile" or go directly to /profile

2. **Check Notifications Tab**:
   - ✅ Should see 4 tabs: Profile, Password, Security, Notifications
   - Click "Notifications" tab

3. **Verify Preference Toggles**:
   - ✅ Ticket Notifications toggle
   - ✅ Asset Notifications toggle
   - ✅ Maintenance Notifications toggle
   - ✅ Upgrade Requests toggle
   - ✅ System Notifications toggle
   - ✅ Employee Notifications toggle
   - All should be ON by default

4. **Test Preference Saving**:
   - Toggle one preference OFF
   - Wait for success message
   - Refresh page
   - Verify preference is still OFF

---

### Test 4: Logger Service (Backend Verification)

1. **Check Log Files Created**:
   ```bash
   # On VM
   cd /opt/simpleit
   ls -la logs/
   # Should see: YYYY-MM-DD.log (today's date)
   
   # View log contents
   tail -f logs/$(date +%Y-%m-%d).log
   ```

2. **Trigger Test Logs** (Optional):
   - Perform various actions (login, create ticket, etc.)
   - Check if logs are being written to file
   - Check System Logs UI for ERROR level logs in database

---

## 🔍 Troubleshooting

### Issue: Admin sees no modules after login
**Solution**:
```bash
# Restart application to load new RBAC logic
sudo systemctl restart simpleit
# OR
pm2 restart simpleit

# Clear browser cache and refresh
```

### Issue: Triple-click doesn't show System Logs
**Verify**:
- Logged in as user with role 'super_admin' (not 'admin')
- Check database:
  ```bash
  sudo -u postgres psql -d simpleit -c "SELECT id, username, role, access_level FROM users WHERE username = 'dev';"
  # Should show: role = 'super_admin', access_level = '5'
  ```

### Issue: System Logs page shows 404
**Verify route is working**:
- Check browser console for errors
- Try accessing directly: http://192.168.207.144:5000/admin-console/system-logs
- Verify user role is 'super_admin'

### Issue: No sample logs in System Logs page
**Run migration again**:
```bash
sudo -u postgres psql -d simpleit -f scripts/migrate-system-logs.sql
```

### Issue: Cannot mark logs as resolved
**Check permissions**:
```bash
# Verify user has permission
sudo -u postgres psql -d simpleit -c "SELECT role FROM users WHERE username = 'dev';"
# Must be 'super_admin'
```

---

## ✅ Success Criteria

All these must pass:

- [ ] Regular admin can access ALL existing features
- [ ] Regular admin CANNOT see System Logs
- [ ] Super Admin (dev) can login successfully
- [ ] Super Admin triple-click reveals System Logs menu
- [ ] System Logs page loads and displays data
- [ ] Notification bell appears in header
- [ ] Notification preferences tab exists in User Profile
- [ ] Log files are created in logs/ directory
- [ ] No console errors in browser

---

## 📞 Quick Commands Reference

```bash
# Check application status
sudo systemctl status simpleit
# OR
pm2 status simpleit

# View application logs
sudo journalctl -u simpleit -f
# OR
pm2 logs simpleit

# View database logs
sudo -u postgres psql -d simpleit -c "SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 10;"

# Check database schema
sudo -u postgres psql -d simpleit -c "\d system_logs"
sudo -u postgres psql -d simpleit -c "\d notification_preferences"

# Verify users
sudo -u postgres psql -d simpleit -c "SELECT id, username, role, access_level FROM users;"
```

---

## 🎯 Quick Test URLs

After deployment, test these URLs:

1. **Login**: http://192.168.207.144:5000/login
2. **Dashboard**: http://192.168.207.144:5000/
3. **User Profile**: http://192.168.207.144:5000/profile
4. **System Logs** (Super Admin only): http://192.168.207.144:5000/admin-console/system-logs
5. **Admin Console**: http://192.168.207.144:5000/admin-console

---

## 📊 Expected Results Summary

| Feature | Regular Admin | Super Admin (dev) |
|---------|--------------|-------------------|
| All existing modules | ✅ Full Access | ✅ Full Access |
| Notification System | ✅ Full Access | ✅ Full Access |
| Notification Preferences | ✅ Full Access | ✅ Full Access |
| System Logs Menu (Hidden) | ❌ Not Visible | ✅ Via Triple-click |
| System Logs Page | ❌ 404 Error | ✅ Full Access |
| Log Files (Backend) | N/A | ✅ View/Export |

---

**Ready to deploy? Run the commands above on your VM and test! 🚀**

**Server**: http://192.168.207.144:5000
