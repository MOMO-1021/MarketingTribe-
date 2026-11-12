export const HOST_EMAIL = "hello@adda.local";

export const PRACTICES = [
  "Performance",
  "Brand",
  "Content",
  "Social",
  "SEO",
  "Growth",
  "Influencer",
  "CRM & retention",
  "Agency (general)",
  "In-house (general)",
  "Founder",
  "Freelance",
  "Other",
] as const;

export type Practice = (typeof PRACTICES)[number];

export const CIRCLES: Array<[string, string, string, number]> = [
  ["general", "General", "The open table. Anything useful to other marketers in India.", 1],
  ["performance", "Performance", "Paid media, budgets, creative testing, and messy ad accounts.", 2],
  ["content", "Content", "Writing, offers, landing pages, and creative that earns attention.", 3],
  ["seo", "SEO", "Search intent, pages that rank, and traffic that actually converts.", 4],
  ["social", "Social", "Organic distribution, community, and showing up without burning out.", 5],
  ["brand", "Brand", "Positioning, naming, identity, and the long work of being remembered.", 6],
  ["d2c", "D2C", "Consumer brands, contribution margin, and selling beyond the metro bubble.", 7],
  ["b2b", "B2B", "Pipeline, partnerships, and marketing when the buyer is a committee.", 8],
  ["influencer", "Influencer", "Creators, briefs, usage rights, and collaborations that are fair.", 9],
  ["careers", "Careers", "Roles, pay, portfolios, and finding a team worth joining.", 10],
];

const ERRORS = {
  email: "Enter a valid email address.",
  password: "Use at least 8 characters.",
  taken: "An account with that email already exists. Sign in instead.",
  credentials: "That email and password did not match.",
  name: "Please add your name.",
  city: "Add the city you work in.",
  practice: "Choose the kind of marketing you do.",
  confirm: "This room is for people who do marketing work in India.",
  title: "Give the thread a clear title (at least 8 characters).",
  body: "Keep the thread under 8,000 characters.",
  comment: "Write a reply before sending.",
  commentlong: "Keep the reply under 4,000 characters.",
  community: "Choose a circle.",
  forbidden: "You can only change your own thread.",
  replyforbidden: "You can only change your own reply.",
  profile: "Check your name, practice, and city.",
  deletepassword: "Your password was incorrect. Your account was not deleted.",
} as const;

export function errorMessage(code?: string) {
  if (!code) return undefined;
  return ERRORS[code as keyof typeof ERRORS];
}
