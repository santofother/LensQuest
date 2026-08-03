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

type GalleryPhoto = readonly [file: string, title: string, description: string];
type ApproximatePlace = Pick<GameLocation, "name" | "region" | "lat" | "lng">;

const SANTO_PRINTS = "https://santophotos.fothergill.com/fun%20photos-fo%20prints";
const SANTO_PORTRAITS = "https://santophotos.fothergill.com/Photos%20of%20me";
const SANTO_SOURCE = "https://santophotos.fothergill.com/";

// Every photograph currently published in Santo's Explore My Work gallery.
// The descriptions are the gallery's visual captions and are used together
// with the titles below to make transparent, editable location estimates.
const SANTO_GALLERY: GalleryPhoto[] = [
  ["DSCF0059.jpg", "Mountain Twilight", "Purple and pink sunset behind mountain silhouettes"],
  ["DSCF0147.jpg", "Snowy Peaks & Tundra", "Snow-dusted mountain range with overcast skies above brown tundra"],
  ["DSCF0213.jpg", "Alpine Panorama", "Expansive snow-capped alpine mountain range under blue sky"],
  ["DSCF0249.jpg", "The Italian Alps in Early Winter", "Snow-covered peaks stretching across a cloudy winter sky"],
  ["DSCF0255.jpg", "Sunlit Summit", "A towering mountain peak bathed in golden light with clouds swirling around"],
  ["DSCF0275.jpg", "Alpine Village Stream", "A stream running through a snow-covered European village with mountains behind"],
  ["DSCF0386.jpg", "Snowy Treeline", "Pine-covered hillside dusted with snow beneath a mountain backdrop"],
  ["DSCF0494.jpg", "Greenhouse Dreams", "Lush green plants inside a misty greenhouse with light pouring through"],
  ["DSCF0578.jpg", "Monochrome Mountains", "Black and white panoramic view of layered mountain ridges under stormy clouds"],
  ["DSCF0596.jpg", "Harbor Flags", "Colorful flags waving at a sunlit seaside harbor with boats in the distance"],
  ["DSCF1345.jpg", "Pacific Coast Dusk", "Waves breaking along a wide sandy beach at dusk with misty hills"],
  ["DSCF1553.jpg", "Sunrise Soarer", "A bird in flight over layered purple and pink mountain ridges at sunset"],
  ["DSCF1892.jpg", "Emerald Coastline", "Turquoise waves crashing on a misty shore with orange wildflowers in the foreground"],
  ["DSCF1933.jpg", "Wildflower Cove", "Purple wildflowers blooming on a clifftop overlooking a wide sandy beach"],
  ["DSCF2541-Pano.jpg", "God Rays", "Dramatic golden sunbeams breaking through dark storm clouds over the mountains"],
  ["DSCF2690.jpg", "Golden Peak", "Snow-capped mountain peak glowing with golden sunset light above a valley"],
  ["DSCF2960-2.jpg", "Storm Brewing", "Towering blue storm clouds gathering above a treeline at dusk"],
  ["DSCF2961.jpg", "Starry Night Trail", "Night sky with stars and a red light trail streaking above dark trees"],
  ["DSCF3167-1.jpg", "Bicycle Under the Oaks", "A bicycle leaning against a large oak tree in a sunlit summer park"],
  ["DSCF3330.jpg", "Dune Trekkers", "Hikers with backpacks trekking across Great Sand Dunes with mountains in the background"],
  ["DSCF3461.jpg", "Lone Dune Walker", "A solo figure walking into the golden sand dunes at sunset"],
  ["DSCF3564.jpg", "Climbing the Dunes", "Three hikers climbing a towering sand dune leaving footprint trails"],
  ["cefalu_beach.jpg", "Sicilian Harbor", "An overturned boat on the beach in the Italian coastal town of Cefalù"],
  ["DSCF3845.jpg", "Creekside Adventure", "Off-road vehicle parked by a mountain creek on a sunny summer day"],
  ["DSCF3861.jpg", "Crested Butte Stars", "A mountain peak glowing under a star-filled sky with wispy clouds"],
  ["DSCF4032.jpg", "Aspen Grove", "A lush grove of white-barked aspen trees bathed in vibrant green summer light"],
  ["DSCF4571.jpg", "Fuji Canoes", "Red and white canoes resting in the grass by a lake near Mount Fuji"],
  ["DSCF4676.jpg", "Pastel Sunset Shore", "Soft pink and peach sunset over ocean waves breaking on a sandy beach"],
  ["DSCF5304.jpg", "Clifftop Cove", "Turquoise ocean waves curving along sandy cliffs viewed from above"],
  ["DSCF5638.jpg", "Dune Beach Gateway", "A bright sandy beach seen through a gap in golden dune grass"],
  ["DSCF5904.jpg", "Mountain Through the Pines", "A rocky mountain peak framed by tall pine trees on a clear day"],
  ["DSCF6112.jpg", "Alpine Valley Vista", "Aerial view of a lush green alpine valley with a village and winding road"],
  ["DSCF9550.jpg", "Torino Friend", "A small dog resting in green grass on a misty hillside park"],
  ["DSCF9814.jpg", "Fire Spinner", "Explosive steel wool fire spinning with sparks flying against a black night sky"],
  ["DSCF0224.jpg", "Summit Silhouette", "Hiker adjusting a hat on a snowy mountain summit with alpine peaks beyond"],
  ["DSCF2980.jpg", "Night Streak", "Meteor streaks across a cloudy night sky above distant city lights"],
  ["DSCF2988.jpg", "Pine Curtain", "Sunlit pine trees frame a rocky hillside under blue sky with clouds"],
  ["DSCF4131.jpg", "Kelp Collector", "Person carrying seaweed walks barefoot along a coastal beach at sunset"],
  ["DSCF4155.jpg", "Lighthouse Silhouette", "Coastal lighthouse silhouetted against a vivid purple and orange sunset sky"],
  ["DSCF4170.jpg", "Pier Crash", "Ocean waves crash against pier pilings on a bright sunny day"],
  ["DSCF4182.jpg", "Pacific Power", "Powerful white waves breaking along a misty coastline with green headlands"],
  ["DSCF4291.jpg", "Neon Nights", "Busy Japanese street at night glowing with colorful neon signs"],
  ["DSCF4294.jpg", "Tokyo Dusk", "Neon-lit Japanese storefronts and signs glow at dusk on a city street"],
  ["DSCF4386.jpg", "Street Racer", "Modified red sports car speeding through a Tokyo crosswalk at night"],
  ["DSCF4417.jpg", "Shibuya Glow", "Vibrant neon signs line a crowded Shibuya street at night"],
  ["DSCF4544.jpg", "Bluff Sunset", "Coastal cliffs and sandy beach bathed in pink and purple sunset light"],
  ["DSCF4572.jpg", "Clifftop View", "Horseback rider and dog seen from a clifftop above a wide sandy beach"],
  ["DSCF4657.jpg", "Red Cliffs", "Golden hour view of beachgoers along red cliffs and sweeping coastline"],
  ["DSCF4757-2.jpg", "Hidden Cove", "Rocky coastline with green vegetation, beachgoers, and a tent on the sand"],
  ["DSCF4779.jpg", "Lake Village", "Small fishing boats moored on calm turquoise water beneath lush green mountains"],
  ["DSCF4784.jpg", "Misty Lake", "Golden sunlight illuminates grasses beside a misty mountain lake"],
  ["DSCF4884.jpg", "Harbor Dusk", "Fishing boats docked at a harbor pier during a pastel sunset"],
  ["DSCF4891.jpg", "Osaka Castle", "Japanese castle turret rising above stone walls along a moat at sunset"],
  ["DSCF4892.jpg", "Coastal Lighthouse", "Coastal lighthouse and cottage with a cypress tree overlooking the Pacific Ocean"],
  ["DSCF4901.jpg", "Sandstone Cove", "Rugged California coastline with golden cliffs, crashing waves, and a sandy cove"],
  ["DSCF4918.jpg", "Osaka Keep", "Osaka Castle's iconic multi-tiered tower framed by trees at golden hour"],
  ["DSCF4964.jpg", "Pelican Coast", "Pelicans fly over a sandy beach with sandstone bluffs under overcast skies"],
  ["DSCF4978-2.jpg", "Green Bluffs", "Lush green coastal bluffs curve along a misty California shoreline"],
  ["DSCF4996.jpg", "Clifftop Soar", "Bird soaring over wildflower-covered cliffs above turquoise ocean waves"],
  ["DSCF5171.jpg", "Torii Jump", "Person posing before the floating torii gate at Itsukushima Shrine"],
  ["DSCF5320.jpg", "Golden Gate Sunset", "Golden Gate Bridge silhouetted against a warm orange and gold sunset"],
  ["DSCF5464.jpg", "River Mirror", "Calm green river reflecting lush trees and old buildings on a European riverbank"],
  ["DSCF5499.jpg", "Bridge Below", "The Golden Gate Bridge towering overhead in vivid red and blue"],
  ["DSCF5599-2.jpg", "Genoa by the Sea", "Colorful Italian seaside village with pastel buildings cascading toward the harbor"],
  ["DSCF5685.jpg", "Snowy Campus", "Red lamp post and snow-covered campus with falling snowflakes and parked bicycles"],
  ["DSCF5757.jpg", "Lake Como View", "View through lush greenery down to an Italian lake town with mountains beyond"],
  ["DSCF5765.jpg", "Golden Peak", "Rugged mountain peak bathed in warm golden light against a clear blue sky"],
  ["DSCF5812.jpg", "Foggy Shore", "Sandy beach curving toward a misty headland with gentle blue ocean waves"],
  ["DSCF5818.jpg", "Lake Leap", "Man leaping from a stone wall into a lake beside an old villa"],
  ["DSCF5925.jpg", "Alpine Meadow", "Sunlit alpine meadow with evergreen trees stretching toward distant mountain ridges"],
  ["DSCF5950.jpg", "Window Light", "Warm golden light flooding through a window with a geometric pendant lamp"],
  ["DSCF6577.jpg", "Reclaimed", "Abandoned stone cottage with collapsed roof being reclaimed by lush green forest"],
  ["DSCF6891.jpg", "Portofino Harbor", "Colorful Italian harbor village with boats on turquoise water and a bird in flight"],
  ["DSCF6919.jpg", "Ligurian Coast", "Sailboats and yachts anchored in a turquoise Italian bay framed by green hillsides"],
  ["DSCF7806.jpg", "Red Rocks", "Towering red sandstone formations rise above green shrubs under cloudy skies"],
  ["DSCF8171.jpg", "Fiat on the Coast", "Classic red Fiat 500 parked on cobblestones in an Italian coastal hillside town"],
  ["DSCF8203.jpg", "Street Celebration", "Crowd celebrating on Evans Avenue with people standing atop a street light"],
  ["DSCF8208.jpg", "Phone Glow", "Dense crowd holding up phones while filming a bonfire in the street at dusk"],
  ["DSCF8761.jpg", "Team Huddle", "Rugby players in red jerseys huddled together from behind"],
  ["DSCF9164.jpg", "Goal Celebration", "Two soccer players leap into a celebratory embrace on a sunlit turf field"],
  ["DSCF9270.jpg", "Team Spirit", "Rugby team posing playfully while lifting a teammate on the field"],
  ["DSCF9572.jpg", "Marrakech Monkey", "Smiling man with a dressed-up monkey perched on his head in a Moroccan plaza"],
  ["DSCF9705.jpg", "Desert Oasis", "A tranquil pool with a water spout set amid rolling desert hills"],
  ["DSCF9706.jpg", "Desert Arch", "A floral arch frames a desert pool with rolling hills beyond"],
  ["DSCF9873.jpg", "Matterhorn Autumn", "The Matterhorn towers above autumn larch trees and a Swiss flag"],
  ["0B47F8B4-42BF-47B2-B379-4CCAE66FEA3C-3055-000000A0213F7DA6.jpg", "Dolomite Window", "Dramatic Dolomite rock faces framed through a wooden cabin window"],
  ["0B7A28EC-0715-4653-B5C1-801923C6114C-19677-000003C295153013.jpg", "Ocean Sprint", "Two friends sprint into calm turquoise ocean water under cloudy skies"],
  ["1E460434-C510-4C21-A845-42C4C9DD7476-3055-0000009FF8099489.jpg", "Alpine Layers", "Snow-dusted alpine peaks rise above forested slopes in soft light"],
  ["374321F3-F6E9-4751-B2E6-0B4810492973-2176-00000063AE2DF3AF.jpg", "Teton Meadow", "Rugged Teton peaks rise behind a lush green alpine meadow under hazy skies"],
  ["6E283A92-7B29-43F2-8E44-3DED2BA8F95D-414-00000000F6613DCF.jpg", "Teton Sunset", "Purple and pink sunset sky over a mountain lake with rocky shoreline"],
  ["85148F7D-DFDB-4BD2-B9DB-C9FF7577725A-19677-000003C122D9065B.jpg", "Olive Shore", "Turquoise Mediterranean sea glimpsed through olive branches and rocky shore"],
  ["8A1375EA-ED2E-46EC-BCE1-C6A73B31AA1F-2176-000000632039C83C.jpg", "Teton Backcountry Camp", "A backcountry tent pitched among boulders beneath towering mountain peaks"],
  ["8DC70CF4-3836-4EA5-BCAC-B6FF3A3E9DB4-3055-0000009F47BF1BB6.jpg", "Trail Friends", "A group of friends lounging together on golden alpine grass"],
  ["A4774A00-ECE4-4BC8-B1C9-28C9CB3686FB-2176-000000636C437B69.jpg", "Starry Silhouette", "Silhouetted tree and mountain ridgeline under a starry night sky"],
  ["APC_0017.jpg", "Snowy Path", "A snowy park path flanked by red lampposts and frosted evergreen trees"],
  ["B2B11916-4B67-4C37-802C-5BCA464D16D5-3055-000000A017EDEFFD.jpg", "Dolomite Cable Car", "Autumn Dolomite cliffs rise above green meadows and a cable car line"],
  ["BA8F959B-7A51-48A2-A61C-9C6CB18ACFA4-3055-0000009FE697A1E5.jpg", "Golden Larches", "Golden autumn mountainside with larch trees overlooking layered alpine valleys"],
  ["C84BD74F-A13F-4231-9B69-BBCCF98FB0E0-2176-00000060910AB1B5.jpg", "Kayak Shore", "A kayaker rests on a lakeshore with towering mountains across the water"],
  ["D8A4D570-E089-425E-85D0-74099B3BC0F3-19677-000003C2AC0EADE1.jpg", "Island Aerial", "Aerial view of a Mediterranean island coastline with mountains and sea"],
  ["IMG_3186.JPG", "Sky Window", "Aerial sunset view of a coastal city through clouds from an airplane"],
];

function approximatePlace(title: string, description: string, index: number): ApproximatePlace {
  const clue = `${title} ${description}`.toLowerCase();
  const spread = (index % 9 - 4) * 0.004;
  const at = (name: string, region: string, lat: number, lng: number): ApproximatePlace => ({
    name,
    region,
    lat: Number((lat + spread).toFixed(5)),
    lng: Number((lng - spread * 1.4).toFixed(5)),
  });

  if (clue.includes("marrakech") || clue.includes("moroccan") || clue.includes("desert oasis") || clue.includes("desert arch")) return at("Marrakech, Morocco", "Marrakech-Safi, Morocco", 31.6295, -7.9811);
  if (clue.includes("matterhorn")) return at("Zermatt, Switzerland", "Valais, Switzerland", 45.9763, 7.6586);
  if (clue.includes("dolomite")) return at("Dolomites, Italy", "Trentino-Alto Adige, Italy", 46.5405, 12.1357);
  if (clue.includes("cefalu") || clue.includes("sicilian")) return at("Cefalù, Sicily", "Sicily, Italy", 38.038, 14.0229);
  if (clue.includes("portofino")) return at("Portofino, Italy", "Liguria, Italy", 44.303, 9.2094);
  if (clue.includes("ligurian") || clue.includes("genoa") || clue.includes("fiat on the coast")) return at("Genoa coast, Italy", "Liguria, Italy", 44.4056, 8.9463);
  if (clue.includes("lake como") || clue.includes("lake leap")) return at("Lake Como, Italy", "Lombardy, Italy", 46.016, 9.2572);
  if (clue.includes("torino") || clue.includes("river mirror")) return at("Turin, Italy", "Piedmont, Italy", 45.0703, 7.6869);
  if (clue.includes("italian alps") || clue.includes("alpine village") || clue.includes("alpine valley") || clue.includes("alpine panorama") || clue.includes("alpine layers") || clue.includes("golden larches") || clue.includes("trail friends")) return at("Aosta Valley, Italy", "Italian Alps", 45.7372, 7.3201);
  if (clue.includes("osaka")) return at("Osaka Castle, Japan", "Osaka, Japan", 34.6873, 135.5262);
  if (clue.includes("torii") || clue.includes("itsukushima")) return at("Miyajima, Japan", "Hiroshima, Japan", 34.2959, 132.3199);
  if (clue.includes("shibuya") || clue.includes("tokyo") || clue.includes("neon") || clue.includes("street racer")) return at("Tokyo, Japan", "Kantō, Japan", 35.6762, 139.6503);
  if (clue.includes("fuji")) return at("Lake Kawaguchi, Japan", "Yamanashi, Japan", 35.5171, 138.7518);
  if (clue.includes("golden gate") || clue.includes("bridge below")) return at("Golden Gate Bridge, California", "San Francisco, United States", 37.8199, -122.4783);
  if (clue.includes("teton") || clue.includes("kayak shore") || clue.includes("backcountry camp")) return at("Grand Teton National Park, Wyoming", "Wyoming, United States", 43.7904, -110.6818);
  if (clue.includes("great sand dunes") || clue.includes("dune trekkers") || clue.includes("lone dune") || clue.includes("climbing the dunes")) return at("Great Sand Dunes National Park, Colorado", "Colorado, United States", 37.7916, -105.5943);
  if (clue.includes("crested butte")) return at("Crested Butte, Colorado", "Colorado, United States", 38.8697, -106.9878);
  if (clue.includes("red rocks")) return at("Red Rocks Park, Colorado", "Colorado, United States", 39.6654, -105.2057);
  if (clue.includes("evans avenue") || clue.includes("street celebration") || clue.includes("phone glow") || clue.includes("rugby") || clue.includes("soccer") || clue.includes("goal celebration") || clue.includes("team spirit") || clue.includes("snowy campus") || clue.includes("snowy path")) return at("Denver, Colorado", "Colorado, United States", 39.6781, -104.9618);
  if (clue.includes("aspen")) return at("Aspen, Colorado", "Colorado, United States", 39.1911, -106.8175);
  if (clue.includes("mountain") || clue.includes("summit") || clue.includes("peak") || clue.includes("pine") || clue.includes("god rays") || clue.includes("starry") || clue.includes("night streak") || clue.includes("storm")) return at("Colorado High Rockies", "Colorado, United States", 39.1178, -106.4454);
  if (clue.includes("california") || clue.includes("pacific") || clue.includes("coast") || clue.includes("shore") || clue.includes("beach") || clue.includes("cliff") || clue.includes("cove") || clue.includes("lighthouse") || clue.includes("pelican") || clue.includes("harbor dusk") || clue.includes("kelp")) return at("Half Moon Bay, California", "California coast, United States", 37.4636, -122.4286);
  if (clue.includes("mediterranean") || clue.includes("island aerial") || clue.includes("ocean sprint") || clue.includes("olive shore")) return at("Sardinia, Italy", "Mediterranean Sea, Italy", 40.1209, 9.0129);
  if (clue.includes("greenhouse") || clue.includes("bicycle") || clue.includes("window light") || clue.includes("fire spinner")) return at("Denver, Colorado", "Colorado, United States", 39.7392, -104.9903);
  return at("Colorado Front Range", "Colorado, United States", 39.5501, -105.7821);
}

const SANTO_GALLERY_LOCATIONS: GameLocation[] = SANTO_GALLERY.map(([file, title, description], index) => ({
  id: `santo-explore-${String(index + 1).padStart(3, "0")}`,
  ...approximatePlace(title, description, index),
  imageUrl: `${SANTO_PRINTS}/${encodeURIComponent(file)}`,
  alt: description,
  credit: "Santo Fothergill",
  sourceUrl: SANTO_SOURCE,
  confidence: "estimated",
}));

// The gallery is first in the deck source so Santo's work is strongly represented.
// The summit portrait is a separate Santo photograph that is not duplicated in Explore.
export const GAME_LOCATIONS: GameLocation[] = [
  ...SANTO_GALLERY_LOCATIONS,
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
