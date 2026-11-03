import type { HeroSlide, DeliverySlot, FarmerStory, FAQ, Testimonial } from "@/types";
import { img } from "./images";

const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3600_000).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "h1",
    eyebrow: "Fresh Produce",
    title: "From soil to table in 24 hours.",
    subtitle:
      "Certified organic fruits and vegetables from partner farms around Bengaluru, delivered at dawn-picked freshness.",
    ctaLabel: "Shop fresh produce",
    ctaHref: "/category/fresh-produce",
    image: img("hero-main"),
    stat: { label: "farms within 150 km", value: "10" },
  },
  {
    id: "h2",
    eyebrow: "Organic Fertilizers",
    title: "Feed your soil, the way nature intended.",
    subtitle:
      "Organic compost, vermicompost, farmyard manure, neem cake and bio plant boosters — lab-tested and certified for Indian soils.",
    ctaLabel: "Shop fertilizers",
    ctaHref: "/category/organic-fertilizers",
    image: img("cat-fertilizer"),
    stat: { label: "organic inputs", value: "100%" },
  },
  {
    id: "h3",
    eyebrow: "Organic Groceries",
    title: "Pantry staples, the clean way.",
    subtitle:
      "Single-origin rice, stone-ground atta, millet flour, turmeric, chilli, coriander and organic jaggery from farmer producer organisations.",
    ctaLabel: "Shop organic groceries",
    ctaHref: "/category/organic-grocery",
    image: img("cat-grocery"),
    stat: { label: "stone-ground weekly", value: "FPO" },
  },
  {
    id: "h4",
    eyebrow: "Women's Apparels",
    title: "Fashion woven by artisan clusters.",
    subtitle:
      "Kanjivaram silks, handloom cotton sarees, kurtis, leggings, dupattas and dresses — bought at honest, weaver-first prices.",
    ctaLabel: "Shop women's collection",
    ctaHref: "/category/women",
    image: img("cat-fashion"),
    stat: { label: "handloom clusters", value: "5" },
  },
];

export const DELIVERY_SLOTS: DeliverySlot[] = [
  { id: "s1", day: "Today", date: hoursFromNow(3), window: "6 PM – 9 PM", capacity: "filling-fast", fee: 0 },
  { id: "s2", day: "Today", date: hoursFromNow(6), window: "9 PM – 11 PM", capacity: "available", fee: 29 },
  { id: "s3", day: "Tomorrow", date: hoursFromNow(15), window: "6 AM – 9 AM", capacity: "available", fee: 0 },
  { id: "s4", day: "Tomorrow", date: hoursFromNow(18), window: "9 AM – 12 PM", capacity: "available", fee: 0 },
  { id: "s5", day: "Tomorrow", date: hoursFromNow(21), window: "12 PM – 3 PM", capacity: "filling-fast", fee: 0 },
  { id: "s6", day: "Tomorrow", date: hoursFromNow(24), window: "3 PM – 6 PM", capacity: "full", fee: 0 },
];

export const FARMER_STORIES: FarmerStory[] = [
  {
    id: "fs-1",
    sellerId: "green-acres",
    name: "Ramesh Gowda",
    farmName: "Green Acres Farm",
    location: "Kanakapura · 38 km away",
    story:
      "Ramesh's 18 acres have been chemical-free since 2011. His vermicompost pits feed 22 crops, and his prized bananas and tomatoes reach city kitchens within a day.",
    image: img("f-1"),
    crops: ["Fruits", "Vegetables"],
  },
  {
    id: "fs-2",
    sellerId: "sunrise-valley",
    name: "Lakshmi Narayan",
    farmName: "Sunrise Valley Collective",
    location: "Chikkaballapur · 52 km away",
    story:
      "62 women, one collective, and a rule that nothing is harvested after 5 AM. Lakshmi leads the fastest farm-to-door pipeline in the state — picked at 4, dispatched by 7.",
    image: img("f-2"),
    crops: ["Vegetables", "Fruits"],
  },
  {
    id: "fs-3",
    sellerId: "hillside-orchards",
    name: "Tenzing Bhutia",
    farmName: "Hillside Orchards",
    location: "Coorg · 145 km away",
    story:
      "At 3,500 ft, Tenzing's orchards catch mountain mist that does half his irrigation. His apples, oranges and pomegranates prove hills grow more than coffee.",
    image: img("f-3"),
    crops: ["Apples", "Oranges", "Pomegranates"],
  },
  {
    id: "fs-4",
    sellerId: "terra-verde",
    name: "Arjun Mehta",
    farmName: "Terra Verde Estate",
    location: "Hosur · 41 km away",
    story:
      "A software engineer turned polyhouse farmer, Arjun runs 30 acres of precision drip lines and bumblebee pollination. His tomatoes and cucumbers are never bitter.",
    image: img("f-4"),
    crops: ["Tomatoes", "Cucumbers", "Beans"],
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    name: "Priya Raghavan",
    meta: "HSR Layout, Bengaluru · Fresh Produce regular",
    rating: 5,
    quote:
      "The carrots still had field soil on them when they arrived — you can tell nothing sits in cold storage. My weekly vegetable box has completely replaced supermarket runs.",
  },
  {
    id: "t-2",
    name: "Suresh Kumar",
    meta: "Kitchen gardener, Whitefield",
    rating: 5,
    quote:
      "I ordered the organic compost and neem cake for my terrace garden. Germination improved within a month, and the application guide on every pack is genuinely useful.",
  },
  {
    id: "t-3",
    name: "Ananya Iyer",
    meta: "Indiranagar · Women's Apparels",
    rating: 5,
    quote:
      "My Kanjivaram arrived with the weaver's name on the tag. The quality rivals showroom sarees at half the price — and knowing the cluster gets a fair share matters to me.",
  },
];

export const FAQS: FAQ[] = [
  {
    question: "How fresh is 'fresh', really?",
    answer:
      "Most vegetables are harvested between 4 and 6 AM and delivered the same evening or next morning. Every product page shows the actual harvest date, not a marketing claim.",
  },
  {
    question: "What does 'certified organic' mean here?",
    answer:
      "Every partner farm and input holds India Organic certification, audited annually. Soil, water, and input records are maintained per season and available on request.",
  },
  {
    question: "What happens if produce arrives damaged?",
    answer:
      "Raise a return request within 24 hours from your order page with a photo. We issue an instant refund to your Mithren Agro Wallet — no return pickup needed for produce.",
  },
  {
    question: "Do you ship fertilizers and groceries outside Bengaluru?",
    answer:
      "Yes — fertilizers and organic groceries ship across South India in 2–5 days. Fresh produce is currently limited to Bengaluru so it never loses freshness in transit.",
  },
  {
    question: "Are the sarees genuine handloom?",
    answer:
      "Every saree comes directly from weaver clusters in Kanchipuram, Salem and Bhagalpur with Handloom Mark or Silk Mark certification, and the weaver's name on the tag.",
  },
];
