# The& Way - Complete Setup Guide

## What Has Been Updated

### ✅ Brand Identity
- **Application renamed** from "Trivia Titans" to "The& Way"
- **e& Egypt colors** applied throughout:
  - Primary Red: #E00800
  - Ocean Blue: #18114B
  - Bright Green: #47CB6C
  - Supporting colors: Burgundy, Dark Green, Mauve, etc.

### ✅ User Interface
- **Login page** - Fully rebranded with e& colors and The& Way branding
- **Signup page** - Updated with e& Egypt design
- **Language switcher** - Toggle between English and Arabic
- **Arabic support** - Full RTL layout with Cairo and Tajawal fonts

### ✅ Theme System
Replaced generic themes with e& values:
- Innovation (الابتكار)
- Excellence (التميز)
- Integrity (النزاهة)
- Customer Focus (التركيز على العميل)
- Collaboration (التعاون)
- Empowerment (التمكين)

### ✅ Technical Updates
- Package name changed to "the-and-way"
- Default colors updated (Team 1: e& Red, Team 2: e& Bright Green)
- Meta tags and SEO updated for The& Way
- All default theme references changed from 'highland' to 'innovation'

---

## Database Setup

### Step 1: Apply Database Schema

You have two options:

#### Option A: Use the provided SQL script (Quick)
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file `database-setup.sql` (in project root)
4. Copy and paste the entire content
5. Click **Run**

#### Option B: Apply migrations (Recommended for production)
```bash
supabase db push
```

### Step 2: Create Admin User

After the database schema is set up:

1. **Create Auth User:**
   - Go to Supabase Dashboard > **Authentication** > **Users**
   - Click **"Add User"**
   - Enter:
     - Email: `Sarah.Yasser@eand.com.eg`
     - Password: `The&way`
     - Auto Confirm User: **Yes**
   - Click **Save** and **copy the User ID**

2. **Create Admin Profile:**
   - Go to **SQL Editor**
   - Run this query (replace `USER_ID_HERE` with the copied User ID):

```sql
INSERT INTO admins (auth_id, email, organization_name, is_super_admin, is_approved, approved_at)
VALUES (
  'USER_ID_HERE'::uuid,
  'Sarah.Yasser@eand.com.eg',
  'e& Egypt',
  true,
  true,
  now()
);
```

---

## Testing the Application

### 1. Login
- Go to `/login`
- You should see:
  - **The& Way** title in e& Red
  - e& gradient background (Ocean Blue → Dark Green → Red)
  - Language switcher in top-right
  - e& Egypt tagline at bottom

### 2. Test Language Switching
- Click the language switcher
- Interface should switch to Arabic with RTL layout
- Click again to switch back to English

### 3. Test Admin Login
- Email: `Sarah.Yasser@eand.com.eg`
- Password: `The&way`
- Should redirect to Dashboard

---

## Features Overview

### For Admins
1. **Dashboard** - Create and manage values sessions
2. **Session Builder** - Configure questions, teams, themes
3. **Live Session** - Monitor game in real-time
4. **Results** - View analytics and player performance

### For Players
1. **Join Page** - Enter PIN to join session
2. **Team Selection** - Choose between two teams
3. **Game Play** - Answer questions and claim values zones
4. **Results** - View final scores and stats

### Language Support
- **English** - Full interface translation
- **Arabic (العربية)** - Complete RTL support with proper fonts

### Themes (e& Values)
Each theme represents an e& Egypt core value:
- **Innovation** - Green theme emphasizing forward-thinking
- **Excellence** - Red/Blue theme for quality and standards
- **Integrity** - Dark Blue theme for trust and ethics
- **Customer Focus** - Mauve theme for customer-centricity
- **Collaboration** - Green/Blue theme for teamwork
- **Empowerment** - Red/Green theme for growth and leadership

---

## Environment Variables

Make sure your `.env` file has these Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Troubleshooting

### Login page still shows old colors
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Try incognito/private browsing mode

### Can't create admin user
1. Verify database schema is applied
2. Check that auth user was created successfully
3. Ensure User ID is correct in the INSERT query

### Arabic text not displaying correctly
1. Verify fonts are loaded (Cairo, Tajawal)
2. Check browser language settings
3. Try the language switcher

### Database migrations not applying
1. Check Supabase connection in `.env`
2. Verify database permissions
3. Try applying `database-setup.sql` manually

---

## Next Steps

1. ✅ Apply database schema
2. ✅ Create admin user
3. ✅ Test login with Sarah's credentials
4. ✅ Create your first values session
5. ✅ Test with players
6. ✅ Customize branding text and logos as needed

---

## Support

For issues or questions about The& Way platform:
- Check the setup guide above
- Review the troubleshooting section
- Contact your development team

---

**Built for e& Egypt** | Living Our Values, Empowering Our Future
