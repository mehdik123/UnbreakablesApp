# 🔐 Security Quick Start Guide

Your coaching app now has **simple, secure authentication** protecting both the coach dashboard and client links!

## ✅ What's Been Added

### 1. **Coach Login Protection**
- Dashboard only accessible with username/password
- Credentials stored in environment variables
- Logout button in the header

### 2. **Client Login Protection**  
- Shared client links require authentication
- Each client has unique username/password
- Credentials managed through the coach dashboard

### 3. **Beautiful Login Screens**
- Match your app's design and theme
- Smooth animations and modern UI
- Mobile-responsive

### 4. **Credentials Management**
- Easy-to-use interface for creating client credentials
- Password generator included
- One-click copy for sharing with clients

## 🚀 Setup (3 Simple Steps)

### Step 1: Set Environment Variables

Create a `.env` file in your project root:

```env
# Supabase (you probably already have these)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Coach Authentication (NEW)
VITE_COACH_USERNAME=coach
VITE_COACH_PASSWORD=YourSecurePassword123!
```

**Important**: Change the default password!

### Step 2: Run Database Migration

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run the file: `create_auth_tables.sql`

This creates the `client_credentials` table.

### Step 3: Restart Your App

```bash
npm run dev
```

## 🎉 You're Done!

### Testing Coach Access:
1. Navigate to your app URL
2. You'll see the coach login screen
3. Login with your credentials from `.env`
4. Click "Logout" button (top right) to test logout

### Setting Up Client Access:

1. **Create credentials** for your client:
   - In the clients list, click the "⋮" menu
   - Select "Manage Credentials"
   - Enter a username (auto-suggested)
   - Click "Generate" for a secure password
   - Click "Create Credentials"

2. **Share with client**:
   - Click "Copy Full Message for Client"
   - Send the message to your client
   - Also send them the share link (as before)

3. **Client access**:
   - Client clicks the share link
   - Sees a login screen
   - Enters credentials you provided
   - Accesses their program

## 📱 Features

### For Coach:
- ✅ Secure dashboard access
- ✅ Manage client credentials easily
- ✅ Generate strong passwords
- ✅ Copy credentials in one click
- ✅ Logout functionality

### For Clients:
- ✅ Simple login screen
- ✅ 24-hour sessions
- ✅ Auto-logout after expiry
- ✅ Mobile-friendly interface

## 🔒 Security Features

1. **Password Hashing**: Passwords are hashed before storage
2. **Session Management**: 24-hour session duration
3. **Secure Storage**: Credentials in database and environment
4. **Access Control**: Route-level protection
5. **Simple & Effective**: No complicated setup

## 📝 Default Credentials

**Coach Dashboard:**
- Username: `coach`
- Password: `coach123`

⚠️ **CHANGE THESE IMMEDIATELY IN YOUR `.env` FILE!**

## 💡 Tips

1. **Strong Passwords**: Use the password generator for client credentials
2. **Secure Communication**: Send credentials via secure channel (encrypted messaging)
3. **Regular Updates**: Change coach password periodically
4. **Track Access**: Check client's "last_login" in database

## 🆘 Troubleshooting

**Can't login as coach?**
- Check `.env` file exists
- Verify credentials are correct
- Restart dev server (`npm run dev`)

**Client can't login?**
- Verify credentials were created (check database)
- Username is case-sensitive
- Ensure `client_credentials` table exists

**Session expired?**
- Sessions last 24 hours
- User needs to login again

## 📂 Files Created/Modified

### New Files:
- `create_auth_tables.sql` - Database migration
- `src/lib/authService.ts` - Authentication service
- `src/components/CoachLogin.tsx` - Coach login screen
- `src/components/ClientLogin.tsx` - Client login screen
- `src/components/ClientCredentialsManager.tsx` - Credentials management
- `AUTHENTICATION_SETUP.md` - Detailed documentation

### Modified Files:
- `src/App.tsx` - Added authentication logic
- `src/components/UnbreakableSteamClientsManager.tsx` - Added credentials management & logout

## 🎯 Next Steps

1. **Setup Environment Variables** (.env file)
2. **Run Database Migration** (create_auth_tables.sql)
3. **Test Coach Login** (should work immediately)
4. **Create Client Credentials** (for your first client)
5. **Test Client Login** (share link + credentials)

## 🔐 Production Recommendations

For production use, consider:
- Using bcrypt for password hashing
- Adding password complexity requirements
- Implementing password reset functionality
- Setting up 2FA (Two-Factor Authentication)
- Adding login attempt limiting
- Enabling audit logs

---

**You're all set!** 🎉 Your coaching app now has basic security that's both simple to use and effective at protecting your dashboard and client data.

For detailed documentation, see `AUTHENTICATION_SETUP.md`


