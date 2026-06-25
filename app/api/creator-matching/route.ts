import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CreatorSnapshot = {
  id: string;
  name: string;
  bio?: string;
  niche?: string;
  categories?: string[];
  platforms?: {
    name: string;
    followers: number;
    handle?: string;
  }[];
  engagementRate?: number;
  verified?: boolean;
  rank?: string;
  reputationScore?: number;
  contentQualityScore?: number;
  completedEngagements?: number;
};

type MatchRequest = {
  prompt?: string;
  creators?: CreatorSnapshot[];
};

type MatchResult = {
  creatorId: string;
  score: number;
  reasons: string[];
};

type AiResponse = {
  matches: MatchResult[];
  noMatchMessage?: string;
};

const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.replace(/^Bearer\s+/i, '');
  if (!accessToken) {
    return NextResponse.json({ error: 'Missing authentication token.' }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }

  const metadataRole = typeof userData.user.user_metadata?.role === 'string' ? userData.user.user_metadata.role : '';
  const { data: platformUser } = await authClient
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  const storedRole = typeof platformUser?.role === 'string' ? platformUser.role : '';
  const role = metadataRole || storedRole;
  if (role !== 'brand' && role !== 'admin') {
    return NextResponse.json({ error: 'Only brand users can match creators.' }, { status: 403 });
  }

  const body = await request.json() as MatchRequest;
  const prompt = body.prompt?.trim() ?? '';
  const creators = (body.creators ?? []).slice(0, 80);

  if (!prompt) {
    return NextResponse.json({ error: 'Describe what kind of creators the brand needs.' }, { status: 400 });
  }
  if (creators.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const ranked = rankCreators(prompt, creators).slice(0, 8);
  const aiResult = openAiApiKey ? await explainWithOpenAI(prompt, creators, ranked).catch((error) => {
    console.error('AI creator matching failed', error);
    return null;
  }) : null;

  if (aiResult?.noMatchMessage) {
    return NextResponse.json({ matches: [], noMatchMessage: aiResult.noMatchMessage, source: 'ai' });
  }

  return NextResponse.json({
    matches: aiResult?.matches?.length ? mergeAiReasons(ranked, aiResult.matches) : ranked,
    source: aiResult?.matches?.length ? 'ai' : 'rules',
  });
}

function rankCreators(prompt: string, creators: CreatorSnapshot[]): MatchResult[] {
  const rawTerms = tokenize(prompt);
  const { nicheTerms } = expandTerms(rawTerms);
  const hasNicheTerms = nicheTerms.size > 0;
  const requestedPlatforms = findRequestedPlatforms(prompt);
  const requestedFollowerMinimum = findFollowerMinimum(prompt);
  const requestedEngagementMinimum = findEngagementMinimum(prompt);

  return creators
    .map(creator => {
      // Only tokenize the creator's own niche-defining fields, not generic bio text
      const creatorNicheText = tokenize([
        creator.niche,
        ...(creator.categories ?? []),
      ].filter(Boolean).join(' '));
      // Also check bio/name but with lower weight — kept separate
      const creatorFullText = tokenize([
        creator.name,
        creator.bio,
        creator.niche,
        ...(creator.categories ?? []),
        ...(creator.platforms ?? []).flatMap(platform => [platform.name, platform.handle]),
      ].filter(Boolean).join(' '));

      // Only count hits from niche-mapped terms (not generic words like "field", "see")
      const nicheHits = hasNicheTerms
        ? Array.from(nicheTerms).filter(term => creatorNicheText.has(term))
        : [];
      const fullHits = hasNicheTerms
        ? Array.from(nicheTerms).filter(term => creatorFullText.has(term))
        : [];

      const totalFollowers = totalCreatorFollowers(creator);
      const platformMatch = requestedPlatforms.length === 0 || requestedPlatforms.some(platform =>
        creator.platforms?.some(item => item.name.toLowerCase() === platform),
      );
      const followerFit = !requestedFollowerMinimum || totalFollowers >= requestedFollowerMinimum;
      const engagementFit = !requestedEngagementMinimum || Number(creator.engagementRate ?? 0) >= requestedEngagementMinimum;

      let score = 20;
      if (hasNicheTerms) {
        // Primary niche/category match scores much higher than bio match
        score += Math.min(45, nicheHits.length * 18);
        // Bio/name mention adds a smaller bonus if niche didn't already match
        if (nicheHits.length === 0) {
          score += Math.min(10, fullHits.length * 5);
        }
        // Heavy penalty for zero niche hits — this creator is not relevant
        if (nicheHits.length === 0 && fullHits.length === 0) {
          score -= 20;
        }
      }
      score += platformMatch ? 12 : -6;
      score += followerFit ? 8 : -4;
      score += engagementFit ? 6 : -3;
      score += Math.min(8, Math.round(Number(creator.reputationScore ?? 0) / 10));
      score += creator.verified ? 4 : 0;
      score += Math.min(4, Math.round(Number(creator.contentQualityScore ?? 0)));
      score = Math.max(1, Math.min(98, score));

      return {
        creatorId: creator.id,
        score,
        reasons: buildRuleReasons({
          creator,
          textHits: nicheHits.length > 0 ? nicheHits : fullHits,
          platformMatch,
          followerFit,
          engagementFit,
          requestedPlatforms,
          requestedFollowerMinimum,
          requestedEngagementMinimum,
        }),
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function explainWithOpenAI(prompt: string, creators: CreatorSnapshot[], ranked: MatchResult[]): Promise<AiResponse> {
  const shortlisted = ranked.map(match => {
    const creator = creators.find(item => item.id === match.creatorId);
    return {
      id: match.creatorId,
      name: creator?.name,
      niche: creator?.niche,
      categories: creator?.categories,
      platforms: creator?.platforms,
      engagementRate: creator?.engagementRate,
      verified: creator?.verified,
      rank: creator?.rank,
      reputationScore: creator?.reputationScore,
      baseScore: match.score,
    };
  });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openAiModel,
      input: [
        {
          role: 'system',
          content: `You are a creator-matching AI for an influencer platform. Your job is to match brands with the most relevant creators based on the user's search intent.

When a user describes the type of creator they want, follow these rules:

1. Extract the core domain/field from the user's input.
   - Examples: "tech field" → technology, coding, software, gadgets, computer science, engineering, AI, programming
   - "beauty" → makeup, skincare, cosmetics, beauty tips, hair, fashion beauty
   - "fitness" → gym, workout, health, sports, bodybuilding, wellness
   - "food" → cooking, recipes, food review, culinary, nutrition
   - "campus/student life" → student lifestyle, campus life, university, dorm life

2. Match creators ONLY if their Skills/Content Categories, interests, or niche directly relate to the extracted domain.
   - A creator tagged with "Campus life" or "Student lifestyle" should NOT match a "tech field" search unless they also have tech-related tags.
   - A creator tagged with "Technology", "Coding", "Gadgets", "Software", "Computer Science", "Engineering", "AI/ML", "Programming", or similar SHOULD match a "tech field" search.

3. Do not match based on campaign keywords alone. The creator's own profile tags and niche must reflect the requested field.

4. Score and rank creators by relevance:
   - High match (score 80-98): Creator's primary niche/category directly matches the requested field
   - Medium match (score 55-79): Creator has secondary tags or interests that relate to the field
   - Low/No match: Exclude these entirely — do not include them in matches

5. Field synonym mapping — treat these as equivalent when matching:
   - Tech: technology, computer science, coding, programming, software, hardware, gadgets, engineering, cybersecurity, AI, machine learning, developer, startup, SaaS
   - Beauty: makeup, skincare, cosmetics, beauty, hair care, nail art, beauty review, GRWM
   - Fitness: gym, workout, fitness, health, bodybuilding, yoga, sports, nutrition, wellness
   - Food: cooking, recipes, food blogger, food review, culinary, baking, restaurant, nutrition
   - Lifestyle: daily life, vlog, personal growth, motivation, productivity
   - Fashion: style, outfit, OOTD, clothing, streetwear, luxury fashion
   - Gaming: gaming, esports, game review, streamer, Twitch, game dev
   - Education: tutoring, study tips, e-learning, school, academic
   - Travel: travel vlog, adventure, backpacking, destination, tourism
   - Finance: investing, personal finance, crypto, stocks, budgeting

6. If no creators match the requested field, return matches as an empty array and set noMatchMessage to: "No creators found matching [field]. Try broadening your search or check back when more creators in this niche join."

Always prioritize quality of match over quantity. It is better to return 2 highly relevant creators than 8 loosely related ones.

Return only valid JSON using this exact shape:
{ "matches": [{ "creatorId": "id", "score": 85, "reasons": ["reason 1", "reason 2"] }], "noMatchMessage": "" }
Use the provided creator ids only. Leave noMatchMessage as empty string when matches are found.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            brandRequest: prompt,
            shortlistedCreators: shortlisted,
          }),
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json() as { output_text?: string; output?: { content?: { text?: string }[] }[] };
  const text = payload.output_text ?? payload.output?.flatMap(item => item.content ?? []).map(item => item.text).filter(Boolean).join('\n') ?? '';
  const parsed = JSON.parse(text) as { matches?: MatchResult[]; noMatchMessage?: string };
  const filteredMatches = (parsed.matches ?? [])
    .filter(match => ranked.some(item => item.creatorId === match.creatorId))
    .slice(0, 8);
  return {
    matches: filteredMatches,
    noMatchMessage: parsed.noMatchMessage || undefined,
  };
}

function mergeAiReasons(ranked: MatchResult[], aiMatches: MatchResult[]) {
  const rankedById = new Map(ranked.map(match => [match.creatorId, match]));
  return aiMatches
    .map(match => ({
      creatorId: match.creatorId,
      score: Math.max(1, Math.min(98, Math.round(match.score || rankedById.get(match.creatorId)?.score || 70))),
      reasons: match.reasons?.length ? match.reasons.slice(0, 3) : rankedById.get(match.creatorId)?.reasons ?? [],
    }))
    .sort((a, b) => b.score - a.score);
}

function buildRuleReasons({
  creator,
  textHits,
  platformMatch,
  followerFit,
  engagementFit,
  requestedPlatforms,
  requestedFollowerMinimum,
  requestedEngagementMinimum,
}: {
  creator: CreatorSnapshot;
  textHits: string[];
  platformMatch: boolean;
  followerFit: boolean;
  engagementFit: boolean;
  requestedPlatforms: string[];
  requestedFollowerMinimum: number | null;
  requestedEngagementMinimum: number | null;
}) {
  const reasons: string[] = [];
  if (textHits.length) reasons.push(`Matches campaign terms: ${textHits.slice(0, 3).join(', ')}.`);
  if (requestedPlatforms.length) {
    reasons.push(platformMatch ? `Active on requested platform ${requestedPlatforms.join(', ')}.` : `Not strongest on requested platform, but profile still has adjacent fit.`);
  }
  if (requestedFollowerMinimum) {
    reasons.push(followerFit ? `Meets the requested reach with ${formatFollowers(totalCreatorFollowers(creator))} followers.` : `Below requested reach, but may fit niche or engagement needs.`);
  }
  if (requestedEngagementMinimum) {
    reasons.push(engagementFit ? `${creator.engagementRate ?? 0}% engagement meets the request.` : `${creator.engagementRate ?? 0}% engagement is below the requested threshold.`);
  }
  if (creator.verified) reasons.push('Verified creator profile.');
  if (!reasons.length) reasons.push('Strong overall creator score and profile readiness.');
  return reasons.slice(0, 3);
}

const synonymMap: Record<string, string[]> = {
  tech: ['tech', 'technology', 'coding', 'programming', 'software', 'computer', 'digital', 'engineering', 'stem', 'developer', 'development'],
  technology: ['technology', 'tech', 'coding', 'programming', 'software', 'computer', 'digital', 'engineering', 'stem'],
  coding: ['coding', 'programming', 'tech', 'technology', 'software', 'developer', 'development', 'computer'],
  'computer science': ['computer', 'science', 'coding', 'programming', 'tech', 'technology', 'stem', 'engineering'],
  fitness: ['fitness', 'gym', 'workout', 'exercise', 'health', 'sport', 'sports', 'athletic', 'training', 'wellbeing'],
  food: ['food', 'cooking', 'recipe', 'culinary', 'foodie', 'restaurant', 'eating', 'cuisine', 'baking', 'snack'],
  beauty: ['beauty', 'makeup', 'skincare', 'cosmetics', 'glam', 'glamour', 'grooming', 'glow', 'blush', 'lipstick', 'foundation'],
  fashion: ['fashion', 'style', 'styling', 'clothing', 'outfit', 'wardrobe', 'streetwear', 'ootd', 'looks'],
  travel: ['travel', 'traveling', 'adventure', 'explore', 'exploring', 'wanderlust', 'trip', 'destination', 'backpacking'],
  gaming: ['gaming', 'games', 'gamer', 'esports', 'videogames', 'streaming', 'twitch', 'playthrough'],
  music: ['music', 'musician', 'singing', 'singer', 'band', 'song', 'artist', 'playlist', 'audio'],
  lifestyle: ['lifestyle', 'daily', 'vlog', 'vlogs', 'campus', 'student', 'routine', 'wellness', 'life'],
  education: ['education', 'study', 'studying', 'learning', 'academic', 'school', 'student', 'campus', 'tutorial', 'university', 'college'],
  campus: ['campus', 'university', 'student', 'college', 'academic', 'school', 'dorm', 'uni'],
  university: ['university', 'campus', 'student', 'college', 'academic', 'school', 'dorm', 'uni'],
  student: ['student', 'campus', 'university', 'college', 'academic', 'school', 'dorm'],
  college: ['college', 'campus', 'university', 'student', 'academic', 'school'],
  art: ['art', 'artist', 'creative', 'design', 'drawing', 'illustration', 'photography', 'graphic'],
  events: ['events', 'event', 'party', 'celebration', 'social', 'community'],
};

function expandTerms(terms: Set<string>): { allTerms: Set<string>; nicheTerms: Set<string> } {
  const allTerms = new Set(terms);
  const nicheTerms = new Set<string>();
  for (const term of terms) {
    const synonyms = synonymMap[term];
    if (synonyms) {
      nicheTerms.add(term);
      synonyms.forEach(s => { allTerms.add(s); nicheTerms.add(s); });
    }
  }
  return { allTerms, nicheTerms };
}

function tokenize(value: string) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'want', 'need', 'creator', 'creators',
    'campaign', 'brand', 'best', 'from', 'are', 'has', 'have', 'who', 'can', 'does',
    'show', 'find', 'get', 'some', 'any', 'all', 'their', 'its', 'our', 'your', 'into',
    'good', 'great', 'top', 'strong', 'high', 'active', 'based',
    // generic content-creation words that appear in every creator's profile
    'content', 'create', 'creating', 'created', 'makes', 'making', 'make', 'post',
    'posting', 'posts', 'share', 'sharing', 'about', 'also', 'even', 'more', 'just',
    // generic search/query words that should never match creator profiles
    'field', 'see', 'like', 'looking', 'people', 'interested', 'work', 'works',
    'want', 'show', 'give', 'very', 'really', 'much', 'many', 'lot', 'few',
    'they', 'them', 'those', 'these', 'when', 'where', 'what', 'how', 'why',
  ]);
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9%.\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term)),
  );
}

function findRequestedPlatforms(prompt: string) {
  const lower = prompt.toLowerCase();
  return ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'x', 'twitch', 'linkedin']
    .filter(platform => lower.includes(platform));
}

function findFollowerMinimum(prompt: string) {
  const match = prompt.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(k|m)?\+?\s*(followers|follower|reach)/);
  if (!match) return null;
  const value = Number(match[1]);
  const multiplier = match[2] === 'm' ? 1_000_000 : match[2] === 'k' ? 1_000 : 1;
  return Math.round(value * multiplier);
}

function findEngagementMinimum(prompt: string) {
  const match = prompt.toLowerCase().match(/(\d+(?:\.\d+)?)\s*%?\+?\s*(engagement|er)/);
  return match ? Number(match[1]) : null;
}

function totalCreatorFollowers(creator: CreatorSnapshot) {
  return creator.platforms?.reduce((sum, platform) => sum + Number(platform.followers ?? 0), 0) ?? 0;
}

function formatFollowers(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toLocaleString();
}
