# QuizMaster - AI-Powered Quiz Generator with Telegram Mini App

Платформа для создания интерактивных викторин с AI-генерацией из текста и Telegram Mini App.

## 🎯 New Features

### 1. **AI-Generated Quizzes**
- Upload `.docx` or `.txt` files
- Paste text directly
- AI generates 3-15 questions automatically
- Preview and edit generated questions
- Powered by OpenRouter + Google Gemini

### 2. **Telegram Mini App**
- Standalone Telegram application
- **Login with Telegram ID** - no email required!
- Immediate access to create quizzes
- **Optional email binding** for cross-platform sync
- Native Telegram UI theme adaptation
- Create quizzes from within Telegram
- View your quizzes on all devices

### 3. **Account Linking**
- **Web → Telegram**: Link Telegram in Settings page
- **Telegram → Web**: Bind email in Telegram Settings
- Sync quizzes across platforms
- Single account for both platforms

---

## 📦 Project Structure

```
v_bot/
├── src/                          # Main web application
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── utils/
│   └── types/
├── telegram-app/                # Telegram Mini App
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── migrations/                   # Database migrations
│   └── add_telegram_auth.sql
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- OpenRouter API key
- Telegram Bot (optional, for Mini App)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd v_bot

# Install main app dependencies
npm install

# Install Telegram app dependencies
cd telegram-app
npm install
cd ..
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTER_API_KEY=your-openrouter-key
```

### 3. Setup Supabase Database

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Run `supabase-schema.sql` (main schema)
3. Run `migrations/add_telegram_auth.sql` (Telegram auth support)

### 4. Run Development Servers

```bash
# Main web app (port 5173)
npm run dev

# Telegram app (port 5174) - in another terminal
cd telegram-app
npm run dev
```

---

## 📱 Telegram Mini App Setup

### 1. Create Telegram Bot

1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow instructions
3. Save the bot token

### 2. Configure Web App

1. Send `/newapp` to @BotFather
2. Enter bot name: `QuizMaster`
3. Enter web app URL: `https://your-domain.vercel.app/telegram/`
4. Save the web app URL

### 3. Test Mini App

- Open Telegram
- Find your bot
- Click on Menu button → Open App
- The Mini App should load

---

## 🌐 Deployment to Vercel

### Option 1: Separate Deployments (Recommended)

#### Main Web App

```bash
vercel --prod
```

#### Telegram Mini App

```bash
cd telegram-app
vercel --prod
```

Set environment variables in Vercel dashboard for both projects.

### Option 2: Monorepo Deployment

Create `vercel.json` in root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    },
    {
      "src": "telegram-app/package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    { "src": "/telegram/(.*)", "dest": "/telegram-app/$1" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

---

## 🔑 Getting API Keys

### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → API
4. Copy `URL` and `anon public` key

### OpenRouter

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up
3. Go to [Keys](https://openrouter.ai/keys)
4. Create a new key

### Telegram Bot

1. Open Telegram
2. Search @BotFather
3. Send `/newbot`
4. Follow instructions

---

## 📊 Database Schema

### Tables

- **quizzes** - Quiz metadata
- **questions** - Quiz questions
- **answers** - Answer options
- **quiz_sessions** - User attempts
- **session_answers** - User responses
- **telegram_auth_links** - Telegram-Web account linking

### Migrations

Run these in Supabase SQL Editor:
1. `supabase-schema.sql` - Core schema
2. `migrations/add_telegram_auth.sql` - Telegram auth support

---

## 🎨 Features Overview

### Web Application

- ✅ Create quizzes manually
- ✅ Generate quizzes from text/files with AI
- ✅ Public and private quizzes
- ✅ Anonymous participation
- ✅ QR code sharing
- ✅ Detailed statistics
- ✅ Google/Email authentication
- ✅ **Link Telegram account** in Settings

### Telegram Mini App

- ✅ **Login with Telegram ID** (no email required!)
- ✅ Create quizzes immediately after login
- ✅ **Optional email binding** for cross-platform sync
- ✅ Create quizzes manually
- ✅ Generate quizzes from text with AI
- ✅ View your quizzes
- ✅ Native Telegram UI integration
- ✅ Settings page with account management

---

## 🛠 Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 7
- Material UI + Tailwind CSS
- React Router 7

### Backend
- Supabase (PostgreSQL + Auth + Realtime)

### AI
- OpenRouter API
- Google Gemini 3.1 Flash Lite

### Deployment
- Vercel

---

## 📝 Usage Examples

### Creating Quiz from Text

1. Go to Dashboard
2. Click "Create from text"
3. Paste your text or upload `.docx`/`.txt` file
4. Select number of questions (3-15)
5. Click "Generate"
6. Review and edit generated questions
7. Add title and save

### Using Telegram Mini App

1. Open Telegram
2. Find your bot
3. Open Mini App
4. **Automatic login with Telegram ID**
5. Start creating quizzes immediately!
6. (Optional) Go to Settings → Bind email for web access

### Linking Accounts

**Option 1: From Web to Telegram**
1. Login to web version
2. Go to Settings (⚙️ icon)
3. Click "Bind Telegram"
4. Enter your Telegram username
5. Open Telegram bot and send `/link`
6. Accounts linked!

**Option 2: From Telegram to Web**
1. Login to Telegram Mini App
2. Click Settings icon (⚙️)
3. Click "Bind email"
4. Enter email and password
5. Now login to web with same email
6. See same quizzes on both platforms!

---

## 🔧 Troubleshooting

### "OpenRouter API key not configured"
- Add `VITE_OPENROUTER_API_KEY` to `.env`
- Restart dev server

### "Telegram user not found"
- Make sure you're opening from Telegram
- Check if `telegram-web-app.js` is loaded

### "Failed to generate quiz"
- Check text length (minimum 100 characters)
- Verify OpenRouter API key
- Check API quota

---

## 📄 License

MIT License - freely use for personal or commercial purposes.

---

## 🤝 Contributing

Contributions welcome! Feel free to submit issues or pull requests.

---

## 📞 Support

For issues or questions, please open a GitHub issue.
