# Creator Ecosystem Platform

A comprehensive creator management platform with reputation tracking, governance, and campaign matching. Designed for creator ecosystems with structured approval processes, performance-based badges, and community-driven rankings.

## Features

### 🎯 Dashboard
- **Ecosystem Metrics**: Overview of approved creators, active campaigns, and engagement statistics
- **Pending Approvals**: Review and manage creator applications with quick access links
- **Campaign Matching Queue**: See campaigns needing creator matches at a glance
- **Training Progress**: Monitor creator training completion rates and onboarding status
- **Recent Activity Feed**: Track all ecosystem engagements with status and match scores
- **Top Creators Showcase**: Highlighted high-performing creators on the main dashboard

### 👥 Creator Discovery
- **Advanced Search & Filtering**: Find creators by name, niche, platform, and reputation score
- **Badge System**: Visual reputation badges (Bronze 1-3, Silver 1-2, Gold, Top Performer)
- **Reputation Score**: Creators sorted by overall reputation for better visibility
- **Creator Cards Display**:
  - Reputation score and content quality rating
  - Badge/rank achievements
  - Approval rate and completed engagements count
  - Engagement rate and platform presence
- **Creator Detail Pages**: Comprehensive profiles with:
  - Reputation score and badge display
  - Content quality metrics with star ratings
  - Performance review history with detailed evaluations
  - Campaign engagement timeline
  - Training and certification progress

### 📊 Campaign Management
- **Create Campaigns**: Multi-step form to create new campaigns with:
  - Campaign title and description
  - Budget allocation
  - Target niches and platforms
  - Minimum follower requirements
  - Start and end dates
- **Campaign Details**: View comprehensive campaign information including:
  - Budget and duration
  - Target demographics
  - Performance metrics (impressions, clicks, conversions)
  - Confirmed and suggested creator matches
  - Match scoring system

### 🏆 Creator Reputation & Progression System
- **Badge Tiers**: Creators earn badges through performance:
  - **Bronze 1-3**: Emerging creators (1+ completed engagements)
  - **Silver 1-2**: Established creators (2-4 completed engagements)
  - **Gold**: High performers (4+ completed engagements, 85+ reputation score)
  - **Top Performer**: Elite creators (5+ completed engagements, 90+ reputation score)
- **Reputation Score**: Calculated from:
  - Number of completed engagements
  - Content quality ratings (1-5 scale)
  - Approval rates from campaign managers
  - Training completion status
  - Performance evaluations
- **Creator Evaluations**: Post-campaign feedback system with:
  - Content quality assessment
  - Communication rating
  - Deadline completion tracking
  - Professionalism scoring
  - Campaign fit rating
  - Admin notes and feedback

### 🏅 Creator Leaderboard
- **Top Creators Ranking**: Ranked by reputation score with tier badges
- **Top Rising**: Newest creators gaining traction in the ecosystem
- **Recently Verified**: Latest verified creators
- **Achievement Cards**: 
  - Highest engagement rate creators
  - Best content quality performers
  - Most experienced (completed engagements)

### 🤖 Smart Matching Engine
- **Creator Visibility**: Better creators appear higher in discovery based on reputation
- **Match Quality**: Higher reputation creators get priority in matches
- **Automated Matching**: Algorithm scores creators based on:
  - Niche alignment
  - Platform compatibility
  - Reputation and badges
  - Content quality
  - Historical performance

### 📈 Analytics Dashboard
- **Performance Trends**: Line charts showing impressions, clicks, and conversions over time
- **Niche Distribution**: Pie chart showing creator distribution across niches
- **Platform Analytics**: Bar charts showing creator distribution across platforms
- **Match Status Breakdown**: Visual breakdown of all match statuses with percentages
- **Top Level Metrics**: Total impressions, conversions, active campaigns, and average engagement rate

### 📝 Creator Onboarding
- **5-Step Onboarding Form**:
  1. Basic Information (name, bio)
  2. Niche Selection
  3. Platform Selection
  4. Platform Details (handle, followers)
  5. Engagement Rate & Media Kit
- **Progress Tracking**: Visual progress bar showing onboarding completion
- **Form Validation**: Step-by-step validation to ensure data completeness

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with AppProvider
│   ├── page.tsx                # Dashboard page
│   ├── globals.css             # Global styles with dark theme
│   ├── creators/
│   │   ├── page.tsx            # Creator discovery page
│   │   └── [id]/
│   │       └── page.tsx        # Creator detail page
│   ├── campaigns/
│   │   ├── page.tsx            # Campaign management page
│   │   └── [id]/
│   │       └── page.tsx        # Campaign detail page
│   ├── analytics/
│   │   └── page.tsx            # Analytics dashboard page
│   └── onboarding/
│       └── page.tsx            # Creator onboarding form
├── components/
│   └── sidebar.tsx             # Navigation sidebar
├── lib/
│   ├── mock-data.ts            # Mock data for creators, campaigns, and matches
│   ├── app-context.tsx         # Global state management context
│   └── utils.ts                # Utility functions (cn for class merging)
└── public/                      # Static assets
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for UI icons
- **Utilities**: UUID for unique ID generation

## Color Palette

The platform uses a modern dark theme with these colors:
- **Background**: `#0f1419` (Deep Dark)
- **Card**: `#1a1f2e` (Card Dark)
- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#22d3ee` (Cyan)
- **Accent**: `#6366f1` (Indigo)
- **Text**: `#f5f5f5` (Off White)

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run the development server**:
   ```bash
   pnpm dev
   ```

3. **Open in browser**:
   Navigate to `http://localhost:3000`

## Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview and recent campaigns |
| Discover Creators | `/creators` | Search and filter creators |
| Creator Profile | `/creators/[id]` | Detailed creator information |
| Campaigns | `/campaigns` | Create and manage campaigns |
| Campaign Details | `/campaigns/[id]` | Campaign performance and matches |
| Analytics | `/analytics` | Performance metrics and charts |
| Onboarding | `/onboarding` | Creator registration form |

## Data Models

### Creator
```typescript
{
  id: string;
  name: string;
  bio: string;
  niche: string;
  platforms: {
    name: 'TikTok' | 'Instagram' | 'YouTube' | 'Twitter' | 'Twitch';
    followers: number;
    handle: string;
  }[];
  engagementRate: number;
  verified: boolean;
  avatar?: string;
  mediaKit?: string;
}
```

### Campaign
```typescript
{
  id: string;
  title: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetNiches: string[];
  targetPlatforms: string[];
  minFollowers: number;
  status: 'draft' | 'active' | 'completed';
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
}
```

### CreatorCampaignMatch
```typescript
{
  id: string;
  creatorId: string;
  campaignId: string;
  matchScore: number;
  status: 'suggested' | 'interested' | 'confirmed' | 'rejected';
  createdAt: string;
}
```

## State Management

The app uses React Context API with the `AppProvider` component that manages:
- **creators**: Array of creator objects
- **campaigns**: Array of campaign objects
- **matches**: Array of creator-campaign matches
- **Methods**: addCreator, addCampaign, updateCampaign, getCreatorById, getCampaignById, getMatchesForCampaign, matchCreatorsToCampaign

The matching algorithm automatically creates matches when a new campaign is created, scoring each creator based on their compatibility.

## Customization Guide

### Adding New Niches
Edit `lib/mock-data.ts` and the niche arrays in:
- `onboarding/page.tsx`
- `campaigns/page.tsx`

### Modifying the Theme
Update the CSS variables in `app/globals.css`:
- Light theme variables in `:root`
- Dark theme variables in `.dark`

### Extending Platforms
Add new platforms to the `PLATFORMS` constant in `app/onboarding/page.tsx` and update mock data accordingly.

### Adding New Features
1. Create API routes in `app/api/` if needed
2. Add new pages in the appropriate `app/` directory
3. Update the sidebar navigation in `components/sidebar.tsx`
4. Add new state management to `lib/app-context.tsx` if needed

## Future Enhancements

- Database integration (Supabase/PostgreSQL)
- User authentication and authorization
- Real-time campaign performance updates
- Creator tier/rating system
- Contract management workflow
- Payment integration for campaign budgets
- Email notifications
- Advanced analytics and ROI tracking
- Creator availability calendar
- Proposal/counter-proposal system

## License

This project is built with v0 and is available for personal and commercial use.
