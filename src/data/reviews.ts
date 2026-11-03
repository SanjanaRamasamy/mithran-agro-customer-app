import type { Review, RatingBreakdown } from "@/types";
import { PRODUCT_BY_ID } from "./products";

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

const AVATAR_COLORS = ["forest", "lime", "emerald", "amber"];
const avatar = (seed: number) =>
  `https://api.dicebear.com/9.x/thumbs/png?seed=verdant-${seed}&backgroundColor=${AVATAR_COLORS[seed % 4]}`;

interface RawReview {
  productId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  daysAgo: number;
  helpful: number;
}

const RAW: RawReview[] = [
  { productId: "prd-apple-01", userName: "Ananya R.", rating: 5, title: "Actually crisp!", body: "Every apple arrived firm and cold. You can taste the difference from the shiny waxed ones at the supermarket — my kids finished the 500 g pack in one evening.", daysAgo: 3, helpful: 42 },
  { productId: "prd-apple-01", userName: "Vikram S.", rating: 4, title: "Great, slightly small", body: "Flavour is excellent, genuinely sweet with proper crunch. One star off only because two apples in the pack were smaller than expected.", daysAgo: 11, helpful: 18 },
  { productId: "prd-apple-01", userName: "Meera K.", rating: 5, title: "Repeat customer", body: "Third order. Consistent quality every time and you can really smell the apple perfume when you open the bag.", daysAgo: 19, helpful: 33 },
  { productId: "prd-banana-01", userName: "Suresh P.", rating: 5, title: "Sweetest bananas in Bengaluru", body: "Yelakki is unmatched. Arrived green-tipped, ripened perfectly in 2 days on the counter. Buying 1 kg every week now.", daysAgo: 5, helpful: 27 },
  { productId: "prd-banana-01", userName: "Divya M.", rating: 4, title: "Perfect for kids", body: "Right size for lunch boxes. Wish the ripening window was slightly more predictable but that's nature.", daysAgo: 8, helpful: 12 },
  { productId: "prd-spinach-01", userName: "Kavitha N.", rating: 5, title: "Still squeaky fresh next day", body: "I've never received spinach this fresh — leaves snapped when folded. Made palak paneer and the colour was stunning green.", daysAgo: 2, helpful: 51 },
  { productId: "prd-spinach-01", userName: "Rohit T.", rating: 4, title: "Very good but small bunch", body: "Quality is superb. The 250 g bunch is smaller than it looks in photos, but taste makes up for it.", daysAgo: 6, helpful: 9 },
  { productId: "prd-tomato-01", userName: "Lakshmi V.", rating: 5, title: "Real naati flavour", body: "Finally a tomato with proper tang. My rasam tastes like my grandmother's again. Will not buy hybrids anymore.", daysAgo: 4, helpful: 38 },
  { productId: "prd-tomato-01", userName: "Farhan A.", rating: 4, title: "Good tang, some soft ones", body: "Excellent flavour for curries. Two tomatoes were soft at the shoulder but nothing a next-day curry couldn't fix.", daysAgo: 14, helpful: 11 },
  { productId: "prd-carrot-01", userName: "Nisha G.", rating: 5, title: "Carrot halwa dream", body: "So sweet I grated half straight into the halwa without adding extra sugar. Tops were fresh green too.", daysAgo: 7, helpful: 22 },
  { productId: "prd-broccoli-01", userName: "Arvind J.", rating: 5, title: "Dense and dark green", body: "Better than the imported ones at 3× the price. Steamed 4 minutes and it was perfect — no yellowing even on day 3.", daysAgo: 9, helpful: 19 },
  { productId: "prd-avocado-01", userName: "Priya D.", rating: 4, title: "Creamy when ready", body: "Waited 2 days on the counter and they were spot-on for toast. One was slightly under but the rest were buttery.", daysAgo: 12, helpful: 16 },
  { productId: "prd-strawberry-01", userName: "Sneha B.", rating: 5, title: "Worth every rupee", body: "Smelled like strawberry jam when I opened the punnet. Sweet to the core, no white shoulders. True Mahabaleshwar quality.", daysAgo: 3, helpful: 47 },
  { productId: "prd-mango-01", userName: "Rajesh I.", rating: 5, title: "The real Ratnagiri Hapus", body: "Saffron deep in the flesh, zero fibre near the seed, and that unmistakable aroma. Carbide-free claim is genuine — ripened evenly over 3 days.", daysAgo: 15, helpful: 88 },
  { productId: "prd-mango-01", userName: "Sunita W.", rating: 5, title: "Best box of the season", body: "Ordered the dozen box. All 12 ripened beautifully, none spoiled. My whole family fought over the last two.", daysAgo: 22, helpful: 61 },
  { productId: "prd-orange-01", userName: "Mohan L.", rating: 4, title: "Juicy and aromatic", body: "Easy to peel, loads of juice. A couple were more sour than sweet but overall excellent nagpur quality.", daysAgo: 10, helpful: 14 },
  { productId: "prd-grapes-01", userName: "Tanvi C.", rating: 4, title: "Crisp and sweet", body: "Berries snap properly and taste great chilled. The bloom on them was intact which shows careful packing.", daysAgo: 6, helpful: 8 },
  { productId: "prd-bellpepper-01", userName: "Imran Q.", rating: 5, title: "Thick walls, gorgeous colours", body: "These are pizza-parlour quality capsicums. Sautéed with minimum oil and they stayed crunchy. Beautiful on the plate.", daysAgo: 5, helpful: 21 },
  { productId: "prd-cucumber-01", userName: "Rekha S.", rating: 4, title: "Truly seedless", body: "Great in tzatziki and infused water. Slight softness at one end of one piece but otherwise super fresh.", daysAgo: 13, helpful: 7 },
  { productId: "prd-potato-01", userName: "Gopal R.", rating: 5, title: "Perfect masala potatoes", body: "Waxy texture means they hold shape in dosa masala exactly like they should. Clean, unblemished skins.", daysAgo: 8, helpful: 25 },
  { productId: "prd-onion-01", userName: "Sarita H.", rating: 4, title: "Properly pungent", body: "Real onion heat — eyes watered while chopping which is oddly reassuring! Caramelises into deep sweetness.", daysAgo: 17, helpful: 13 },
  { productId: "prd-garlic-01", userName: "Dev K.", rating: 5, title: "Small but ferocious", body: "One small clove equals three of the supermarket ones. Papery skins, no mould even after three weeks in the jar.", daysAgo: 21, helpful: 17 },
  { productId: "prd-lettuce-01", userName: "Amrita F.", rating: 5, title: "Still alive after a week", body: "Root-intact delivery is genius. Leaves perked up in ice water even on day 6. Burgers and tacos all week.", daysAgo: 4, helpful: 29 },
  { productId: "prd-kale-01", userName: "Jignesh P.", rating: 4, title: "Great for smoothies", body: "Much less bitter than market kale. My toddler drinks the smoothie without complaints. Stems were slightly woody but fine for stock.", daysAgo: 11, helpful: 10 },
  { productId: "prd-blueberry-01", userName: "Chaitra Y.", rating: 5, title: "Plump with real bloom", body: "No mushy berries in the punnet, and the dusty bloom was intact. My overnight oats have never looked this good.", daysAgo: 6, helpful: 20 },
  { productId: "prd-watermelon-01", userName: "Basavraj N.", rating: 5, title: "12 brix sweetness is real", body: "Deep red, crisp, and frighteningly sweet. Cut thin rind to flesh. Finished it in two days and ordered again.", daysAgo: 9, helpful: 34 },
  { productId: "prd-pineapple-01", userName: "Elena D.", rating: 4, title: "Low acid, golden", body: "Smelled amazing even before cutting. Core was edible as promised. A touch smaller than expected.", daysAgo: 16, helpful: 9 },
  { productId: "prd-papaya-01", userName: "Nandini S.", rating: 4, title: "Clean sweetness", body: "Ripened in one day with a squeeze of lime as suggested. Good breakfast papaya — not the greatest but very reliable.", daysAgo: 7, helpful: 11 },
  { productId: "prd-pomegranate-01", userName: "Harish M.", rating: 5, title: "Deep ruby arils", body: "Cut one open and the seeds were glowing red. Sweet, soft-chew arils — my juicer yielded almost 2 glasses per kg.", daysAgo: 5, helpful: 40 },
  { productId: "prd-mushroom-01", userName: "Farida Z.", rating: 4, title: "Fresh and clean", body: "Caps tightly shut, no sliminess. Sautéed beautifully without releasing much water. A little pricey but worth it.", daysAgo: 3, helpful: 15 },
  { productId: "prd-coriander-01", userName: "Yashoda T.", rating: 5, title: "Roots on = lasts forever", body: "The root-intact trick works — still fresh on day 5 standing in water. Extremely aromatic, my kitchen smelled like a garden.", daysAgo: 2, helpful: 55 },
  { productId: "prd-ginger-01", userName: "Prakash V.", rating: 5, title: "Fiery and juicy", body: "Snaps when broken — that's how fresh ginger should be. Half a thumb made chai for four people properly spicy.", daysAgo: 8, helpful: 23 },
  { productId: "prd-lemon-01", userName: "Bhavana U.", rating: 4, title: "So much juice", body: "Thin skins, heavy fruit — two lemons gave a full glass of lemonade. Some had minor blemishes but zest was clean.", daysAgo: 12, helpful: 12 },
  { productId: "prd-greenpeas-01", userName: "Sameer O.", rating: 5, title: "Shelling with the family", body: "Turned shelling into family time on a Sunday. Plump pods, sweet peas, froze half after blanching.", daysAgo: 6, helpful: 18 },
  { productId: "prd-cauliflower-01", userName: "Winnie A.", rating: 4, title: "Snow white curds", body: "Roasted whole with cumin and it was restaurant quality. Trimming leaves was easy. Slight black spot on one floret only.", daysAgo: 10, helpful: 13 },
  { productId: "prd-beetroot-01", userName: "Kiran E.", rating: 5, title: "Ruby perfection", body: "Roasted whole unpeeled as suggested and the skins slipped right off. Juice stained everything gloriously. Deeply sweet.", daysAgo: 7, helpful: 19 },
];

export const REVIEWS: Review[] = RAW.map((r, i) => ({
  id: `rev-${i + 1}`,
  productId: r.productId,
  userId: `user-${i + 1}`,
  userName: r.userName,
  userAvatar: avatar(i + 1),
  rating: r.rating,
  title: r.title,
  body: r.body,
  date: daysAgo(r.daysAgo),
  verifiedPurchase: true,
  helpfulCount: r.helpful,
}));

export function reviewsForProduct(productId: string): Review[] {
  return REVIEWS.filter((r) => r.productId === productId).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function ratingBreakdown(product: {
  rating: number;
  reviewCount: number;
}): RatingBreakdown[] {
  const weights = [0.68, 0.22, 0.06, 0.03, 0.01]; // 5..1 stars
  return weights.map((w, i) => {
    const count = Math.max(1, Math.round(product.reviewCount * w));
    return {
      star: 5 - i,
      count,
      percent: Math.round(w * 100),
    };
  });
}

export function reviewSeedInsights(productId: string): string[] {
  const p = PRODUCT_BY_ID[productId];
  if (!p) return [];
  return [
    `${p.reviewCount} verified ratings — average ${p.rating.toFixed(1)} out of 5.`,
    "88% of reviewers would buy this again (mock insight).",
    `"${p.tagline}" is the phrase most repeated in written reviews.`,
  ];
}
