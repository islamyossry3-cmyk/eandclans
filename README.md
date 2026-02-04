# Trivia Titans

A modern, interactive trivia game platform with team battles and individual challenges.

## Features

- **Team Battle Mode**: Players join teams and compete to claim territories on a hexagonal map
- **Individual Challenge Mode**: Solo gameplay with personal leaderboards
- **Real-time Gameplay**: Live updates and synchronization across all players
- **Customizable Sessions**: Create custom questions, teams, and game settings
- **Multiple Themes**: Choose from different visual themes (Ocean, Treasure Map, Over Cloud, City)
- **Asset Management**: Upload and manage custom icons, backgrounds, and images
- **Analytics Dashboard**: Track player performance and export results

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from the project settings
3. Run the database migrations in the `supabase/migrations` folder
4. Enable Row Level Security (RLS) on all tables
5. Set up authentication with email/password (disable email confirmation for development)

### 3. Installation

```bash
npm install
npm run dev
```

### 4. Deployment

The application is configured for deployment on Bolt Hosting. Make sure to:

1. Set the environment variables in your deployment platform
2. Ensure your Supabase project allows requests from your deployed domain
3. Configure CORS settings in Supabase if needed

## Usage

### For Administrators

1. Sign up for an admin account
2. Create a new session with questions and team settings
3. Launch the session to get a PIN and QR code
4. Share the PIN/QR code with players
5. Monitor the game progress and view results

### For Players

1. Visit the join page and enter the session PIN
2. Choose your team (for team battles) or register (for individual games)
3. Answer questions to claim territories or earn points
4. View your results and compare with other players

## Game Modes

### Team Battle
- Players join one of two teams
- Answer questions correctly to claim hexagonal territories
- Team with the most territories wins
- Real-time territory map visualization

### Individual Challenge
- Solo gameplay against AI opponent
- Customizable registration forms
- Personal photo capture for results
- Individual leaderboards and statistics

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Bolt Hosting
- **State Management**: Zustand
- **Real-time**: Supabase Realtime subscriptions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.