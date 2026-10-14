/**
 * Sample data: categories, 29 products, shipping zones, discount codes,
 * pages, settings, ~80 orders spread over the last 90 days and the default admin.
 *
 *   npm run db:seed          -> only seeds an empty database
 *   npm run db:seed -- --force  -> wipes store data and re-seeds
 */
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { storeDefaults } from "../src/config/store";
import { defaultPages } from "../src/config/default-pages";
import { placeholderSvg, writePlaceholder, type Shape } from "./placeholders";

const db = new PrismaClient();
const force = process.argv.includes("--force");

// Deterministic random so every fresh install looks the same.
let seed = 42;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const rs = (major: number) => Math.round(major * 100);

const categories = [
  { slug: "rc-cars", name: "RC Cars", description: "Bashers, buggies, crawlers and on-road racers.", shape: "car" as Shape },
  { slug: "rc-planes", name: "RC Planes", description: "Trainers, warbirds and park flyers.", shape: "plane" as Shape },
  { slug: "drones", name: "Drones", description: "Camera drones, FPV racers and tiny whoops.", shape: "drone" as Shape },
  { slug: "helicopters", name: "Helicopters", description: "Indoor flyers to full 3D machines.", shape: "heli" as Shape },
  { slug: "boats", name: "Boats", description: "Fast deep-V racers and pond cruisers.", shape: "boat" as Shape },
  { slug: "parts-spares", name: "Parts & Spares", description: "Shocks, gears, props and upgrade parts.", shape: "parts" as Shape },
  { slug: "batteries-chargers", name: "Batteries & Chargers", description: "LiPo, NiMH and smart chargers.", shape: "battery" as Shape },
  { slug: "radios-electronics", name: "Radios & Electronics", description: "Transmitters, receivers, ESCs and motors.", shape: "radio" as Shape },
  { slug: "accessories", name: "Accessories", description: "Tools, stands, bags and safety gear.", shape: "accessory" as Shape },
];

type SeedVariant = { name: string; options: Record<string, string>; price?: number; stock: number };
type SeedProduct = {
  title: string;
  category: string;
  brand: string;
  price: number;
  compareAt?: number;
  cost: number;
  skill: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  stock: number;
  featured?: boolean;
  shape: Shape;
  color: string;
  short: string;
  description: string;
  specs: Record<string, string>;
  inTheBox: string[];
  tags: string[];
  variants?: SeedVariant[];
  compatibleWith?: string[];
  daysAgo?: number;
};

const products: SeedProduct[] = [
  {
    title: "Traxxas Slash 2WD 1:10 Short Course Truck RTR",
    category: "rc-cars", brand: "Traxxas", price: 89999, compareAt: 99999, cost: 68000, skill: "INTERMEDIATE", stock: 0, featured: true,
    shape: "truck", color: "#dc2626",
    short: "The truck that made short-course racing famous. Tough, fast and waterproof electronics.",
    description: "<p>The Slash is the most popular short-course truck ever made, and for good reason. It jumps, slides and bashes all day, and the waterproof electronics mean puddles and wet grass are part of the fun.</p><p>Comes fully assembled with a 2.4GHz radio, so all you need to do is charge the battery and go. Training mode cuts power by 50% for new drivers.</p>",
    specs: { Scale: "1:10", Drive: "2WD", Motor: "Titan 12T 550 brushed", Battery: "7-cell 3000mAh NiMH (included)", "Top speed": "50+ km/h", Range: "Up to 100 m", "Run time": "15–20 minutes", Waterproof: "Yes (electronics)" },
    inTheBox: ["Slash truck, fully assembled", "TQ 2.4GHz transmitter", "3000mAh NiMH battery", "USB-C charger", "Tools and manual"],
    tags: ["basher", "short course", "waterproof", "rtr"],
    variants: [
      { name: "Red", options: { Color: "Red" }, stock: 6 },
      { name: "Blue", options: { Color: "Blue" }, stock: 3 },
      { name: "Green", options: { Color: "Green" }, stock: 0 },
    ],
    daysAgo: 70,
  },
  {
    title: "Arrma Granite 4x4 3S BLX Monster Truck",
    category: "rc-cars", brand: "Arrma", price: 124999, cost: 97000, skill: "INTERMEDIATE", stock: 4, featured: true,
    shape: "truck", color: "#f97316",
    short: "Brushless 4x4 monster truck that hits 80 km/h on 3S. Built to take a beating.",
    description: "<p>The Granite BLX is pure brushless power in a tough monster-truck body. Big tyres, long-travel oil shocks and a steel-geared drivetrain make it a true all-terrain basher.</p>",
    specs: { Scale: "1:10", Drive: "4WD", Motor: "Spektrum 3200Kv brushless", Battery: "2S–3S LiPo (not included)", "Top speed": "80+ km/h on 3S", Range: "Up to 150 m", "Run time": "15–25 minutes", Waterproof: "Yes" },
    inTheBox: ["Granite 4x4 BLX, assembled", "Spektrum SLT3 transmitter", "Manual and tools"],
    tags: ["monster truck", "brushless", "4x4"],
    daysAgo: 55,
  },
  {
    title: "Axial SCX24 Jeep Wrangler 1:24 Crawler RTR",
    category: "rc-cars", brand: "Axial", price: 42500, cost: 31000, skill: "BEGINNER", stock: 0, featured: true,
    shape: "crawler", color: "#16a34a",
    short: "A tiny, scale-realistic rock crawler you can drive on the living-room floor.",
    description: "<p>The SCX24 brings real crawling to a size that fits on a bookshelf. Portal axles, locked diffs and proportional steering let it climb over books, cushions and garden rocks.</p>",
    specs: { Scale: "1:24", Drive: "4WD", Motor: "Brushed 030", Battery: "2S 350mAh LiPo (included)", Range: "Up to 30 m", "Run time": "Up to 60 minutes", Weight: "190 g" },
    inTheBox: ["SCX24 Jeep Wrangler", "2.4GHz transmitter", "350mAh LiPo", "USB charger", "4x AA batteries"],
    tags: ["crawler", "indoor", "scale", "rtr"],
    variants: [
      { name: "Green", options: { Color: "Green" }, stock: 7 },
      { name: "Yellow", options: { Color: "Yellow" }, stock: 2 },
    ],
    daysAgo: 12,
  },
  {
    title: "WLtoys 144001 1:14 4WD High-Speed Buggy",
    category: "rc-cars", brand: "WLtoys", price: 18999, compareAt: 22000, cost: 12500, skill: "BEGINNER", stock: 18, featured: true,
    shape: "car", color: "#2563eb",
    short: "An affordable, surprisingly fast 4WD buggy. A favourite first RC car.",
    description: "<p>The 144001 punches far above its price, with metal gears, oil-filled shocks and a punchy motor that does 60 km/h out of the box.</p>",
    specs: { Scale: "1:14", Drive: "4WD", Motor: "550 brushed", Battery: "2S 1500mAh LiPo (included)", "Top speed": "60 km/h", Range: "Up to 80 m", "Run time": "10–12 minutes" },
    inTheBox: ["Buggy, assembled", "2.4GHz transmitter", "1500mAh LiPo", "USB balance charger"],
    tags: ["buggy", "budget", "rtr"],
    daysAgo: 4,
  },
  {
    title: "Tamiya TT-02 1:10 Touring Car Kit",
    category: "rc-cars", brand: "Tamiya", price: 34999, cost: 26000, skill: "EXPERT", stock: 5,
    shape: "car", color: "#0ea5e9",
    short: "The classic build-it-yourself touring car. Hours of fun on the workbench and the track.",
    description: "<p>Build your own on-road car with Tamiya's famously clear instructions. A perfect project for patient builders, with a huge range of hop-up parts available.</p>",
    specs: { Scale: "1:10", Drive: "4WD shaft", Motor: "540 brushed (included)", Battery: "7.2V NiMH or 2S LiPo (not included)", "Top speed": "40 km/h (stock)" },
    inTheBox: ["Unassembled chassis kit", "Clear polycarbonate body", "540 motor", "Decals", "Instruction manual"],
    tags: ["kit", "on-road", "build"],
    variants: [
      { name: "Kit only", options: { Build: "Kit" }, stock: 5 },
      { name: "Kit + electronics combo", options: { Build: "Kit + electronics" }, price: 49999, stock: 2 },
    ],
    daysAgo: 30,
  },
  {
    title: "E-flite UMX Turbo Timber BNF Basic",
    category: "rc-planes", brand: "E-flite", price: 39999, cost: 30000, skill: "INTERMEDIATE", stock: 3,
    shape: "plane", color: "#facc15",
    short: "A micro bush plane with flaps and slats. Takes off in a few feet.",
    description: "<p>The UMX Turbo Timber flies slow and steady with full flaps, but it can also do loops and rolls. SAFE stabilisation makes it confidence-inspiring.</p>",
    specs: { Wingspan: "700 mm", Motor: "Brushless outrunner", Battery: "2S 280mAh LiPo", Range: "Park flyer", "Flight time": "6–8 minutes", Channels: "5" },
    inTheBox: ["Assembled airframe", "Spektrum receiver with AS3X+SAFE", "Spare propeller", "Manual"],
    tags: ["bnf", "park flyer", "stol"],
    daysAgo: 45,
  },
  {
    title: "Volantex Ranger 757 Trainer RTF",
    category: "rc-planes", brand: "Volantex", price: 32500, cost: 23000, skill: "BEGINNER", stock: 6, featured: true,
    shape: "plane", color: "#e5e7eb",
    short: "Beginner-friendly trainer with gyro stabilisation and one-key return.",
    description: "<p>The Ranger 757 is designed to teach. 3-mode gyro stabilisation keeps it level, and one-key return brings it back if you lose orientation.</p>",
    specs: { Wingspan: "757 mm", Motor: "Brushed", Battery: "2S 500mAh LiPo (included)", Range: "Up to 200 m", "Flight time": "10 minutes", Channels: "4" },
    inTheBox: ["Ranger 757 airframe", "2.4GHz transmitter", "500mAh LiPo", "USB charger", "Spare props"],
    tags: ["trainer", "rtf", "beginner"],
    daysAgo: 8,
  },
  {
    title: "FMS P-51D Mustang 1100mm PNP Warbird",
    category: "rc-planes", brand: "FMS", price: 78000, cost: 60000, skill: "EXPERT", stock: 2,
    shape: "plane", color: "#94a3b8",
    short: "Scale warbird with retracts and flaps. A true head-turner at the field.",
    description: "<p>Detailed panel lines, electric retracts and powerful brushless power make this Mustang a joy for experienced pilots.</p>",
    specs: { Wingspan: "1100 mm", Motor: "3536 brushless", Battery: "4S 2200–2600mAh (not included)", "Flight time": "5–7 minutes", Channels: "6" },
    inTheBox: ["Airframe with retracts", "Motor, ESC and servos installed", "Propeller and spinner", "Manual"],
    tags: ["warbird", "pnp", "scale"],
    daysAgo: 60,
  },
  {
    title: "DJI Mini 4 Pro Fly More Combo",
    category: "drones", brand: "DJI", price: 245000, compareAt: 259000, cost: 210000, skill: "BEGINNER", stock: 3, featured: true,
    shape: "drone", color: "#52525b",
    short: "Under 249 g, 4K/60fps HDR video and omnidirectional obstacle sensing.",
    description: "<p>The Mini 4 Pro is the easiest way to capture stunning aerial video. Omnidirectional obstacle sensing and automatic return-to-home make it very forgiving for new pilots.</p>",
    specs: { Camera: "4K/60fps HDR", Weight: "Under 249 g", Battery: "2590mAh Intelligent Flight Battery", Range: "Up to 20 km (FCC)", "Flight time": "34 minutes" },
    inTheBox: ["Mini 4 Pro drone", "DJI RC 2 controller", "3 batteries", "Charging hub", "Shoulder bag", "Spare propellers"],
    tags: ["camera drone", "4k", "gps"],
    daysAgo: 20,
  },
  {
    title: "Holy Stone HS175D GPS Foldable Drone",
    category: "drones", brand: "Holy Stone", price: 38999, cost: 27000, skill: "BEGINNER", stock: 9,
    shape: "drone", color: "#3f3f46",
    short: "GPS drone with 4K camera and auto return home. Great first camera drone.",
    description: "<p>A foldable GPS drone that holds its position, returns home on low battery and records sharp 4K video. Two batteries are included.</p>",
    specs: { Camera: "4K", Battery: "2x 2800mAh", Range: "Up to 500 m", "Flight time": "46 minutes (combined)", GPS: "Yes" },
    inTheBox: ["HS175D drone", "Transmitter", "2 batteries", "Carry case", "Spare props"],
    tags: ["gps", "camera drone", "beginner"],
    daysAgo: 3,
  },
  {
    title: "iFlight Nazgul5 Evoque F5 6S FPV Drone BNF",
    category: "drones", brand: "iFlight", price: 92000, cost: 72000, skill: "EXPERT", stock: 2,
    shape: "drone", color: "#ef4444",
    short: "Freestyle-ready 5-inch FPV quad with digital HD video.",
    description: "<p>A fast, durable 5-inch freestyle quad. Requires FPV goggles and a compatible ELRS radio.</p>",
    specs: { Size: "5-inch", Motor: "XING2 2207 1800KV", Battery: "6S 1100–1550mAh (not included)", Range: "Up to 2 km (ELRS)", "Flight time": "4–6 minutes" },
    inTheBox: ["Nazgul5 Evoque quad", "Propellers", "Battery straps", "Tools"],
    tags: ["fpv", "freestyle", "6s"],
    daysAgo: 25,
  },
  {
    title: "Eachine E010 Mini Tiny Whoop Drone",
    category: "drones", brand: "Eachine", price: 4999, cost: 2900, skill: "BEGINNER", stock: 25,
    shape: "drone", color: "#a855f7",
    short: "A palm-sized drone that is safe to fly indoors. Perfect gift.",
    description: "<p>Ducted propellers make the E010 safe to fly around the house. Headless mode makes it simple to control for kids and first-timers.</p>",
    specs: { Size: "65 mm", Battery: "150mAh (included)", Range: "Up to 30 m", "Flight time": "5 minutes" },
    inTheBox: ["E010 drone", "Transmitter", "Battery", "USB charger", "Spare props"],
    tags: ["mini", "indoor", "gift"],
    daysAgo: 1,
  },
  {
    title: "Blade 230 S Smart RTF Helicopter",
    category: "helicopters", brand: "Blade", price: 74500, cost: 58000, skill: "INTERMEDIATE", stock: 2,
    shape: "heli", color: "#dc2626",
    short: "SAFE technology makes learning collective-pitch flying far easier.",
    description: "<p>The 230 S Smart has stability, intermediate and agility modes so you can grow from hovering to full 3D aerobatics.</p>",
    specs: { "Rotor diameter": "507 mm", Motor: "Brushless", Battery: "3S 800mAh LiPo (included)", "Flight time": "5–6 minutes", Channels: "6" },
    inTheBox: ["230 S helicopter", "DXS transmitter", "800mAh battery", "Charger"],
    tags: ["collective pitch", "rtf"],
    daysAgo: 40,
  },
  {
    title: "OMPHOBBY M2 EVO 3D Helicopter BNF",
    category: "helicopters", brand: "OMPHOBBY", price: 68000, cost: 52000, skill: "EXPERT", stock: 1,
    shape: "heli", color: "#0ea5e9",
    short: "Direct-drive 3D helicopter. Crisp, precise and powerful.",
    description: "<p>Direct-drive motors and a rigid frame make the M2 EVO a favourite with 3D pilots.</p>",
    specs: { "Rotor diameter": "380 mm", Motor: "Dual brushless", Battery: "3S 450mAh", "Flight time": "4–5 minutes" },
    inTheBox: ["M2 EVO helicopter", "Spare blades", "Tools"],
    tags: ["3d", "bnf", "flybarless"],
    daysAgo: 75,
  },
  {
    title: "Syma S107H Indoor Helicopter",
    category: "helicopters", brand: "Syma", price: 4500, cost: 2600, skill: "BEGINNER", stock: 14,
    shape: "heli", color: "#f59e0b",
    short: "Classic coaxial indoor helicopter with altitude hold. Easy for anyone to fly.",
    description: "<p>Altitude hold keeps the S107H at a steady height so you can focus on steering. A great first helicopter for all ages.</p>",
    specs: { Length: "220 mm", Battery: "3.7V 200mAh (built-in)", Range: "Up to 15 m", "Flight time": "7–8 minutes" },
    inTheBox: ["Helicopter", "Transmitter", "USB charging cable"],
    tags: ["indoor", "coaxial", "gift"],
    daysAgo: 15,
  },
  {
    title: 'Pro Boat Recoil 2 26" Brushless Deep-V RTR',
    category: "boats", brand: "Pro Boat", price: 64999, cost: 50000, skill: "INTERMEDIATE", stock: 3,
    shape: "boat", color: "#2563eb",
    short: "Self-righting deep-V that flips itself back over. 80 km/h on 4S.",
    description: "<p>The Recoil 2 can right itself after a flip with a simple input on the controller. Fast, fun and easy to live with.</p>",
    specs: { Length: "26 inch (660 mm)", Motor: "2000Kv brushless", Battery: "2S–4S LiPo (not included)", "Top speed": "80 km/h on 4S", "Run time": "8–10 minutes" },
    inTheBox: ["Recoil 2 boat", "Spektrum transmitter", "Boat stand", "Manual"],
    tags: ["deep-v", "brushless", "self-righting"],
    daysAgo: 35,
  },
  {
    title: "Volantex Vector SR48 Racing Boat",
    category: "boats", brand: "Volantex", price: 21999, cost: 15000, skill: "BEGINNER", stock: 0,
    shape: "boat", color: "#ef4444",
    short: "A fast, affordable racing boat with low-battery alarm and self-righting.",
    description: "<p>A great pond racer for beginners, with reverse for getting off the bank and a capsize recovery function.</p>",
    specs: { Length: "480 mm", Motor: "Brushed 390", Battery: "2S 1500mAh LiPo (included)", "Top speed": "30 km/h", "Run time": "10 minutes" },
    inTheBox: ["SR48 boat", "Transmitter", "LiPo battery", "Charger", "Stand"],
    tags: ["racing boat", "rtr", "beginner"],
    daysAgo: 50,
  },
  {
    title: "Aluminium Shock Set for Traxxas Slash (4 pcs)",
    category: "parts-spares", brand: "Traxxas", price: 6500, cost: 4200, skill: "INTERMEDIATE", stock: 8,
    shape: "parts", color: "#dc2626",
    short: "Smoother, stronger oil shocks for the Slash and Stampede.",
    description: "<p>Hard-anodised aluminium bodies and threaded collars for easy ride-height adjustment.</p>",
    specs: { Fits: "Slash 2WD, Stampede 2WD", Material: "Aluminium", Quantity: "4" },
    inTheBox: ["2 front shocks", "2 rear shocks", "Shock oil"],
    tags: ["upgrade", "shocks", "slash"],
    compatibleWith: ["Traxxas Slash 2WD 1:10 Short Course Truck RTR"],
    daysAgo: 22,
  },
  {
    title: "48P Spur & Pinion Gear Set",
    category: "parts-spares", brand: "Hobbywing", price: 1850, cost: 900, skill: "INTERMEDIATE", stock: 30,
    shape: "parts", color: "#71717a",
    short: "Hardened steel pinion and spur set for 1:10 cars.",
    description: "<p>Change your gearing for more speed or more torque. Includes a range of pinion sizes.</p>",
    specs: { Pitch: "48P", Material: "Hardened steel / composite", Fits: "Most 1:10 2WD and 4WD cars" },
    inTheBox: ["86T spur gear", "18T, 20T and 22T pinions"],
    tags: ["gears", "spares"],
    compatibleWith: ["Traxxas Slash 2WD 1:10 Short Course Truck RTR", "Arrma Granite 4x4 3S BLX Monster Truck"],
    daysAgo: 65,
  },
  {
    title: "5x4.5 Tri-Blade FPV Propellers (8 pack)",
    category: "parts-spares", brand: "Gemfan", price: 950, cost: 450, skill: "EXPERT", stock: 2,
    shape: "parts", color: "#ef4444",
    short: "Durable tri-blade props for 5-inch freestyle quads.",
    description: "<p>A smooth, efficient prop that balances punch and flight time. You will break props, so keep a few packs handy.</p>",
    specs: { Size: "5 x 4.5 x 3", Material: "Polycarbonate", Quantity: "8 (4 CW, 4 CCW)" },
    inTheBox: ["8 propellers"],
    tags: ["props", "fpv", "spares"],
    compatibleWith: ["iFlight Nazgul5 Evoque F5 6S FPV Drone BNF"],
    daysAgo: 9,
  },
  {
    title: "Gens Ace 5000mAh 2S 7.4V 50C LiPo Battery",
    category: "batteries-chargers", brand: "Gens Ace", price: 7999, cost: 5600, skill: "BEGINNER", stock: 0, featured: true,
    shape: "battery", color: "#27272a",
    short: "Hard-case 2S LiPo for 1:10 cars and trucks. Longer runs, more punch.",
    description: "<p>A reliable hard-case LiPo that gives most 1:10 cars 25+ minutes of run time. Choose your plug below.</p>",
    specs: { Capacity: "5000mAh", Voltage: "7.4V (2S)", Discharge: "50C", Case: "Hard case", Weight: "270 g" },
    inTheBox: ["LiPo battery"],
    tags: ["lipo", "2s", "battery"],
    variants: [
      { name: "Deans (T-plug)", options: { Connector: "Deans" }, stock: 6 },
      { name: "XT60", options: { Connector: "XT60" }, stock: 10 },
      { name: "Traxxas iD", options: { Connector: "Traxxas iD" }, price: 8499, stock: 4 },
    ],
    compatibleWith: ["Traxxas Slash 2WD 1:10 Short Course Truck RTR", "Arrma Granite 4x4 3S BLX Monster Truck", "Tamiya TT-02 1:10 Touring Car Kit"],
    daysAgo: 18,
  },
  {
    title: "ISDT Q6 Nano 200W Smart Charger",
    category: "batteries-chargers", brand: "ISDT", price: 11500, cost: 8200, skill: "BEGINNER", stock: 7,
    shape: "charger", color: "#18181b",
    short: "Pocket-sized balance charger for 1–6S LiPo. Clear colour screen.",
    description: "<p>The Q6 Nano charges LiPo, LiHV, NiMH and more at up to 8A. Simple menus make it easy to charge safely.</p>",
    specs: { Power: "200W", "Charge current": "Up to 8A", "Cell count": "1–6S LiPo", Input: "DC 10–30V" },
    inTheBox: ["Q6 Nano charger", "XT60 charge lead", "Manual"],
    tags: ["charger", "lipo"],
    compatibleWith: ["Gens Ace 5000mAh 2S 7.4V 50C LiPo Battery", "Tattu R-Line 1550mAh 6S 120C LiPo"],
    daysAgo: 28,
  },
  {
    title: "Tattu R-Line 1550mAh 6S 120C LiPo",
    category: "batteries-chargers", brand: "Tattu", price: 12999, cost: 9500, skill: "EXPERT", stock: 5,
    shape: "battery", color: "#dc2626",
    short: "Race-grade 6S pack for 5-inch FPV quads.",
    description: "<p>Low internal resistance and a strong voltage under load. The go-to pack for freestyle and racing.</p>",
    specs: { Capacity: "1550mAh", Voltage: "22.2V (6S)", Discharge: "120C", Plug: "XT60", Weight: "245 g" },
    inTheBox: ["LiPo battery"],
    tags: ["lipo", "6s", "fpv"],
    compatibleWith: ["iFlight Nazgul5 Evoque F5 6S FPV Drone BNF"],
    daysAgo: 6,
  },
  {
    title: "RadioMaster TX16S MKII ELRS Transmitter",
    category: "radios-electronics", brand: "RadioMaster", price: 52000, cost: 41000, skill: "INTERMEDIATE", stock: 4, featured: true,
    shape: "radio", color: "#3f3f46",
    short: "Full-size 16-channel radio with hall gimbals and EdgeTX. One radio for everything.",
    description: "<p>The TX16S runs open-source EdgeTX and can fly planes, helis, drones and drive cars. Hall-effect gimbals feel smooth and last for years.</p>",
    specs: { Channels: "16", Protocol: "ExpressLRS 2.4GHz", Gimbals: "Hall effect", Screen: "4.3-inch colour touch", Battery: "2x 18650 (not included)" },
    inTheBox: ["TX16S MKII transmitter", "Neck strap", "USB-C cable", "Manual"],
    tags: ["transmitter", "elrs", "edgetx"],
    compatibleWith: ["iFlight Nazgul5 Evoque F5 6S FPV Drone BNF"],
    daysAgo: 33,
  },
  {
    title: "Hobbywing QuicRun 10BL120 ESC + 3652 Motor Combo",
    category: "radios-electronics", brand: "Hobbywing", price: 18500, cost: 13500, skill: "INTERMEDIATE", stock: 3,
    shape: "parts", color: "#2563eb",
    short: "Sensored brushless upgrade for 1:10 cars. Turn your brushed basher into a rocket.",
    description: "<p>A reliable, waterproof brushless system that bolts into most 1:10 cars.</p>",
    specs: { ESC: "120A sensored", Motor: "3652 4000Kv", Battery: "2S–3S LiPo", Waterproof: "Yes" },
    inTheBox: ["ESC", "Motor", "Program card", "Manual"],
    tags: ["brushless", "upgrade", "esc"],
    compatibleWith: ["Traxxas Slash 2WD 1:10 Short Course Truck RTR", "Tamiya TT-02 1:10 Touring Car Kit"],
    daysAgo: 48,
  },
  {
    title: "Spektrum DX6e 6-Channel DSMX Transmitter",
    category: "radios-electronics", brand: "Spektrum", price: 41000, cost: 32000, skill: "BEGINNER", stock: 2,
    shape: "radio", color: "#52525b",
    short: "Easy-to-use 6-channel radio. Binds to all Spektrum BNF aircraft.",
    description: "<p>A straightforward radio for planes and helicopters with voice alerts and free model setups through the Spektrum app.</p>",
    specs: { Channels: "6", Protocol: "DSMX 2.4GHz", "Model memory": "250", Battery: "4x AA (included)" },
    inTheBox: ["DX6e transmitter", "AR6600T receiver", "4x AA batteries"],
    tags: ["transmitter", "dsmx"],
    compatibleWith: ["E-flite UMX Turbo Timber BNF Basic", "OMPHOBBY M2 EVO 3D Helicopter BNF"],
    daysAgo: 80,
  },
  {
    title: "LiPo Safe Charging Bag (Large)",
    category: "accessories", brand: "Generic", price: 1999, cost: 900, skill: "BEGINNER", stock: 40,
    shape: "accessory", color: "#f97316",
    short: "Fire-resistant bag for charging and storing LiPo batteries safely.",
    description: "<p>Always charge LiPo batteries in a safe bag. This large size fits several 2S or 3S packs.</p>",
    specs: { Size: "300 x 230 x 180 mm", Material: "Fibreglass, fire-resistant" },
    inTheBox: ["Safe bag"],
    tags: ["safety", "lipo"],
    daysAgo: 5,
  },
  {
    title: "RC Car Stand & 25-piece Tool Kit",
    category: "accessories", brand: "Generic", price: 4250, cost: 2400, skill: "BEGINNER", stock: 12,
    shape: "accessory", color: "#2563eb",
    short: "Everything you need for basic maintenance in one case.",
    description: "<p>Hex drivers, nut drivers, pliers, shock pliers and a rotating car stand in a carry case.</p>",
    specs: { Pieces: "25", "Hex sizes": "1.5 / 2.0 / 2.5 / 3.0 mm", "Nut drivers": "5.5 / 7.0 / 8.0 mm" },
    inTheBox: ["Tool case", "Car stand", "25 tools"],
    tags: ["tools", "maintenance"],
    daysAgo: 42,
  },
  {
    title: "LiPo Battery Checker & Low-Voltage Alarm",
    category: "accessories", brand: "Generic", price: 650, cost: 250, skill: "BEGINNER", stock: 1,
    shape: "accessory", color: "#16a34a",
    short: "Check every cell's voltage in seconds and get an alarm before it is too low.",
    description: "<p>Plug into the balance lead to see total and per-cell voltage. A loud buzzer warns you when the pack is getting low.</p>",
    specs: { Cells: "1–8S", Accuracy: "±0.01V" },
    inTheBox: ["Battery checker"],
    tags: ["lipo", "safety"],
    daysAgo: 2,
  },
];

const firstNames = ["Ahmed", "Ali", "Usman", "Bilal", "Hamza", "Zain", "Fatima", "Ayesha", "Sana", "Imran", "Tariq", "Hassan", "Omar", "Saad", "Hira", "Nadia", "Kamran", "Faisal", "Asad", "Mariam", "Rehan", "Danish", "Shoaib", "Javed"];
const lastNames = ["Khan", "Malik", "Qureshi", "Sheikh", "Butt", "Chaudhry", "Raza", "Hussain", "Iqbal", "Siddiqui", "Mirza", "Abbasi", "Awan", "Javed"];
const cities = ["Lahore", "Lahore", "Lahore", "Karachi", "Karachi", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Sialkot", "Gujranwala", "Hyderabad", "Quetta"];
const streets = ["House 12, Street 4, DHA Phase 5", "Flat 3B, Block 7, Gulshan-e-Iqbal", "House 45-C, Model Town", "Plot 9, Sector F-7/2", "House 221, Satellite Town", "House 88, Johar Town", "Street 15, G-11/3", "House 7, Cantt Area"];

async function wipe() {
  await db.orderStatusHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.productImage.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.discountCode.deleteMany();
  await db.shippingZone.deleteMany();
  await db.page.deleteMany();
  await db.setting.deleteMany();
  await db.adminNotification.deleteMany();
  await db.address.deleteMany();
  await db.pushSubscription.deleteMany();
  await db.user.deleteMany();
}

async function main() {
  const existing = await db.user.count();
  if (existing > 0 && !force) {
    console.log("Database already has data. Use `npm run db:seed -- --force` to wipe and re-seed.");
    return;
  }
  if (force) await wipe();

  // Settings
  for (const [key, value] of Object.entries(storeDefaults)) {
    await db.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
  }

  // Admin
  await db.user.create({
    data: {
      email: "admin@hobbyshobby.local",
      name: "Store Owner",
      role: "OWNER",
      passwordHash: await bcrypt.hash("ChangeMe123!", 10),
      mustChangePassword: true,
    },
  });

  // Categories
  const catIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const image = writePlaceholder(`category-${c.slug}.svg`, placeholderSvg({ title: c.name, shape: c.shape, color: "#D7261E", angle: i }));
    const cat = await db.category.create({ data: { name: c.name, slug: c.slug, description: c.description, sortOrder: i, image } });
    catIds[c.slug] = cat.id;
  }

  // Products
  const productIds: Record<string, { id: string; price: number; cost: number; title: string; image: string; variants: { id: string; name: string; price: number | null }[] }> = {};
  for (const p of products) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const images = [0, 1, 2].map((angle) =>
      writePlaceholder(`${slug}-${angle + 1}.svg`, placeholderSvg({ title: p.title, shape: p.shape, color: p.color, angle, label: p.brand })),
    );
    const created = await db.product.create({
      data: {
        title: p.title,
        slug,
        shortDescription: p.short,
        description: p.description,
        price: rs(p.price),
        compareAtPrice: p.compareAt ? rs(p.compareAt) : null,
        costPrice: rs(p.cost),
        sku: `SKU-${slug.split("-").slice(0, 2).join("").toUpperCase().slice(0, 8)}-${Math.floor(rand() * 9000 + 1000)}`,
        brand: p.brand,
        categoryId: catIds[p.category],
        skillLevel: p.skill,
        specs: JSON.stringify(p.specs),
        inTheBox: JSON.stringify(p.inTheBox),
        tags: p.tags.join(", "),
        status: "PUBLISHED",
        featured: !!p.featured,
        stock: p.variants ? 0 : p.stock,
        lowStockThreshold: 3,
        createdAt: new Date(Date.now() - (p.daysAgo ?? 30) * 86400000),
        images: { create: images.map((url, i) => ({ url, alt: `${p.title} - view ${i + 1}`, sortOrder: i })) },
        variants: p.variants
          ? {
              create: p.variants.map((v, i) => ({
                name: v.name,
                options: JSON.stringify(v.options),
                price: v.price ? rs(v.price) : null,
                stock: v.stock,
                sortOrder: i,
                sku: `V-${slug.slice(0, 10).toUpperCase()}-${i + 1}`,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });
    productIds[p.title] = {
      id: created.id,
      price: created.price,
      cost: created.costPrice ?? 0,
      title: created.title,
      image: images[0],
      variants: created.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    };
  }

  // Compatible parts
  for (const p of products) {
    if (!p.compatibleWith?.length) continue;
    await db.product.update({
      where: { id: productIds[p.title].id },
      data: { compatibleWith: { connect: p.compatibleWith.filter((t) => productIds[t]).map((t) => ({ id: productIds[t].id })) } },
    });
  }

  // Shipping zones
  await db.shippingZone.createMany({
    data: [
      { name: "Lahore", cities: JSON.stringify(["Lahore"]), rate: rs(200), sortOrder: 0 },
      { name: "Karachi", cities: JSON.stringify(["Karachi"]), rate: rs(300), sortOrder: 1 },
      { name: "Islamabad & Rawalpindi", cities: JSON.stringify(["Islamabad", "Rawalpindi"]), rate: rs(300), sortOrder: 2 },
      { name: "Rest of Pakistan", cities: "[]", rate: rs(450), isDefault: true, sortOrder: 3 },
    ],
  });

  // Discount codes
  await db.discountCode.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: rs(5000), usageLimit: 500 },
      { code: "FLY500", type: "FIXED", value: rs(500), minOrder: rs(10000) },
      { code: "EID2025", type: "PERCENT", value: 15, expiresAt: new Date("2025-04-15"), isActive: true },
    ],
  });

  // Pages
  for (const [slug, page] of Object.entries(defaultPages)) {
    await db.page.create({ data: { slug, title: page.title, content: page.content } });
  }

  // Sample orders over the last 90 days
  const zoneRate = (city: string) => (city === "Lahore" ? rs(200) : ["Karachi", "Islamabad", "Rawalpindi"].includes(city) ? rs(300) : rs(450));
  const methods = ["cod", "cod", "cod", "cod", "bank", "jazzcash", "easypaisa"];
  const titles = Object.keys(productIds);
  const sold: Record<string, number> = {};
  let number = 10001;
  const orderCount = 84;
  for (let i = 0; i < orderCount; i++) {
    const daysAgo = Math.floor(Math.pow(rand(), 1.4) * 90);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 10) * 3600000);
    const itemCount = rand() < 0.65 ? 1 : rand() < 0.8 ? 2 : 3;
    const lines: { title: string; variantId?: string; variantName?: string; price: number; cost: number; qty: number; productId: string; image: string }[] = [];
    for (let j = 0; j < itemCount; j++) {
      const t = pick(titles);
      const prod = productIds[t];
      const v = prod.variants.length ? pick(prod.variants) : undefined;
      const qty = prod.price < rs(3000) ? 1 + Math.floor(rand() * 3) : 1;
      lines.push({ title: prod.title, productId: prod.id, variantId: v?.id, variantName: v?.name, price: v?.price ?? prod.price, cost: prod.cost, qty, image: prod.image });
      sold[prod.id] = (sold[prod.id] ?? 0) + qty;
    }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const city = pick(cities);
    const shipping = subtotal >= storeDefaults.commerce.freeShippingThreshold ? 0 : zoneRate(city);
    const useDiscount = rand() < 0.15 && subtotal >= rs(5000);
    const discount = useDiscount ? Math.round(subtotal * 0.1) : 0;
    const method = pick(methods);
    let status: string;
    if (daysAgo > 7) status = rand() < 0.86 ? "DELIVERED" : rand() < 0.5 ? "CANCELLED" : "RETURNED";
    else if (daysAgo > 3) status = pick(["SHIPPED", "SHIPPED", "DELIVERED", "PACKED"]);
    else if (daysAgo > 0) status = pick(["CONFIRMED", "PACKED", "SHIPPED", "NEW"]);
    else status = pick(["NEW", "NEW", "CONFIRMED"]);
    const paymentStatus =
      method === "cod"
        ? status === "DELIVERED" ? "PAID" : "UNPAID"
        : status === "NEW" ? "AWAITING_VERIFICATION" : status === "CANCELLED" ? "REJECTED" : "PAID";
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const phoneLocal = `03${Math.floor(rand() * 5)}${Math.floor(rand() * 10)}${String(Math.floor(rand() * 10000000)).padStart(7, "0")}`;
    const flow = ["NEW", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
    const reached = flow.indexOf(status);
    const history =
      reached >= 0
        ? flow.slice(0, reached + 1).map((s, k) => ({ status: s, createdAt: new Date(createdAt.getTime() + k * 20 * 3600000), actor: k === 0 ? "customer" : "Store Owner" }))
        : [
            { status: "NEW", createdAt, actor: "customer" },
            { status, createdAt: new Date(createdAt.getTime() + 30 * 3600000), actor: "Store Owner" },
          ];

    await db.order.create({
      data: {
        number: number++,
        accessToken: crypto.randomBytes(16).toString("hex"),
        customerName: name,
        phone: phoneLocal,
        phoneNormalized: "92" + phoneLocal.slice(1),
        email: rand() < 0.6 ? `${name.split(" ")[0].toLowerCase()}${Math.floor(rand() * 100)}@example.com` : null,
        address: pick(streets),
        city,
        status,
        paymentMethod: method,
        paymentStatus,
        subtotal,
        discountTotal: discount,
        discountCode: useDiscount ? "WELCOME10" : null,
        shippingTotal: shipping,
        shippingZone: city,
        total: subtotal - discount + shipping,
        courierName: ["SHIPPED", "DELIVERED"].includes(status) ? pick(["TCS", "Leopards", "M&P", "Trax"]) : null,
        trackingNumber: ["SHIPPED", "DELIVERED"].includes(status) ? String(Math.floor(rand() * 1e10)) : null,
        stockRestored: status === "CANCELLED" || status === "RETURNED",
        createdAt,
        updatedAt: createdAt,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            variantName: l.variantName,
            image: l.image,
            unitPrice: l.price,
            unitCost: l.cost,
            quantity: l.qty,
            lineTotal: l.price * l.qty,
          })),
        },
        history: { create: history },
      },
    });
  }
  for (const [id, count] of Object.entries(sold)) {
    await db.product.update({ where: { id }, data: { soldCount: count } });
  }

  await db.adminNotification.create({
    data: { type: "INFO", title: "Welcome to your store", body: "Sample data has been added. Change your password and update Settings to make the store yours.", link: "/admin/settings" },
  });

  console.log(`Seeded ${categories.length} categories, ${products.length} products, ${orderCount} orders.`);
  console.log("Admin login: admin@hobbyshobby.local / ChangeMe123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
