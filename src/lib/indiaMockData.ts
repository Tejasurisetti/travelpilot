/**
 * TravelPilot — India Mock Dataset
 * Covers 10 state capital cities across India, priced in INR (₹).
 *
 * Schema notes:
 * - PlaceCatalogItem represents a reusable catalog entry (not a scheduled
 *   TripItem yet). planner.ts should convert these into TripItems by
 *   assigning startTime/endTime when building a specific day, using
 *   `visitDurationMinutes` and `openingHours` as constraints.
 * - Coordinates are real approximate landmark locations.
 * - All costs are in whole INR (no decimals), representing a reasonable
 *   blended per-person estimate.
 * - `cluster` groups places for clusterByLocation() — clusters are named
 *   per city and referenced by TransportOption's fromCluster/toCluster.
 */

export type PlaceCategory =
  | "sightseeing"
  | "food"
  | "museum"
  | "outdoor"
  | "nightlife";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceCatalogItem {
  id: string;
  type: "activity";
  category: PlaceCategory;
  name: string;
  location: LatLng;
  cost: number; // INR, per person estimate
  openingHours: string; // "HH:mm-HH:mm" or "24hours" or multi-slot "HH:mm-HH:mm,HH:mm-HH:mm"
  visitDurationMinutes: number;
  cluster: string;
  notes: string;
}

export interface AccommodationOption {
  id: string;
  type: "accommodation";
  tier: "budget" | "mid" | "premium";
  name: string;
  location: LatLng;
  costPerNight: number; // INR
  notes: string;
}

export interface TransportOption {
  id: string;
  type: "transport";
  mode: "auto" | "cab" | "metro" | "bus" | "ferry" | "walk" | "shared-taxi" | "bike-rental";
  fromCluster: string;
  toCluster: string;
  cost: number; // INR
  durationMinutes: number;
  notes: string;
}

export interface CityDataset {
  name: string;
  state: string;
  center: LatLng;
  clusters: string[];
  places: PlaceCatalogItem[];
  accommodation: AccommodationOption[];
  transport: TransportOption[];
}

// ---------------------------------------------------------------------------
// 1. JAIPUR (Rajasthan)
// ---------------------------------------------------------------------------
const jaipur: CityDataset = {
  name: "Jaipur",
  state: "Rajasthan",
  center: { lat: 26.9124, lng: 75.7873 },
  clusters: ["Old City", "Amber-Nahargarh", "New Jaipur"],
  places: [
    { id: "jai-hawamahal", type: "activity", category: "sightseeing", name: "Hawa Mahal", location: { lat: 26.9239, lng: 75.8267 }, cost: 50, openingHours: "09:00-16:30", visitDurationMinutes: 45, cluster: "Old City", notes: "Iconic pink sandstone facade, best viewed from across the street early morning." },
    { id: "jai-citypalace", type: "activity", category: "sightseeing", name: "City Palace", location: { lat: 26.9258, lng: 75.8237 }, cost: 300, openingHours: "09:30-17:00", visitDurationMinutes: 90, cluster: "Old City", notes: "Royal residence with courtyards and a textile/armoury museum." },
    { id: "jai-jantarmantar", type: "activity", category: "museum", name: "Jantar Mantar", location: { lat: 26.9246, lng: 75.8247 }, cost: 50, openingHours: "09:00-16:30", visitDurationMinutes: 60, cluster: "Old City", notes: "UNESCO-listed astronomical instruments." },
    { id: "jai-johari", type: "activity", category: "food", name: "Johari Bazaar", location: { lat: 26.9214, lng: 75.8267 }, cost: 300, openingHours: "10:00-21:00", visitDurationMinutes: 90, cluster: "Old City", notes: "Jewellery and street food market." },
    { id: "jai-amberfort", type: "activity", category: "sightseeing", name: "Amber Fort", location: { lat: 26.9855, lng: 75.8513 }, cost: 500, openingHours: "08:00-17:30", visitDurationMinutes: 150, cluster: "Amber-Nahargarh", notes: "Hilltop fort-palace, allow extra time for the walk up." },
    { id: "jai-nahargarh", type: "activity", category: "outdoor", name: "Nahargarh Fort", location: { lat: 26.9373, lng: 75.8154 }, cost: 200, openingHours: "10:00-18:30", visitDurationMinutes: 90, cluster: "Amber-Nahargarh", notes: "Sunset viewpoint over the city." },
    { id: "jai-jalmahal", type: "activity", category: "sightseeing", name: "Jal Mahal", location: { lat: 26.9537, lng: 75.8465 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 30, cluster: "Amber-Nahargarh", notes: "Photo stop, palace viewed from the lakeside only." },
    { id: "jai-chokhidhani", type: "activity", category: "nightlife", name: "Chokhi Dhani", location: { lat: 26.7900, lng: 75.7550 }, cost: 900, openingHours: "17:00-23:00", visitDurationMinutes: 180, cluster: "New Jaipur", notes: "Rajasthani village-themed dinner and folk performances." },
    { id: "jai-alberthall", type: "activity", category: "museum", name: "Albert Hall Museum", location: { lat: 26.9114, lng: 75.8189 }, cost: 150, openingHours: "09:00-17:00", visitDurationMinutes: 75, cluster: "New Jaipur", notes: "Oldest museum in Rajasthan, Indo-Saracenic architecture." },
    { id: "jai-centralpark", type: "activity", category: "outdoor", name: "Central Park", location: { lat: 26.8993, lng: 75.8038 }, cost: 0, openingHours: "05:00-20:00", visitDurationMinutes: 60, cluster: "New Jaipur", notes: "Large green space with a musical fountain." },
  ],
  accommodation: [
    { id: "jai-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Jaipur", location: { lat: 26.9050, lng: 75.8200 }, costPerNight: 900, notes: "Hostel with dorms and private rooms." },
    { id: "jai-acc-mid", type: "accommodation", tier: "mid", name: "Ibis Jaipur City", location: { lat: 26.9020, lng: 75.7900 }, costPerNight: 3800, notes: "Modern mid-range hotel." },
    { id: "jai-acc-premium", type: "accommodation", tier: "premium", name: "Rambagh Palace", location: { lat: 26.8970, lng: 75.8130 }, costPerNight: 18000, notes: "Former royal residence, luxury heritage stay." },
  ],
  transport: [
    { id: "jai-t1", type: "transport", mode: "auto", fromCluster: "Old City", toCluster: "Amber-Nahargarh", cost: 250, durationMinutes: 35, notes: "Auto-rickshaw, traffic-dependent." },
    { id: "jai-t2", type: "transport", mode: "cab", fromCluster: "Old City", toCluster: "New Jaipur", cost: 200, durationMinutes: 20, notes: "App-based cab." },
    { id: "jai-t3", type: "transport", mode: "cab", fromCluster: "Amber-Nahargarh", toCluster: "New Jaipur", cost: 350, durationMinutes: 40, notes: "Longer cross-city trip." },
    { id: "jai-t4", type: "transport", mode: "auto", fromCluster: "Old City", toCluster: "Old City", cost: 60, durationMinutes: 10, notes: "Short hop within Old City." },
  ],
};

// ---------------------------------------------------------------------------
// 2. DELHI (NCT of Delhi)
// ---------------------------------------------------------------------------
const delhi: CityDataset = {
  name: "Delhi",
  state: "NCT of Delhi",
  center: { lat: 28.6139, lng: 77.2090 },
  clusters: ["Old Delhi", "Central Delhi", "South Delhi"],
  places: [
    { id: "del-redfort", type: "activity", category: "sightseeing", name: "Red Fort", location: { lat: 28.6562, lng: 77.2410 }, cost: 550, openingHours: "09:30-16:30", visitDurationMinutes: 90, cluster: "Old Delhi", notes: "Closed Mondays. Mughal-era fortress." },
    { id: "del-jamamasjid", type: "activity", category: "sightseeing", name: "Jama Masjid", location: { lat: 28.6507, lng: 77.2334 }, cost: 300, openingHours: "07:00-12:00,13:30-18:30", visitDurationMinutes: 45, cluster: "Old Delhi", notes: "Camera fee applies; modest dress required." },
    { id: "del-chandnichowk", type: "activity", category: "food", name: "Chandni Chowk", location: { lat: 28.6506, lng: 77.2303 }, cost: 400, openingHours: "10:00-21:00", visitDurationMinutes: 90, cluster: "Old Delhi", notes: "Historic market lane, street food hub." },
    { id: "del-indiagate", type: "activity", category: "sightseeing", name: "India Gate", location: { lat: 28.6129, lng: 77.2295 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 45, cluster: "Central Delhi", notes: "War memorial, popular evening spot." },
    { id: "del-natmuseum", type: "activity", category: "museum", name: "National Museum", location: { lat: 28.6117, lng: 77.2194 }, cost: 200, openingHours: "10:00-18:00", visitDurationMinutes: 90, cluster: "Central Delhi", notes: "Closed Mondays." },
    { id: "del-humayun", type: "activity", category: "sightseeing", name: "Humayun's Tomb", location: { lat: 28.5933, lng: 77.2507 }, cost: 600, openingHours: "06:00-18:00", visitDurationMinutes: 75, cluster: "Central Delhi", notes: "UNESCO site, precursor to the Taj Mahal design." },
    { id: "del-lodhigarden", type: "activity", category: "outdoor", name: "Lodhi Garden", location: { lat: 28.5931, lng: 77.2197 }, cost: 0, openingHours: "06:00-20:00", visitDurationMinutes: 60, cluster: "Central Delhi", notes: "15th-century tombs set in a park." },
    { id: "del-qutubminar", type: "activity", category: "sightseeing", name: "Qutub Minar", location: { lat: 28.5245, lng: 77.1855 }, cost: 600, openingHours: "07:00-17:00", visitDurationMinutes: 75, cluster: "South Delhi", notes: "Tallest brick minaret in the world." },
    { id: "del-hauzkhas", type: "activity", category: "nightlife", name: "Hauz Khas Village", location: { lat: 28.5535, lng: 77.1948 }, cost: 800, openingHours: "12:00-23:30", visitDurationMinutes: 120, cluster: "South Delhi", notes: "Cafes, bars, and a medieval reservoir/ruins." },
    { id: "del-lotustemple", type: "activity", category: "sightseeing", name: "Lotus Temple", location: { lat: 28.5535, lng: 77.2588 }, cost: 0, openingHours: "09:00-17:30", visitDurationMinutes: 45, cluster: "South Delhi", notes: "Bahá'í House of Worship, lotus-shaped architecture." },
  ],
  accommodation: [
    { id: "del-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Delhi", location: { lat: 28.6500, lng: 77.2300 }, costPerNight: 950, notes: "Central hostel near Old Delhi." },
    { id: "del-acc-mid", type: "accommodation", tier: "mid", name: "Bloom Rooms Connaught Place", location: { lat: 28.6300, lng: 77.2200 }, costPerNight: 4200, notes: "Boutique mid-range near CP." },
    { id: "del-acc-premium", type: "accommodation", tier: "premium", name: "The Imperial New Delhi", location: { lat: 28.6258, lng: 77.2183 }, costPerNight: 22000, notes: "Colonial-era luxury hotel." },
  ],
  transport: [
    { id: "del-t1", type: "transport", mode: "metro", fromCluster: "Old Delhi", toCluster: "Central Delhi", cost: 40, durationMinutes: 25, notes: "Delhi Metro, avoids traffic." },
    { id: "del-t2", type: "transport", mode: "metro", fromCluster: "Central Delhi", toCluster: "South Delhi", cost: 50, durationMinutes: 30, notes: "Delhi Metro." },
    { id: "del-t3", type: "transport", mode: "cab", fromCluster: "Old Delhi", toCluster: "South Delhi", cost: 450, durationMinutes: 50, notes: "Cross-city cab, longer in peak traffic." },
    { id: "del-t4", type: "transport", mode: "auto", fromCluster: "Central Delhi", toCluster: "Central Delhi", cost: 150, durationMinutes: 15, notes: "Short local hop." },
  ],
};

// ---------------------------------------------------------------------------
// 3. MUMBAI (Maharashtra)
// ---------------------------------------------------------------------------
const mumbai: CityDataset = {
  name: "Mumbai",
  state: "Maharashtra",
  center: { lat: 19.0760, lng: 72.8777 },
  clusters: ["South Mumbai", "Bandra-Juhu", "Central Mumbai"],
  places: [
    { id: "mum-gateway", type: "activity", category: "sightseeing", name: "Gateway of India", location: { lat: 18.9220, lng: 72.8347 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 45, cluster: "South Mumbai", notes: "Iconic waterfront arch monument." },
    { id: "mum-elephanta", type: "activity", category: "sightseeing", name: "Elephanta Caves", location: { lat: 18.9633, lng: 72.9315 }, cost: 600, openingHours: "09:00-17:00", visitDurationMinutes: 180, cluster: "South Mumbai", notes: "Ferry from Gateway of India included; closed Mondays." },
    { id: "mum-cst", type: "activity", category: "sightseeing", name: "Chhatrapati Shivaji Terminus", location: { lat: 18.9398, lng: 72.8355 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 30, cluster: "South Mumbai", notes: "UNESCO-listed Victorian Gothic railway station." },
    { id: "mum-colaba", type: "activity", category: "food", name: "Colaba Causeway", location: { lat: 18.9067, lng: 72.8147 }, cost: 500, openingHours: "10:00-22:00", visitDurationMinutes: 90, cluster: "South Mumbai", notes: "Street shopping and cafes." },
    { id: "mum-marinedrive", type: "activity", category: "outdoor", name: "Marine Drive", location: { lat: 18.9440, lng: 72.8235 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 60, cluster: "South Mumbai", notes: "Seafront promenade, best at sunset." },
    { id: "mum-csmvs", type: "activity", category: "museum", name: "CSMVS Museum", location: { lat: 18.9269, lng: 72.8328 }, cost: 300, openingHours: "10:15-18:00", visitDurationMinutes: 90, cluster: "South Mumbai", notes: "Formerly Prince of Wales Museum." },
    { id: "mum-juhu", type: "activity", category: "outdoor", name: "Juhu Beach", location: { lat: 19.0990, lng: 72.8265 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 90, cluster: "Bandra-Juhu", notes: "Popular beach with street food stalls." },
    { id: "mum-sealink", type: "activity", category: "sightseeing", name: "Bandra-Worli Sea Link Viewpoint", location: { lat: 19.0176, lng: 72.8202 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 30, cluster: "Bandra-Juhu", notes: "Best viewed from Bandra Fort or Worli seaface." },
    { id: "mum-linkingroad", type: "activity", category: "nightlife", name: "Linking Road", location: { lat: 19.0596, lng: 72.8295 }, cost: 700, openingHours: "11:00-23:00", visitDurationMinutes: 120, cluster: "Bandra-Juhu", notes: "Shopping and nightlife strip." },
    { id: "mum-siddhivinayak", type: "activity", category: "sightseeing", name: "Siddhivinayak Temple", location: { lat: 19.0170, lng: 72.8302 }, cost: 0, openingHours: "05:30-21:50", visitDurationMinutes: 45, cluster: "Central Mumbai", notes: "One of Mumbai's most visited temples." },
  ],
  accommodation: [
    { id: "mum-acc-budget", type: "accommodation", tier: "budget", name: "Backpacker Panda Colaba", location: { lat: 18.9100, lng: 72.8200 }, costPerNight: 1100, notes: "Budget stay in South Mumbai." },
    { id: "mum-acc-mid", type: "accommodation", tier: "mid", name: "Ginger Mumbai", location: { lat: 19.0200, lng: 72.8400 }, costPerNight: 4500, notes: "Reliable mid-range chain hotel." },
    { id: "mum-acc-premium", type: "accommodation", tier: "premium", name: "Taj Mahal Palace", location: { lat: 18.9217, lng: 72.8332 }, costPerNight: 25000, notes: "Iconic luxury heritage hotel." },
  ],
  transport: [
    { id: "mum-t1", type: "transport", mode: "cab", fromCluster: "South Mumbai", toCluster: "Bandra-Juhu", cost: 400, durationMinutes: 40, notes: "Via Sea Link, traffic-dependent." },
    { id: "mum-t2", type: "transport", mode: "metro", fromCluster: "South Mumbai", toCluster: "Central Mumbai", cost: 20, durationMinutes: 25, notes: "Local train, fastest option." },
    { id: "mum-t3", type: "transport", mode: "ferry", fromCluster: "South Mumbai", toCluster: "South Mumbai", cost: 0, durationMinutes: 60, notes: "Ferry to Elephanta Caves, cost included in ticket." },
    { id: "mum-t4", type: "transport", mode: "auto", fromCluster: "Bandra-Juhu", toCluster: "Bandra-Juhu", cost: 150, durationMinutes: 15, notes: "Short local hop." },
  ],
};

// ---------------------------------------------------------------------------
// 4. BENGALURU (Karnataka)
// ---------------------------------------------------------------------------
const bengaluru: CityDataset = {
  name: "Bengaluru",
  state: "Karnataka",
  center: { lat: 12.9716, lng: 77.5946 },
  clusters: ["Central Bengaluru", "North Bengaluru", "South Bengaluru"],
  places: [
    { id: "blr-lalbagh", type: "activity", category: "outdoor", name: "Lalbagh Botanical Garden", location: { lat: 12.9507, lng: 77.5848 }, cost: 30, openingHours: "06:00-19:00", visitDurationMinutes: 90, cluster: "South Bengaluru", notes: "200-year-old botanical garden with a glasshouse." },
    { id: "blr-palace", type: "activity", category: "sightseeing", name: "Bangalore Palace", location: { lat: 12.9987, lng: 77.5920 }, cost: 230, openingHours: "10:00-17:30", visitDurationMinutes: 75, cluster: "North Bengaluru", notes: "Tudor-style royal residence." },
    { id: "blr-cubbon", type: "activity", category: "outdoor", name: "Cubbon Park", location: { lat: 12.9763, lng: 77.5929 }, cost: 0, openingHours: "06:00-18:00", visitDurationMinutes: 60, cluster: "Central Bengaluru", notes: "Large central green space." },
    { id: "blr-iskcon", type: "activity", category: "sightseeing", name: "ISKCON Temple", location: { lat: 13.0098, lng: 77.5511 }, cost: 0, openingHours: "07:00-13:00,16:00-20:30", visitDurationMinutes: 60, cluster: "North Bengaluru", notes: "Large modern temple complex." },
    { id: "blr-mgroad", type: "activity", category: "food", name: "MG Road", location: { lat: 12.9757, lng: 77.6068 }, cost: 600, openingHours: "11:00-23:30", visitDurationMinutes: 120, cluster: "Central Bengaluru", notes: "Shopping and dining strip." },
    { id: "blr-vidhana", type: "activity", category: "sightseeing", name: "Vidhana Soudha", location: { lat: 12.9794, lng: 77.5912 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 20, cluster: "Central Bengaluru", notes: "Legislative building, exterior viewing only." },
    { id: "blr-govmuseum", type: "activity", category: "museum", name: "Government Museum", location: { lat: 12.9758, lng: 77.5952 }, cost: 20, openingHours: "10:00-17:00", visitDurationMinutes: 60, cluster: "Central Bengaluru", notes: "One of the oldest museums in India." },
    { id: "blr-nandihills", type: "activity", category: "outdoor", name: "Nandi Hills", location: { lat: 13.3702, lng: 77.6835 }, cost: 80, openingHours: "06:00-18:00", visitDurationMinutes: 180, cluster: "North Bengaluru", notes: "Popular sunrise day-trip hill station, ~60km from city." },
    { id: "blr-indiranagar", type: "activity", category: "nightlife", name: "Indiranagar 100 Feet Road", location: { lat: 12.9719, lng: 77.6412 }, cost: 900, openingHours: "12:00-23:30", visitDurationMinutes: 120, cluster: "Central Bengaluru", notes: "Bars and pubs district." },
    { id: "blr-bannerghatta", type: "activity", category: "outdoor", name: "Bannerghatta National Park", location: { lat: 12.8003, lng: 77.5769 }, cost: 300, openingHours: "09:30-17:00", visitDurationMinutes: 150, cluster: "South Bengaluru", notes: "Zoo, safari, and butterfly park." },
  ],
  accommodation: [
    { id: "blr-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Bengaluru", location: { lat: 12.9700, lng: 77.5900 }, costPerNight: 850, notes: "Popular hostel in Central Bengaluru." },
    { id: "blr-acc-mid", type: "accommodation", tier: "mid", name: "Treebo Trend", location: { lat: 12.9800, lng: 77.6000 }, costPerNight: 3200, notes: "Budget-friendly branded hotel." },
    { id: "blr-acc-premium", type: "accommodation", tier: "premium", name: "The Leela Palace Bengaluru", location: { lat: 12.9611, lng: 77.6499 }, costPerNight: 16000, notes: "Luxury palace-style hotel." },
  ],
  transport: [
    { id: "blr-t1", type: "transport", mode: "metro", fromCluster: "Central Bengaluru", toCluster: "North Bengaluru", cost: 45, durationMinutes: 30, notes: "Namma Metro." },
    { id: "blr-t2", type: "transport", mode: "metro", fromCluster: "Central Bengaluru", toCluster: "South Bengaluru", cost: 40, durationMinutes: 25, notes: "Namma Metro." },
    { id: "blr-t3", type: "transport", mode: "cab", fromCluster: "North Bengaluru", toCluster: "North Bengaluru", cost: 1500, durationMinutes: 90, notes: "Round-trip cab for Nandi Hills day trip." },
    { id: "blr-t4", type: "transport", mode: "auto", fromCluster: "Central Bengaluru", toCluster: "Central Bengaluru", cost: 120, durationMinutes: 15, notes: "Short local hop." },
  ],
};

// ---------------------------------------------------------------------------
// 5. CHENNAI (Tamil Nadu)
// ---------------------------------------------------------------------------
const chennai: CityDataset = {
  name: "Chennai",
  state: "Tamil Nadu",
  center: { lat: 13.0827, lng: 80.2707 },
  clusters: ["North Chennai", "Central Chennai", "South Chennai"],
  places: [
    { id: "che-marina", type: "activity", category: "outdoor", name: "Marina Beach", location: { lat: 13.0500, lng: 80.2824 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 90, cluster: "Central Chennai", notes: "One of the longest urban beaches in the world." },
    { id: "che-kapaleeshwarar", type: "activity", category: "sightseeing", name: "Kapaleeshwarar Temple", location: { lat: 13.0338, lng: 80.2695 }, cost: 0, openingHours: "05:00-12:30,16:00-21:30", visitDurationMinutes: 60, cluster: "Central Chennai", notes: "Dravidian-style temple in Mylapore." },
    { id: "che-fortstgeorge", type: "activity", category: "museum", name: "Fort St George", location: { lat: 13.0797, lng: 80.2870 }, cost: 100, openingHours: "09:00-17:00", visitDurationMinutes: 75, cluster: "North Chennai", notes: "First English fortress in India, with a museum." },
    { id: "che-govmuseum", type: "activity", category: "museum", name: "Government Museum", location: { lat: 13.0693, lng: 80.2578 }, cost: 250, openingHours: "09:30-17:00", visitDurationMinutes: 90, cluster: "Central Chennai", notes: "Closed Fridays. Bronze gallery is a highlight." },
    { id: "che-santhome", type: "activity", category: "sightseeing", name: "San Thome Basilica", location: { lat: 13.0336, lng: 80.2777 }, cost: 0, openingHours: "06:00-18:30", visitDurationMinutes: 45, cluster: "Central Chennai", notes: "Built over the tomb of St. Thomas the Apostle." },
    { id: "che-elliots", type: "activity", category: "outdoor", name: "Elliot's Beach", location: { lat: 12.9987, lng: 80.2707 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 60, cluster: "South Chennai", notes: "Quieter beach in Besant Nagar." },
    { id: "che-mahabalipuram", type: "activity", category: "sightseeing", name: "Mahabalipuram Shore Temple", location: { lat: 12.6208, lng: 80.1982 }, cost: 600, openingHours: "06:00-18:00", visitDurationMinutes: 150, cluster: "South Chennai", notes: "UNESCO site, ~55km day trip from the city." },
    { id: "che-expressavenue", type: "activity", category: "nightlife", name: "Express Avenue", location: { lat: 13.0603, lng: 80.2497 }, cost: 700, openingHours: "11:00-23:00", visitDurationMinutes: 120, cluster: "Central Chennai", notes: "Mall with dining and entertainment." },
    { id: "che-vivekananda", type: "activity", category: "museum", name: "Vivekananda House", location: { lat: 13.0475, lng: 80.2793 }, cost: 20, openingHours: "10:00-17:00", visitDurationMinutes: 45, cluster: "Central Chennai", notes: "Small heritage museum on the seafront." },
    { id: "che-semmozhi", type: "activity", category: "outdoor", name: "Semmozhi Poonga", location: { lat: 13.0569, lng: 80.2530 }, cost: 30, openingHours: "10:00-19:30", visitDurationMinutes: 60, cluster: "Central Chennai", notes: "Botanical garden near Cathedral Road." },
  ],
  accommodation: [
    { id: "che-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Chennai", location: { lat: 13.0500, lng: 80.2400 }, costPerNight: 900, notes: "Budget hostel option." },
    { id: "che-acc-mid", type: "accommodation", tier: "mid", name: "Ginger Chennai", location: { lat: 13.0600, lng: 80.2500 }, costPerNight: 3600, notes: "Reliable mid-range chain hotel." },
    { id: "che-acc-premium", type: "accommodation", tier: "premium", name: "ITC Grand Chola", location: { lat: 13.0106, lng: 80.2216 }, costPerNight: 15000, notes: "Large luxury hotel inspired by Chola architecture." },
  ],
  transport: [
    { id: "che-t1", type: "transport", mode: "metro", fromCluster: "North Chennai", toCluster: "Central Chennai", cost: 35, durationMinutes: 20, notes: "Chennai Metro." },
    { id: "che-t2", type: "transport", mode: "cab", fromCluster: "Central Chennai", toCluster: "South Chennai", cost: 1800, durationMinutes: 90, notes: "Round-trip for Mahabalipuram day trip." },
    { id: "che-t3", type: "transport", mode: "auto", fromCluster: "Central Chennai", toCluster: "Central Chennai", cost: 150, durationMinutes: 15, notes: "Short local hop." },
    { id: "che-t4", type: "transport", mode: "bus", fromCluster: "Central Chennai", toCluster: "South Chennai", cost: 25, durationMinutes: 30, notes: "City bus to Besant Nagar." },
  ],
};

// ---------------------------------------------------------------------------
// 6. KOLKATA (West Bengal)
// ---------------------------------------------------------------------------
const kolkata: CityDataset = {
  name: "Kolkata",
  state: "West Bengal",
  center: { lat: 22.5726, lng: 88.3639 },
  clusters: ["Central Kolkata", "North Kolkata", "South Kolkata"],
  places: [
    { id: "kol-victoria", type: "activity", category: "sightseeing", name: "Victoria Memorial", location: { lat: 22.5448, lng: 88.3426 }, cost: 200, openingHours: "10:00-18:00", visitDurationMinutes: 90, cluster: "Central Kolkata", notes: "Marble monument and museum, closed Mondays." },
    { id: "kol-howrahbridge", type: "activity", category: "sightseeing", name: "Howrah Bridge", location: { lat: 22.5851, lng: 88.3468 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 30, cluster: "North Kolkata", notes: "Iconic cantilever bridge, best viewed at dusk." },
    { id: "kol-indianmuseum", type: "activity", category: "museum", name: "Indian Museum", location: { lat: 22.5580, lng: 88.3512 }, cost: 150, openingHours: "10:00-17:00", visitDurationMinutes: 90, cluster: "Central Kolkata", notes: "Oldest and largest museum in India, closed Mondays." },
    { id: "kol-parkstreet", type: "activity", category: "food", name: "Park Street", location: { lat: 22.5527, lng: 88.3529 }, cost: 700, openingHours: "11:00-23:30", visitDurationMinutes: 120, cluster: "Central Kolkata", notes: "Historic dining and nightlife strip." },
    { id: "kol-dakshineswar", type: "activity", category: "sightseeing", name: "Dakshineswar Kali Temple", location: { lat: 22.6547, lng: 88.3576 }, cost: 0, openingHours: "06:00-12:30,15:00-20:30", visitDurationMinutes: 60, cluster: "North Kolkata", notes: "Riverside temple complex." },
    { id: "kol-belurmath", type: "activity", category: "sightseeing", name: "Belur Math", location: { lat: 22.6316, lng: 88.3554 }, cost: 0, openingHours: "06:30-12:00,16:00-19:00", visitDurationMinutes: 60, cluster: "North Kolkata", notes: "Headquarters of the Ramakrishna Mission." },
    { id: "kol-collegestreet", type: "activity", category: "food", name: "College Street", location: { lat: 22.5731, lng: 88.3639 }, cost: 300, openingHours: "10:00-20:00", visitDurationMinutes: 90, cluster: "North Kolkata", notes: "Famous book market and Indian Coffee House." },
    { id: "kol-ecopark", type: "activity", category: "outdoor", name: "Eco Park", location: { lat: 22.6127, lng: 88.4633 }, cost: 40, openingHours: "12:00-20:00", visitDurationMinutes: 120, cluster: "South Kolkata", notes: "Large urban park with a lake." },
    { id: "kol-southcity", type: "activity", category: "nightlife", name: "South City / Jodhpur Park area", location: { lat: 22.5024, lng: 88.3617 }, cost: 800, openingHours: "11:00-23:00", visitDurationMinutes: 120, cluster: "South Kolkata", notes: "Malls, cafes, and lounges." },
    { id: "kol-kalighat", type: "activity", category: "sightseeing", name: "Kalighat Kali Temple", location: { lat: 22.5205, lng: 88.3426 }, cost: 0, openingHours: "05:00-14:00,16:30-22:00", visitDurationMinutes: 45, cluster: "South Kolkata", notes: "One of the 51 Shakti Peethas." },
  ],
  accommodation: [
    { id: "kol-acc-budget", type: "accommodation", tier: "budget", name: "Backpackers Kolkata", location: { lat: 22.5500, lng: 88.3500 }, costPerNight: 900, notes: "Central budget hostel." },
    { id: "kol-acc-mid", type: "accommodation", tier: "mid", name: "Lytton Hotel", location: { lat: 22.5605, lng: 88.3517 }, costPerNight: 3500, notes: "Heritage mid-range hotel near Park Street." },
    { id: "kol-acc-premium", type: "accommodation", tier: "premium", name: "The Oberoi Grand", location: { lat: 22.5626, lng: 88.3502 }, costPerNight: 14000, notes: "Colonial-era luxury landmark hotel." },
  ],
  transport: [
    { id: "kol-t1", type: "transport", mode: "metro", fromCluster: "Central Kolkata", toCluster: "North Kolkata", cost: 30, durationMinutes: 25, notes: "Kolkata Metro." },
    { id: "kol-t2", type: "transport", mode: "metro", fromCluster: "Central Kolkata", toCluster: "South Kolkata", cost: 30, durationMinutes: 20, notes: "Kolkata Metro." },
    { id: "kol-t3", type: "transport", mode: "cab", fromCluster: "North Kolkata", toCluster: "South Kolkata", cost: 400, durationMinutes: 45, notes: "Cross-city cab." },
    { id: "kol-t4", type: "transport", mode: "walk", fromCluster: "Central Kolkata", toCluster: "Central Kolkata", cost: 0, durationMinutes: 15, notes: "Walkable within central area." },
  ],
};

// ---------------------------------------------------------------------------
// 7. HYDERABAD (Telangana)
// ---------------------------------------------------------------------------
const hyderabad: CityDataset = {
  name: "Hyderabad",
  state: "Telangana",
  center: { lat: 17.3850, lng: 78.4867 },
  clusters: ["Old City", "Central Hyderabad", "Hitech-Banjara"],
  places: [
    { id: "hyd-charminar", type: "activity", category: "sightseeing", name: "Charminar", location: { lat: 17.3616, lng: 78.4747 }, cost: 50, openingHours: "09:30-17:30", visitDurationMinutes: 60, cluster: "Old City", notes: "16th-century monument and mosque." },
    { id: "hyd-golconda", type: "activity", category: "sightseeing", name: "Golconda Fort", location: { lat: 17.3833, lng: 78.4011 }, cost: 200, openingHours: "09:00-17:30", visitDurationMinutes: 120, cluster: "Old City", notes: "Sound and light show available in the evening." },
    { id: "hyd-laadbazaar", type: "activity", category: "food", name: "Laad Bazaar", location: { lat: 17.3604, lng: 78.4736 }, cost: 400, openingHours: "11:00-22:00", visitDurationMinutes: 90, cluster: "Old City", notes: "Famous for bangles and pearls." },
    { id: "hyd-meccamasjid", type: "activity", category: "sightseeing", name: "Mecca Masjid", location: { lat: 17.3604, lng: 78.4737 }, cost: 0, openingHours: "04:00-21:00", visitDurationMinutes: 30, cluster: "Old City", notes: "One of the largest mosques in India." },
    { id: "hyd-salarjung", type: "activity", category: "museum", name: "Salar Jung Museum", location: { lat: 17.3712, lng: 78.4805 }, cost: 150, openingHours: "10:00-17:00", visitDurationMinutes: 90, cluster: "Old City", notes: "One of the largest one-man art collections in the world." },
    { id: "hyd-hussainsagar", type: "activity", category: "outdoor", name: "Hussain Sagar Lake", location: { lat: 17.4239, lng: 78.4738 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 60, cluster: "Central Hyderabad", notes: "Boating available to the Buddha statue." },
    { id: "hyd-birlamandir", type: "activity", category: "sightseeing", name: "Birla Mandir", location: { lat: 17.4062, lng: 78.4691 }, cost: 0, openingHours: "07:00-12:00,15:00-21:00", visitDurationMinutes: 45, cluster: "Central Hyderabad", notes: "White marble temple on a hilltop." },
    { id: "hyd-ramoji", type: "activity", category: "outdoor", name: "Ramoji Film City", location: { lat: 17.2543, lng: 78.6808 }, cost: 1200, openingHours: "09:00-17:30", visitDurationMinutes: 240, cluster: "Hitech-Banjara", notes: "Large film studio and theme park, ~25km from center." },
    { id: "hyd-necklaceroad", type: "activity", category: "nightlife", name: "Necklace Road", location: { lat: 17.4239, lng: 78.4636 }, cost: 700, openingHours: "17:00-23:30", visitDurationMinutes: 120, cluster: "Central Hyderabad", notes: "Lakeside promenade with food stalls." },
    { id: "hyd-banjarahills", type: "activity", category: "nightlife", name: "Banjara Hills", location: { lat: 17.4156, lng: 78.4347 }, cost: 800, openingHours: "12:00-23:30", visitDurationMinutes: 120, cluster: "Hitech-Banjara", notes: "Upscale dining and nightlife area." },
  ],
  accommodation: [
    { id: "hyd-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Hyderabad", location: { lat: 17.4000, lng: 78.4700 }, costPerNight: 850, notes: "Popular budget hostel." },
    { id: "hyd-acc-mid", type: "accommodation", tier: "mid", name: "Ginger Hyderabad", location: { lat: 17.4100, lng: 78.4500 }, costPerNight: 3400, notes: "Reliable mid-range chain hotel." },
    { id: "hyd-acc-premium", type: "accommodation", tier: "premium", name: "Taj Falaknuma Palace", location: { lat: 17.3286, lng: 78.4723 }, costPerNight: 20000, notes: "Former Nizam's palace, hilltop luxury stay." },
  ],
  transport: [
    { id: "hyd-t1", type: "transport", mode: "metro", fromCluster: "Old City", toCluster: "Central Hyderabad", cost: 35, durationMinutes: 25, notes: "Hyderabad Metro." },
    { id: "hyd-t2", type: "transport", mode: "metro", fromCluster: "Central Hyderabad", toCluster: "Hitech-Banjara", cost: 40, durationMinutes: 30, notes: "Hyderabad Metro." },
    { id: "hyd-t3", type: "transport", mode: "cab", fromCluster: "Old City", toCluster: "Hitech-Banjara", cost: 900, durationMinutes: 60, notes: "Round-trip for Ramoji Film City day trip." },
    { id: "hyd-t4", type: "transport", mode: "auto", fromCluster: "Old City", toCluster: "Old City", cost: 130, durationMinutes: 15, notes: "Short local hop." },
  ],
};

// ---------------------------------------------------------------------------
// 8. THIRUVANANTHAPURAM (Kerala)
// ---------------------------------------------------------------------------
const thiruvananthapuram: CityDataset = {
  name: "Thiruvananthapuram",
  state: "Kerala",
  center: { lat: 8.5241, lng: 76.9366 },
  clusters: ["City Center", "Kovalam Coast"],
  places: [
    { id: "trv-padmanabhaswamy", type: "activity", category: "sightseeing", name: "Padmanabhaswamy Temple", location: { lat: 8.4827, lng: 76.9436 }, cost: 0, openingHours: "03:30-12:00,17:00-19:30", visitDurationMinutes: 60, cluster: "City Center", notes: "Strict traditional dress code enforced." },
    { id: "trv-napiermuseum", type: "activity", category: "museum", name: "Napier Museum", location: { lat: 8.5074, lng: 76.9573 }, cost: 20, openingHours: "10:00-17:00", visitDurationMinutes: 75, cluster: "City Center", notes: "Indo-Saracenic architecture, closed Mondays." },
    { id: "trv-kuthiramalika", type: "activity", category: "sightseeing", name: "Kuthira Malika Palace", location: { lat: 8.4816, lng: 76.9438 }, cost: 30, openingHours: "08:30-13:00,15:00-17:30", visitDurationMinutes: 60, cluster: "City Center", notes: "19th-century royal palace museum." },
    { id: "trv-artgallery", type: "activity", category: "museum", name: "Sree Chitra Art Gallery", location: { lat: 8.5080, lng: 76.9578 }, cost: 20, openingHours: "10:00-17:00", visitDurationMinutes: 60, cluster: "City Center", notes: "Indian and Asian art collection, closed Mondays." },
    { id: "trv-kanakakunnu", type: "activity", category: "sightseeing", name: "Kanakakunnu Palace", location: { lat: 8.5111, lng: 76.9538 }, cost: 0, openingHours: "09:00-18:00", visitDurationMinutes: 45, cluster: "City Center", notes: "Palace grounds, occasional cultural events." },
    { id: "trv-kovalam", type: "activity", category: "outdoor", name: "Kovalam Beach", location: { lat: 8.4004, lng: 76.9787 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 120, cluster: "Kovalam Coast", notes: "Crescent-shaped beach, popular for swimming." },
    { id: "trv-lighthousebeach", type: "activity", category: "outdoor", name: "Lighthouse Beach", location: { lat: 8.3988, lng: 76.9784 }, cost: 25, openingHours: "09:00-17:00", visitDurationMinutes: 60, cluster: "Kovalam Coast", notes: "Climb the lighthouse for coastal views." },
    { id: "trv-aquarium", type: "activity", category: "sightseeing", name: "Vizhinjam Marine Aquarium", location: { lat: 8.3765, lng: 76.9928 }, cost: 30, openingHours: "09:30-18:00", visitDurationMinutes: 60, cluster: "Kovalam Coast", notes: "Small aquarium near the fishing harbour." },
    { id: "trv-seafood", type: "activity", category: "food", name: "Kovalam Seafood Shacks", location: { lat: 8.4012, lng: 76.9791 }, cost: 600, openingHours: "12:00-22:30", visitDurationMinutes: 90, cluster: "Kovalam Coast", notes: "Beachside seafood restaurants." },
    { id: "trv-connemara", type: "activity", category: "food", name: "Connemara Market", location: { lat: 8.4880, lng: 76.9490 }, cost: 300, openingHours: "09:00-20:00", visitDurationMinutes: 60, cluster: "City Center", notes: "Local produce and spice market." },
  ],
  accommodation: [
    { id: "trv-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Kovalam", location: { lat: 8.4000, lng: 76.9800 }, costPerNight: 900, notes: "Beachside budget hostel." },
    { id: "trv-acc-mid", type: "accommodation", tier: "mid", name: "Ginger Trivandrum", location: { lat: 8.4900, lng: 76.9500 }, costPerNight: 3200, notes: "Reliable mid-range chain hotel." },
    { id: "trv-acc-premium", type: "accommodation", tier: "premium", name: "Taj Green Cove Kovalam", location: { lat: 8.3987, lng: 76.9793 }, costPerNight: 14000, notes: "Beachfront luxury resort." },
  ],
  transport: [
    { id: "trv-t1", type: "transport", mode: "cab", fromCluster: "City Center", toCluster: "Kovalam Coast", cost: 450, durationMinutes: 35, notes: "App-based cab." },
    { id: "trv-t2", type: "transport", mode: "auto", fromCluster: "City Center", toCluster: "Kovalam Coast", cost: 300, durationMinutes: 40, notes: "Auto-rickshaw." },
    { id: "trv-t3", type: "transport", mode: "bus", fromCluster: "City Center", toCluster: "Kovalam Coast", cost: 30, durationMinutes: 45, notes: "Kerala SRTC bus." },
    { id: "trv-t4", type: "transport", mode: "auto", fromCluster: "City Center", toCluster: "City Center", cost: 100, durationMinutes: 10, notes: "Short local hop." },
  ],
};

// ---------------------------------------------------------------------------
// 9. PANAJI (Goa)
// ---------------------------------------------------------------------------
const panaji: CityDataset = {
  name: "Panaji",
  state: "Goa",
  center: { lat: 15.4909, lng: 73.8278 },
  clusters: ["Panaji City", "North Goa Beaches", "Old Goa"],
  places: [
    { id: "goa-bomjesus", type: "activity", category: "sightseeing", name: "Basilica of Bom Jesus", location: { lat: 15.5009, lng: 73.9114 }, cost: 0, openingHours: "09:00-18:30", visitDurationMinutes: 45, cluster: "Old Goa", notes: "UNESCO site, holds the remains of St. Francis Xavier." },
    { id: "goa-secathedral", type: "activity", category: "sightseeing", name: "Se Cathedral", location: { lat: 15.5011, lng: 73.9122 }, cost: 0, openingHours: "07:30-18:30", visitDurationMinutes: 30, cluster: "Old Goa", notes: "One of the largest churches in Asia." },
    { id: "goa-fontainhas", type: "activity", category: "sightseeing", name: "Fontainhas (Latin Quarter)", location: { lat: 15.4967, lng: 73.8300 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 60, cluster: "Panaji City", notes: "Portuguese-era colourful heritage neighbourhood." },
    { id: "goa-baga", type: "activity", category: "outdoor", name: "Baga Beach", location: { lat: 15.5553, lng: 73.7517 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 120, cluster: "North Goa Beaches", notes: "Popular for water sports and beach shacks." },
    { id: "goa-anjuna", type: "activity", category: "food", name: "Anjuna Flea Market", location: { lat: 15.5738, lng: 73.7405 }, cost: 500, openingHours: "09:00-19:00", visitDurationMinutes: 90, cluster: "North Goa Beaches", notes: "Runs Wednesdays; handicrafts, food, and music." },
    { id: "goa-aguada", type: "activity", category: "sightseeing", name: "Fort Aguada", location: { lat: 15.4925, lng: 73.7738 }, cost: 25, openingHours: "09:30-18:00", visitDurationMinutes: 60, cluster: "North Goa Beaches", notes: "17th-century Portuguese fort with a lighthouse." },
    { id: "goa-calangute", type: "activity", category: "outdoor", name: "Calangute Beach", location: { lat: 15.5439, lng: 73.7553 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 90, cluster: "North Goa Beaches", notes: "Busiest beach in North Goa." },
    { id: "goa-titoslane", type: "activity", category: "nightlife", name: "Tito's Lane", location: { lat: 15.5566, lng: 73.7522 }, cost: 1200, openingHours: "20:00-02:00", visitDurationMinutes: 180, cluster: "North Goa Beaches", notes: "Iconic clubbing strip in Baga." },
    { id: "goa-statemuseum", type: "activity", category: "museum", name: "Goa State Museum", location: { lat: 15.4923, lng: 73.8283 }, cost: 20, openingHours: "09:30-17:15", visitDurationMinutes: 45, cluster: "Panaji City", notes: "Closed Sundays. Konkani culture and Goan history." },
    { id: "goa-dudhsagar", type: "activity", category: "outdoor", name: "Dudhsagar Falls", location: { lat: 15.3144, lng: 74.3144 }, cost: 500, openingHours: "09:00-17:00", visitDurationMinutes: 240, cluster: "Old Goa", notes: "Jeep safari included; ~60km day trip, seasonal water flow." },
  ],
  accommodation: [
    { id: "goa-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Goa", location: { lat: 15.5500, lng: 73.7500 }, costPerNight: 1000, notes: "Popular hostel near Baga." },
    { id: "goa-acc-mid", type: "accommodation", tier: "mid", name: "Fern Kadamba", location: { lat: 15.5000, lng: 73.8300 }, costPerNight: 4000, notes: "Mid-range hotel near Panaji." },
    { id: "goa-acc-premium", type: "accommodation", tier: "premium", name: "Taj Fort Aguada", location: { lat: 15.4934, lng: 73.7736 }, costPerNight: 18000, notes: "Clifftop luxury resort." },
  ],
  transport: [
    { id: "goa-t1", type: "transport", mode: "cab", fromCluster: "Panaji City", toCluster: "North Goa Beaches", cost: 400, durationMinutes: 30, notes: "App-based cab." },
    { id: "goa-t2", type: "transport", mode: "cab", fromCluster: "Panaji City", toCluster: "Old Goa", cost: 300, durationMinutes: 20, notes: "App-based cab." },
    { id: "goa-t3", type: "transport", mode: "bike-rental", fromCluster: "North Goa Beaches", toCluster: "North Goa Beaches", cost: 400, durationMinutes: 0, notes: "Scooter rental, per day, common way to get around Goa." },
    { id: "goa-t4", type: "transport", mode: "cab", fromCluster: "North Goa Beaches", toCluster: "Old Goa", cost: 2500, durationMinutes: 120, notes: "Round-trip for Dudhsagar Falls day trip." },
  ],
};

// ---------------------------------------------------------------------------
// 10. SHIMLA (Himachal Pradesh)
// ---------------------------------------------------------------------------
const shimla: CityDataset = {
  name: "Shimla",
  state: "Himachal Pradesh",
  center: { lat: 31.1048, lng: 77.1734 },
  clusters: ["Ridge-Mall Road", "Kufri", "Outskirts"],
  places: [
    { id: "shi-ridge", type: "activity", category: "sightseeing", name: "The Ridge", location: { lat: 31.1041, lng: 77.1726 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 45, cluster: "Ridge-Mall Road", notes: "Open square with panoramic mountain views." },
    { id: "shi-mallroad", type: "activity", category: "food", name: "Mall Road", location: { lat: 31.1033, lng: 77.1720 }, cost: 500, openingHours: "10:00-21:00", visitDurationMinutes: 90, cluster: "Ridge-Mall Road", notes: "Main pedestrian shopping and dining street." },
    { id: "shi-christchurch", type: "activity", category: "sightseeing", name: "Christ Church", location: { lat: 31.1040, lng: 77.1734 }, cost: 0, openingHours: "09:00-18:00", visitDurationMinutes: 30, cluster: "Ridge-Mall Road", notes: "Second-oldest church in North India." },
    { id: "shi-jakhoo", type: "activity", category: "sightseeing", name: "Jakhoo Temple", location: { lat: 31.1075, lng: 77.1822 }, cost: 0, openingHours: "06:00-19:00", visitDurationMinutes: 60, cluster: "Ridge-Mall Road", notes: "Highest point in Shimla, giant Hanuman statue." },
    { id: "shi-kufri", type: "activity", category: "outdoor", name: "Kufri", location: { lat: 31.0996, lng: 77.2668 }, cost: 200, openingHours: "09:00-17:00", visitDurationMinutes: 150, cluster: "Kufri", notes: "Hill town ~16km away, known for snow activities in winter." },
    { id: "shi-naturepark", type: "activity", category: "outdoor", name: "Himalayan Nature Park", location: { lat: 31.1001, lng: 77.2680 }, cost: 100, openingHours: "09:00-17:00", visitDurationMinutes: 60, cluster: "Kufri", notes: "Zoo focused on Himalayan wildlife." },
    { id: "shi-viceregal", type: "activity", category: "museum", name: "Viceregal Lodge", location: { lat: 31.1102, lng: 77.1672 }, cost: 50, openingHours: "09:00-17:30", visitDurationMinutes: 60, cluster: "Outskirts", notes: "Indian Institute of Advanced Study, colonial architecture." },
    { id: "shi-chadwick", type: "activity", category: "outdoor", name: "Chadwick Falls", location: { lat: 31.0947, lng: 77.1489 }, cost: 0, openingHours: "08:00-17:00", visitDurationMinutes: 90, cluster: "Outskirts", notes: "Waterfall walk through cedar forest." },
    { id: "shi-summerhill", type: "activity", category: "outdoor", name: "Summer Hill", location: { lat: 31.0975, lng: 77.1547 }, cost: 0, openingHours: "24hours", visitDurationMinutes: 45, cluster: "Outskirts", notes: "Quiet residential hill with university campus views." },
    { id: "shi-scandalpoint", type: "activity", category: "nightlife", name: "Scandal Point", location: { lat: 31.1038, lng: 77.1723 }, cost: 600, openingHours: "11:00-22:00", visitDurationMinutes: 90, cluster: "Ridge-Mall Road", notes: "Popular evening meeting point with cafes." },
  ],
  accommodation: [
    { id: "shi-acc-budget", type: "accommodation", tier: "budget", name: "Zostel Shimla", location: { lat: 31.1000, lng: 77.1700 }, costPerNight: 1000, notes: "Budget hostel near Mall Road." },
    { id: "shi-acc-mid", type: "accommodation", tier: "mid", name: "Honeymoon Inn Shimla", location: { lat: 31.1100, lng: 77.1800 }, costPerNight: 3800, notes: "Mid-range hotel with valley views." },
    { id: "shi-acc-premium", type: "accommodation", tier: "premium", name: "Wildflower Hall (Oberoi)", location: { lat: 31.0295, lng: 77.2109 }, costPerNight: 22000, notes: "Forest luxury resort, ~13km from center." },
  ],
  transport: [
    { id: "shi-t1", type: "transport", mode: "cab", fromCluster: "Ridge-Mall Road", toCluster: "Kufri", cost: 800, durationMinutes: 45, notes: "Mountain road, weather-dependent." },
    { id: "shi-t2", type: "transport", mode: "cab", fromCluster: "Ridge-Mall Road", toCluster: "Outskirts", cost: 350, durationMinutes: 20, notes: "Local cab." },
    { id: "shi-t3", type: "transport", mode: "walk", fromCluster: "Ridge-Mall Road", toCluster: "Ridge-Mall Road", cost: 0, durationMinutes: 10, notes: "Mall Road is pedestrian-only." },
    { id: "shi-t4", type: "transport", mode: "shared-taxi", fromCluster: "Kufri", toCluster: "Outskirts", cost: 600, durationMinutes: 50, notes: "Shared taxi, cheaper than a private cab." },
  ],
};

// ---------------------------------------------------------------------------
// Combined export
// ---------------------------------------------------------------------------
export const CITY_DATA: Record<string, CityDataset> = {
  jaipur,
  delhi,
  mumbai,
  bengaluru,
  chennai,
  kolkata,
  hyderabad,
  thiruvananthapuram,
  panaji,
  shimla,
};

export const AVAILABLE_DESTINATIONS: string[] = Object.values(CITY_DATA).map(
  (city) => city.name
);

/**
 * Helper: look up a city dataset case-insensitively by display name.
 * Use this in planner.ts's generateTrip() instead of hardcoding a city.
 */
export function getCityDataset(destination: string): CityDataset | undefined {
  const key = destination.trim().toLowerCase();
  return Object.values(CITY_DATA).find(
    (city) => city.name.toLowerCase() === key
  );
}
