# SQUAD. — Find Your Squad 🎮

A modern, real-time gaming matchmaking platform where players can find, create, and join game lobbies. Built with Next.js 16, Supabase, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Realtime-3ECF8E?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## ✨ Features

### 🏠 Core Features

- **Browse Rooms** — View live game lobbies with real-time player counts
- **Create Room** — Host your own room with customizable settings (mic required, max players, etc.)
- **Join Room** — Request to join or spectate existing lobbies
- **Voice Chat** — WebRTC-powered peer-to-peer voice communication in lobbies
- **Real-time Chat** — Instant messaging within room lobbies via Supabase Realtime

### 👤 User Features

- **Authentication** — Email/password sign-up and login with email verification
- **User Profiles** — Customizable profiles with avatar, bio, and cover image
- **Friend System** — Send/accept friend requests, view online friends
- **Notifications** — Real-time notifications for friend requests, game invites, and more
- **Pro Accounts** — Premium features with special badges and profile options

### 🌍 Multi-Language Support

- Full **English** and **Arabic** support
- RTL/LTR layout switching
- Font switching (Outfit for English, Cairo for Arabic)

### 🎮 Game Integration

- Search for games using the **RAWG API**
- Display game covers and metadata when creating rooms

---

## 🗂️ Project Structure

```
squad/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (auth, profiles, rawg)
│   │   ├── browse/             # Browse rooms page
│   │   ├── create-room/        # Create room page
│   │   ├── help/               # Help/FAQ page
│   │   ├── login/              # Login page
│   │   ├── notifications/      # Notifications page
│   │   ├── profile/[id]/       # Dynamic user profiles
│   │   ├── register/           # Registration page
│   │   ├── room/[id]/          # Dynamic room/lobby page
│   │   ├── settings/           # User settings page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── providers.tsx       # Theme, Auth, Language providers
│   │   └── globals.css         # Global styles
│   │
│   ├── components/             # Reusable UI components
│   │   ├── AuthPages.tsx       # Login/Register forms
│   │   ├── CreateRoom.tsx      # Room creation form
│   │   ├── FeaturedSection.tsx # Home hero section
│   │   ├── GameDetails.tsx     # Game info display
│   │   ├── GameRow.tsx         # Room cards grid
│   │   ├── Header.tsx          # App header with search & notifications
│   │   ├── ProfilePage.tsx     # User profile view
│   │   ├── RoomLobby.tsx       # Room lobby with chat & players
│   │   ├── SettingsPage.tsx    # User settings panel
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── layout/             # Layout components
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── LanguageContext.tsx # i18n and RTL support
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useFriendActions.ts # Friend request logic
│   │   ├── useRealtimeChat.ts  # Supabase Realtime chat
│   │   ├── useTranslate.ts     # Translation helper
│   │   └── useVoiceChat.ts     # WebRTC voice chat
│   │
│   ├── lib/                    # Utility functions
│   │   ├── cookies.ts          # Cookie helpers
│   │   ├── rawg.ts             # RAWG API integration
│   │   ├── security.ts         # Input sanitization
│   │   ├── supabase.ts         # Supabase client
│   │   ├── translations.ts     # EN/AR translation strings
│   │   ├── utils.ts            # General utilities
│   │   └── validation.ts       # Zod validation schemas
│   │
│   ├── middleware.ts           # Next.js middleware
│   └── types.ts                # TypeScript type definitions
│
├── public/                     # Static assets
├── supabase_migration.sql      # Database schema (profiles, rooms, room_members)
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
└── README.md                   # You are here!
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Supabase project

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/squad.git
cd squad
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RAWG_API_KEY=your-rawg-api-key
```

> **Note:** Do **not** wrap values in quotes. The correct format is `NEXT_PUBLIC_SUPABASE_URL=https://...` without extra punctuation.

### 4. Set Up Supabase Database

Run the SQL migration in your Supabase SQL Editor:

```bash
# See: supabase_migration.sql
```

This creates the following tables:

- `profiles` — User profile data
- `rooms` — Game room data
- `room_members` — Room membership with host/ready status

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Tech Stack

| Technology         | Purpose                         |
| ------------------ | ------------------------------- |
| **Next.js 16**     | React framework with App Router |
| **Supabase**       | Auth, Database, Realtime        |
| **Tailwind CSS 4** | Utility-first styling           |
| **Framer Motion**  | Animations and transitions      |
| **Zod**            | Schema validation               |
| **Sonner**         | Toast notifications             |
| **Lucide React**   | Icon library                    |
| **next-themes**    | Dark mode support               |
| **RAWG API**       | Game metadata and search        |
| **WebRTC**         | Peer-to-peer voice chat         |

---

## 🛠️ Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

---

## 🌐 Internationalization

The app supports **English (en)** and **Arabic (ar)** with full RTL layout support.

Language can be switched from the Settings page. The selected language persists in `localStorage`.

Translations are defined in `src/lib/translations.ts`.

---

## 🔐 Authentication Flow

1. Users sign up with email/password
2. Confirmation email is sent (Supabase Auth)
3. After verification, users can log in
4. Session is managed via Supabase Auth + cookies
5. Profile is auto-created on signup via database trigger

---

## 🎙️ Voice Chat

Voice chat uses WebRTC for peer-to-peer audio:

- Powered by `useVoiceChat.ts` hook
- Signaling is done via Supabase Realtime channels
- Users can mute/unmute their microphone in the lobby

---

## 📋 Database Schema

```sql
-- profiles: User profile data
-- rooms: Game lobby metadata
-- room_members: Many-to-many for room participants
```

See `supabase_migration.sql` for the full schema and RLS policies.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [RAWG](https://rawg.io) for the game database API
- [Lucide](https://lucide.dev) for the beautiful icons
- [Tailwind CSS](https://tailwindcss.com) for the styling framework

---

**Made with ❤️ for gamers, by gamers.**
