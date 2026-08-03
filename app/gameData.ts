export type GameLocation = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  imageUrl: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  confidence: "high" | "estimated";
};

const SANTO_PRINTS = "https://santophotos.fothergill.com/fun%20photos-fo%20prints";
const SANTO_PORTRAITS = "https://santophotos.fothergill.com/Photos%20of%20me";
const SANTO_SOURCE = "https://santophotos.fothergill.com/";

// Coordinates marked "estimated" were inferred from the photograph and portfolio
// description. They intentionally live here so they can be corrected without
// touching the game logic.
export const GAME_LOCATIONS: GameLocation[] = [
  {
    id: "mount-fuji-summit",
    name: "Mount Fuji, Japan",
    region: "Chūbu, Japan",
    lat: 35.3606,
    lng: 138.7274,
    imageUrl: `${SANTO_PORTRAITS}/14.jpg`,
    alt: "Two hikers at the summit of Mount Fuji above the clouds",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "high",
  },
  {
    id: "great-sand-dunes",
    name: "Great Sand Dunes National Park, Colorado",
    region: "Colorado, United States",
    lat: 37.7916,
    lng: -105.5943,
    imageUrl: `${SANTO_PRINTS}/DSCF3330.jpg`,
    alt: "Hikers crossing enormous sand dunes beneath the Sangre de Cristo Mountains",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "high",
  },
  {
    id: "aosta-winter",
    name: "Aosta Valley, Italy",
    region: "Italian Alps",
    lat: 45.7372,
    lng: 7.3201,
    imageUrl: `${SANTO_PRINTS}/DSCF0275.jpg`,
    alt: "Snow-covered alpine town with a stream and steep mountain backdrop",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "estimated",
  },
  {
    id: "half-moon-bay-wildflowers",
    name: "Half Moon Bay, California",
    region: "California coast, United States",
    lat: 37.4636,
    lng: -122.4286,
    imageUrl: `${SANTO_PRINTS}/DSCF1892.jpg`,
    alt: "Foggy California coastline with green waves and wildflowers",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "estimated",
  },
  {
    id: "pacifica-dusk",
    name: "Pacifica, California",
    region: "California coast, United States",
    lat: 37.6138,
    lng: -122.4869,
    imageUrl: `${SANTO_PRINTS}/DSCF1345.jpg`,
    alt: "Long Pacific beach at blue hour beneath a fog-covered headland",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "estimated",
  },
  {
    id: "rockies-twilight",
    name: "Colorado Front Range",
    region: "Colorado, United States",
    lat: 39.5501,
    lng: -105.7821,
    imageUrl: `${SANTO_PRINTS}/DSCF0059.jpg`,
    alt: "Purple and pink twilight behind layered mountain silhouettes",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "estimated",
  },
  {
    id: "mount-elbert-light",
    name: "Colorado High Rockies",
    region: "Colorado, United States",
    lat: 39.1178,
    lng: -106.4454,
    imageUrl: `${SANTO_PRINTS}/DSCF2690.jpg`,
    alt: "Golden sunset light striking a snow-capped mountain summit",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "estimated",
  },
  {
    id: "half-moon-bay-bluffs",
    name: "Half Moon Bay coastal bluffs, California",
    region: "California coast, United States",
    lat: 37.503,
    lng: -122.496,
    imageUrl: `${SANTO_PRINTS}/DSCF5304.jpg`,
    alt: "Long sandy beach beneath layered coastal bluffs",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "estimated",
  },
  {
    id: "aspen-grove",
    name: "Aspen, Colorado",
    region: "Colorado, United States",
    lat: 39.1911,
    lng: -106.8175,
    imageUrl: `${SANTO_PRINTS}/DSCF4032.jpg`,
    alt: "Sunlight filtering through a lush green aspen grove",
    credit: "Santo Fothergill",
    sourceUrl: SANTO_SOURCE,
    confidence: "estimated",
  },
  {
    id: "patagonia-fitz-roy",
    name: "El Chaltén, Argentina",
    region: "Patagonia, Argentina",
    lat: -49.3315,
    lng: -72.8863,
    imageUrl: "https://images.unsplash.com/photo-1626368185783-7c928d6f0133?auto=format&fit=crop&w=1800&q=88",
    alt: "Snow-covered Mount Fitz Roy above the Patagonian landscape",
    credit: "Rafael Hoyos Weht · Unsplash",
    sourceUrl: "https://unsplash.com/photos/vM0tW-ruSSU",
    confidence: "high",
  },
  {
    id: "kyoto-pagoda",
    name: "Kyoto, Japan",
    region: "Kansai, Japan",
    lat: 35.0116,
    lng: 135.7681,
    imageUrl: "https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&w=1800&q=88",
    alt: "Traditional Kyoto street at night with a pagoda beyond the wooden buildings",
    credit: "Roméo A. · Unsplash",
    sourceUrl: "https://unsplash.com/photos/SlIl9eZjWUc",
    confidence: "high",
  },
  {
    id: "vik-black-sand",
    name: "Vík, Iceland",
    region: "South Coast, Iceland",
    lat: 63.405,
    lng: -19.071,
    imageUrl: "https://images.unsplash.com/photo-1500043357865-c6b8827edf10?auto=format&fit=crop&w=1800&q=88",
    alt: "Black sand beach and steel-blue ocean beneath an overcast Icelandic sky",
    credit: "Adam Jang · Unsplash",
    sourceUrl: "https://unsplash.com/photos/MLKrf51NV8w",
    confidence: "high",
  },
];
