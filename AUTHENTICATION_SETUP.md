# Authentication Setup Guide

This application now includes basic authentication to protect both the coach dashboard and client access links.

## 🔐 Security Features

1. **Coach Dashboard Protection**: Only accessible with coach credentials
2. **Client Link Protection**: Clients need username/password to access their programs
3. **Session Management**: 24-hour session duration with automatic logout
4. **Simple & Secure**: No complicated setup, just environment variables and database

## 📋 Setup Instructions

### Step 1: Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Coach Authentication
VITE_COACH_USERNAME=coach
VITE_COACH_PASSWORD=YourSecurePassword123!

# IMPORTANT: Change the default password for production!
```

### Step 2: Run Database Migration

Execute the SQL script `create_auth_tables.sql` in your Supabase SQL Editor:

```sql
-- This creates the client_credentials table
-- Run this in Supabase Dashboard > SQL Editor
```

The script creates:
- `client_credentials` table for storing client login info
- Necessary indexes for performance
- Row Level Security (RLS) policies
- Auto-update triggers

### Step 3: Default Coach Credentials

**Default Login:**
- Username: `coach`
- Password: `coach123`

⚠️ **IMPORTANT**: Change these credentials immediately by updating your `.env` file!

## 🎯 How to Use

### For Coaches:

1. **Login to Dashboard**
   - Navigate to your app URL
   - You'll see the coach login screen
   - Enter your credentials from `.env` file

2. **Create Client Credentials**
   - Open a client's details in the dashboard
   - Click "Manage Credentials" or similar button (to be added to UI)
   - Set username and password for the client
   - Copy the credentials message and send it to your client

3. **Share Program with Client**
   - Generate the share link as usual
   - Send the share link along with the credentials
   - Client will need both to access their program

### For Clients:

1. **Access Your Program**
   - Click the link provided by your coach
   - You'll see a login screen
   - Enter the username and password your coach provided
   - Access your training program

## 🔒 Security Best Practices

1. **Strong Passwords**
   - Use complex passwords for coach account
   - Generate strong passwords for client accounts
   - Don't reuse passwords

2. **Secure Communication**
   - Send credentials separately from the share link (e.g., link via email, password via SMS)
   - Or use secure messaging apps

3. **Regular Updates**
   - Change coach password regularly
   - Update client passwords if compromised

4. **Session Management**
   - Sessions expire after 24 hours
   - Users need to login again after expiration
   - Logout option available in the UI

## 🛠️ Technical Details

### Password Storage
- Passwords are hashed before storage (basic implementation)
- For production, consider upgrading to bcrypt or Argon2
- Never store plain text passwords

### Authentication Flow
1. User submits credentials
2. System validates against database (clients) or env vars (coach)
3. Session token stored in localStorage
4. Token expires after 24 hours
5. Protected routes check authentication status

### Database Schema

```sql
client_credentials (
  id: UUID (primary key)
  client_id: UUID (foreign key to clients)
  username: TEXT (unique)
  password_hash: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  last_login: TIMESTAMP
  is_active: BOOLEAN
)
```

## 🚀 Deployment Checklist

- [ ] Update `.env` with strong coach password
- [ ] Run `create_auth_tables.sql` in Supabase
- [ ] Test coach login
- [ ] Create credentials for test client
- [ ] Test client login with share link
- [ ] Verify sessions expire correctly
- [ ] Enable HTTPS in production
- [ ] Set up proper backup procedures

## 🆘 Troubleshooting

**Problem**: Can't login as coach
- Solution: Check `.env` file exists and has correct credentials
- Solution: Restart development server after changing `.env`

**Problem**: Client can't login
- Solution: Verify credentials were created in the database
- Solution: Check username spelling (case-sensitive)
- Solution: Ensure client_credentials table exists

**Problem**: Session keeps expiring
- Solution: Check browser localStorage is enabled
- Solution: Verify system time is correct

## 📝 Future Enhancements

Consider these improvements for production:
- Password reset functionality
- Two-factor authentication
- OAuth integration
- Password complexity requirements
- Login attempt limiting
- Audit logs for access attempts
- Email notifications for new logins

## 🔄 Migration from Unsecured Version

If you're upgrading from an unsecured version:

1. All existing client links will require authentication
2. Create credentials for all active clients
3. Notify all clients about the change
4. Provide them with their new credentials
5. Set a reasonable deadline for the transition

## 📞 Support

For issues or questions:
1. Check this guide thoroughly
2. Review the SQL setup script
3. Check browser console for errors
4. Verify Supabase connection

---

**Remember**: Security is a continuous process. Regularly review and update your security measures.


