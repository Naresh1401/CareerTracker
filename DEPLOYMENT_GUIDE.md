# CareerTrack — Complete Deployment Guide
## From zero to live URL in ~20 minutes · 100% Free

---

## What you'll build
A full career tracking web app with:
- Email + password auth (anyone can sign up)
- Job application tracker table
- Resume version tracker with performance stats
- Learning roadmap
- Mock interview question bank with practice mode
- Weekly timetable with Google Calendar export (.ics)
- Personalized suggestions
- Job probability score

**Stack (all free tiers):**
| Service | What it does | Free limit |
|---------|-------------|------------|
| [Supabase](https://supabase.com) | Database + Auth | 500MB DB, 50k users/month |
| [Vercel](https://vercel.com) | Hosting | Unlimited deployments |
| [GitHub](https://github.com) | Code storage | Unlimited public repos |

---

## Prerequisites
Install these before starting:
1. **Node.js** — download from https://nodejs.org (choose LTS version)
2. **VS Code** — download from https://code.visualstudio.com
3. **Git** — download from https://git-scm.com

Verify installs by opening a terminal and running:
```
node --version    # should show v18+ 
git --version     # should show a version number
```

---

## Step 1 — Set up Supabase (database + auth)

### 1.1 Create a free Supabase account
1. Go to https://supabase.com and click **Start your project**
2. Sign in with GitHub (easiest) or create an account
3. Click **New project**
4. Fill in:
   - **Name:** `career-tracker`
   - **Database password:** create a strong password (save it somewhere)
   - **Region:** pick the closest to you
5. Click **Create new project** — wait ~2 minutes for it to set up

### 1.2 Run the database schema
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase-schema.sql` from this project
4. Copy ALL the contents and paste them into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned" — that means it worked!

### 1.3 Enable email confirmations (optional but recommended)
1. Go to **Authentication → Providers** in the left sidebar
2. Email provider should already be enabled
3. For development/testing: go to **Authentication → Settings** and turn OFF "Enable email confirmations" so you can test without checking email
4. For production: leave it ON so real users confirm their email

### 1.4 Get your API keys
1. Click **Settings** (gear icon) in the left sidebar
2. Click **API**
3. You'll see two values — copy both:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

---

## Step 2 — Set up the project in VS Code

### 2.1 Open the project folder
1. Open VS Code
2. Go to **File → Open Folder**
3. Select the `career-tracker` folder you downloaded/extracted
4. VS Code will open the project

### 2.2 Open the integrated terminal
- Press `` Ctrl+` `` (backtick) OR go to **Terminal → New Terminal**

### 2.3 Create your environment file
In the terminal, run:
```bash
cp .env.example .env
```

Then open the `.env` file in VS Code and replace the placeholder values:
```
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJyour_actual_anon_key_here
```

**Important:** Use the exact values from Step 1.4. No spaces, no quotes.

### 2.4 Install dependencies
In the terminal:
```bash
npm install
```
This will take 1–2 minutes and install all the packages.

### 2.5 Run the app locally
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 500ms
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser. The app should be running!

**Test it:**
1. Click "Create account" and sign up with any email
2. Complete the onboarding form
3. You should land on the dashboard with sample data

---

## Step 3 — Push to GitHub

### 3.1 Create a GitHub account
If you don't have one, go to https://github.com and sign up (free).

### 3.2 Create a new repository
1. Go to https://github.com/new
2. Name it `career-tracker`
3. Set it to **Public** (required for free Vercel deployment) or Private
4. **Don't** initialize with README (we already have the code)
5. Click **Create repository**

### 3.3 Push your code
In the VS Code terminal, run these commands one by one:
```bash
git init
git add .
git commit -m "Initial commit — CareerTrack app"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/career-tracker.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

You'll be asked for your GitHub credentials. Use your username and a [Personal Access Token](https://github.com/settings/tokens) (not your password).

---

## Step 4 — Deploy to Vercel (free hosting)

### 4.1 Create a Vercel account
1. Go to https://vercel.com
2. Click **Sign Up** → **Continue with GitHub** (easiest)
3. Authorize Vercel to access your GitHub

### 4.2 Import your project
1. On the Vercel dashboard, click **Add New → Project**
2. Find your `career-tracker` repository and click **Import**
3. Vercel will auto-detect it as a Vite project

### 4.3 Add environment variables ← CRITICAL STEP
Before clicking Deploy, click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

**These must match exactly what's in your `.env` file.**

### 4.4 Deploy
Click **Deploy**. Vercel will:
1. Clone your code from GitHub (~10 seconds)
2. Run `npm run build` (~30 seconds)
3. Deploy to a live URL (~10 seconds)

After ~1 minute you'll get a URL like:
```
https://career-tracker-username.vercel.app
```

**That's your live app! Share it with anyone.**

---

## Step 5 — Add a custom domain (optional, free)

### Option A: Use Vercel's free subdomain
Your app is already at `https://career-tracker-YOUR-NAME.vercel.app` — nothing to do!

### Option B: Use your own domain
1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Vercel: go to your project → **Settings → Domains**
3. Add your domain and follow the DNS instructions
4. SSL certificate is automatically set up

---

## Step 6 — Making updates

Whenever you make changes to the code:

```bash
# In VS Code terminal:
git add .
git commit -m "Describe your change"
git push
```

Vercel will **automatically redeploy** within 1 minute. No manual steps needed.

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check that your `.env` file exists (not `.env.example`)
- Make sure there are no spaces around the `=` sign
- Restart the dev server: Ctrl+C, then `npm run dev` again

### "Failed to fetch" errors in the app
- Check your Supabase URL is correct (no trailing slash)
- Make sure you ran the SQL schema (Step 1.2)
- Check the browser console (F12) for specific error messages

### Blank page after deploy to Vercel
- Go to Vercel project → **Settings → Environment Variables**
- Make sure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Redeploy: Vercel project → **Deployments → ⋮ → Redeploy**

### "Row level security policy violation"
- Go back to Supabase SQL editor and re-run the schema SQL
- This error means the RLS policies weren't created properly

### Users can't sign up
- Go to Supabase → **Authentication → Settings**
- Make sure "Disable signup" is OFF
- If testing, turn OFF email confirmations temporarily

---

## Architecture overview

```
User's browser
     │
     ▼
Vercel CDN (free hosting)
     │  serves static React files
     ▼
React App (runs in browser)
     │  makes API calls
     ▼
Supabase (free backend)
  ├── Auth (email/password)
  └── PostgreSQL Database
        ├── profiles
        ├── applications
        ├── resume_versions
        ├── roadmap
        └── questions
```

All data is private per user — Row Level Security ensures users can only see their own data.

---

## Extending the app

Here are ideas to add later:

- **AI suggestions**: Use the Anthropic API (claude-sonnet-4-6) to generate personalized job advice based on the user's data
- **Email reminders**: Supabase Edge Functions + Resend.com (free tier) to send weekly progress emails
- **File uploads**: Supabase Storage to let users upload actual resume PDFs
- **Interview scheduling**: Add a calendar integration via Google Calendar API
- **Analytics dashboard**: Add recharts graphs for application trends over time

---

## Security notes

- The `.env` file is in `.gitignore` — your keys are never pushed to GitHub ✓
- Supabase Row Level Security ensures users can only access their own data ✓
- Vercel environment variables are encrypted at rest ✓
- Never share your `service_role` key (only `anon` key is used here) ✓

---

*Built with React + Vite + Supabase + Vercel. All free tiers. No credit card required.*
