/**
 * Sample catalogue: parts and accessories categories plus sample products.
 * Used by prisma/seed.ts. Replace with your real products in the admin.
 */
import type { Shape } from "./placeholders";

export const categories = [
  { slug: "escs", name: "ESCs", description: "Brushed and brushless speed controllers for cars, planes and drones.", shape: "esc" as Shape },
  { slug: "batteries", name: "Batteries", description: "LiPo and NiMH packs in every size and cell count.", shape: "battery" as Shape },
  { slug: "chargers", name: "Chargers", description: "Smart balance chargers and power supplies.", shape: "charger" as Shape },
  { slug: "motors", name: "Motors", description: "Brushless and brushed motors for every scale.", shape: "motor" as Shape },
  { slug: "servos", name: "Servos", description: "Micro, standard and high-torque servos.", shape: "servo" as Shape },
  { slug: "plugs-connectors", name: "Plugs & Connectors", description: "XT60, Deans, EC5 and other power connectors.", shape: "plug" as Shape },
  { slug: "radios", name: "Radios", description: "Transmitters and receivers.", shape: "radio" as Shape },
  { slug: "propellers", name: "Propellers", description: "Props for planes, quads and boats.", shape: "propeller" as Shape },
  { slug: "accessories", name: "Accessories", description: "Tools, gears, stands, bags and safety gear.", shape: "accessory" as Shape },
];

export type SeedVariant = { name: string; options: Record<string, string>; price?: number; stock: number };
export type SeedProduct = {
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


export const products: SeedProduct[] = [
  {
    title: "Aluminium Shock Set for Traxxas Slash (4 pcs)",
    category: "accessories", brand: "Traxxas", price: 6500, cost: 4200, skill: "INTERMEDIATE", stock: 8,
    shape: "parts", color: "#dc2626",
    short: "Smoother, stronger oil shocks for the Slash and Stampede.",
    description: "<p>Hard-anodised aluminium bodies and threaded collars for easy ride-height adjustment.</p>",
    specs: { Fits: "Slash 2WD, Stampede 2WD", Material: "Aluminium", Quantity: "4" },
    inTheBox: ["2 front shocks", "2 rear shocks", "Shock oil"],
    tags: ["upgrade", "shocks", "slash"],
    daysAgo: 22,
  },
  {
    title: "48P Spur & Pinion Gear Set",
    category: "accessories", brand: "Hobbywing", price: 1850, cost: 900, skill: "INTERMEDIATE", stock: 30,
    shape: "parts", color: "#71717a",
    short: "Hardened steel pinion and spur set for 1:10 cars.",
    description: "<p>Change your gearing for more speed or more torque. Includes a range of pinion sizes.</p>",
    specs: { Pitch: "48P", Material: "Hardened steel / composite", Fits: "Most 1:10 2WD and 4WD cars" },
    inTheBox: ["86T spur gear", "18T, 20T and 22T pinions"],
    tags: ["gears", "spares"],
    daysAgo: 65,
  },
  {
    title: "5x4.5 Tri-Blade FPV Propellers (8 pack)",
    category: "propellers", brand: "Gemfan", price: 950, cost: 450, skill: "EXPERT", stock: 2,
    shape: "propeller", color: "#ef4444",
    short: "Durable tri-blade props for 5-inch freestyle quads.",
    description: "<p>A smooth, efficient prop that balances punch and flight time. You will break props, so keep a few packs handy.</p>",
    specs: { Size: "5 x 4.5 x 3", Material: "Polycarbonate", Quantity: "8 (4 CW, 4 CCW)" },
    inTheBox: ["8 propellers"],
    tags: ["props", "fpv", "spares"],
    daysAgo: 9,
  },
  {
    title: "Gens Ace 5000mAh 2S 7.4V 50C LiPo Battery",
    category: "batteries", brand: "Gens Ace", price: 7999, cost: 5600, skill: "BEGINNER", stock: 0, featured: true,
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
    daysAgo: 18,
  },
  {
    title: "ISDT Q6 Nano 200W Smart Charger",
    category: "chargers", brand: "ISDT", price: 11500, cost: 8200, skill: "BEGINNER", stock: 7,
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
    category: "batteries", brand: "Tattu", price: 12999, cost: 9500, skill: "EXPERT", stock: 5,
    shape: "battery", color: "#dc2626",
    short: "Race-grade 6S pack for 5-inch FPV quads.",
    description: "<p>Low internal resistance and a strong voltage under load. The go-to pack for freestyle and racing.</p>",
    specs: { Capacity: "1550mAh", Voltage: "22.2V (6S)", Discharge: "120C", Plug: "XT60", Weight: "245 g" },
    inTheBox: ["LiPo battery"],
    tags: ["lipo", "6s", "fpv"],
    daysAgo: 6,
  },
  {
    title: "RadioMaster TX16S MKII ELRS Transmitter",
    category: "radios", brand: "RadioMaster", price: 52000, cost: 41000, skill: "INTERMEDIATE", stock: 4, featured: true,
    shape: "radio", color: "#3f3f46",
    short: "Full-size 16-channel radio with hall gimbals and EdgeTX. One radio for everything.",
    description: "<p>The TX16S runs open-source EdgeTX and can fly planes, helis, drones and drive cars. Hall-effect gimbals feel smooth and last for years.</p>",
    specs: { Channels: "16", Protocol: "ExpressLRS 2.4GHz", Gimbals: "Hall effect", Screen: "4.3-inch colour touch", Battery: "2x 18650 (not included)" },
    inTheBox: ["TX16S MKII transmitter", "Neck strap", "USB-C cable", "Manual"],
    tags: ["transmitter", "elrs", "edgetx"],
    daysAgo: 33,
  },
  {
    title: "Hobbywing QuicRun 10BL120 ESC + 3652 Motor Combo",
    category: "escs", brand: "Hobbywing", price: 18500, cost: 13500, skill: "INTERMEDIATE", stock: 3,
    shape: "esc", color: "#2563eb",
    short: "Sensored brushless upgrade for 1:10 cars. Turn your brushed basher into a rocket.",
    description: "<p>A reliable, waterproof brushless system that bolts into most 1:10 cars.</p>",
    specs: { ESC: "120A sensored", Motor: "3652 4000Kv", Battery: "2S–3S LiPo", Waterproof: "Yes" },
    inTheBox: ["ESC", "Motor", "Program card", "Manual"],
    tags: ["brushless", "upgrade", "esc"],
    daysAgo: 48,
  },
  {
    title: "Spektrum DX6e 6-Channel DSMX Transmitter",
    category: "radios", brand: "Spektrum", price: 41000, cost: 32000, skill: "BEGINNER", stock: 2,
    shape: "radio", color: "#52525b",
    short: "Easy-to-use 6-channel radio. Binds to all Spektrum BNF aircraft.",
    description: "<p>A straightforward radio for planes and helicopters with voice alerts and free model setups through the Spektrum app.</p>",
    specs: { Channels: "6", Protocol: "DSMX 2.4GHz", "Model memory": "250", Battery: "4x AA (included)" },
    inTheBox: ["DX6e transmitter", "AR6600T receiver", "4x AA batteries"],
    tags: ["transmitter", "dsmx"],
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
  {
    title: "Hobbywing Skywalker 40A V2 Brushless ESC",
    category: "escs", brand: "Hobbywing", price: 4200, cost: 2900, skill: "INTERMEDIATE", stock: 10,
    shape: "esc", color: "#2563eb",
    short: "Reliable 40A brushless ESC for 2–4S planes, with a 5V BEC built in.",
    description: "<p>A proven plane ESC with smooth throttle response, programmable brake and timing, and a switching BEC that powers your receiver and servos.</p>",
    specs: { "Continuous current": "40A", "Burst current": "60A", Cells: "2–4S LiPo", BEC: "5V / 3A switching" },
    inTheBox: ["ESC", "Manual"],
    tags: ["esc", "brushless", "plane"],
    daysAgo: 12,
  },
  {
    title: "SunnySky X2212 980KV Brushless Motor",
    category: "motors", brand: "SunnySky", price: 3200, cost: 2100, skill: "BEGINNER", stock: 12, featured: true,
    shape: "motor", color: "#dc2626",
    short: "The classic outrunner for 1–1.2 m trainers and quads on 3S.",
    description: "<p>Smooth, efficient and tough. Pairs with a 30–40A ESC and a 10x4.7 prop on 3S for plenty of thrust.</p>",
    specs: { KV: "980", "Max current": "30A", Cells: "2–4S LiPo", Weight: "56 g", Shaft: "3.17 mm" },
    inTheBox: ["Motor", "Prop adapter", "Mounting cross"],
    tags: ["motor", "brushless", "outrunner"],
    compatibleWith: ["Hobbywing Skywalker 40A V2 Brushless ESC", "APC 10x4.7 Slow Flyer Propeller (2 pack)"],
    daysAgo: 9,
  },
  {
    title: "Hobbywing XeRun 3652 G3 Sensorless Motor",
    category: "motors", brand: "Hobbywing", price: 6800, cost: 4900, skill: "INTERMEDIATE", stock: 0,
    shape: "motor", color: "#2563eb",
    short: "Powerful 540-size brushless motor for 1:10 cars and short course trucks.",
    description: "<p>High-efficiency 4-pole motor with a 5 mm shaft. Choose the KV that suits your vehicle: lower KV for 3S and heavy trucks, higher KV for 2S speed.</p>",
    specs: { Size: "36 x 52 mm (540)", Shaft: "5 mm", Cells: "2–3S LiPo" },
    inTheBox: ["Motor"],
    tags: ["motor", "brushless", "car"],
    variants: [
      { name: "3300KV", options: { KV: "3300KV" }, stock: 3 },
      { name: "4000KV", options: { KV: "4000KV" }, price: 7200, stock: 2 },
    ],
    daysAgo: 16,
  },
  {
    title: "Emax ES08MA II Metal Gear Micro Servo",
    category: "servos", brand: "Emax", price: 1450, cost: 800, skill: "BEGINNER", stock: 20,
    shape: "servo", color: "#2563eb",
    short: "12 g metal-gear servo for small planes, gliders and 1:18 cars.",
    description: "<p>Metal gears survive hard landings that strip plastic ones. A favourite for ailerons and elevators on park flyers.</p>",
    specs: { Weight: "12 g", Torque: "2.0 kg·cm @ 6V", Speed: "0.10 s/60° @ 6V", Gears: "Metal" },
    inTheBox: ["Servo", "Horns", "Screws"],
    tags: ["servo", "micro", "metal gear"],
    daysAgo: 7,
  },
  {
    title: "Savox SW-0231MG Waterproof Digital Servo 25kg",
    category: "servos", brand: "Savox", price: 9800, cost: 7200, skill: "EXPERT", stock: 4,
    shape: "servo", color: "#18181b",
    short: "High-torque waterproof steering servo for 1:10 and 1:8 bashers.",
    description: "<p>Digital, waterproof and strong enough to steer big tyres through mud and water.</p>",
    specs: { Torque: "25 kg·cm @ 7.4V", Speed: "0.15 s/60°", Gears: "Steel", Waterproof: "Yes" },
    inTheBox: ["Servo", "Aluminium horn", "Screws"],
    tags: ["servo", "waterproof", "steering"],
    daysAgo: 25,
  },
  {
    title: "XT60 Connectors (5 pairs)",
    category: "plugs-connectors", brand: "Amass", price: 650, cost: 250, skill: "BEGINNER", stock: 50,
    shape: "plug", color: "#facc15",
    short: "Genuine Amass XT60 male and female plugs, the standard for LiPo packs.",
    description: "<p>Gold-plated contacts and nylon housings that won't melt while soldering. Rated for 60A burst.</p>",
    specs: { Rating: "30A continuous / 60A burst", Quantity: "5 male + 5 female" },
    inTheBox: ["5 male plugs", "5 female plugs"],
    tags: ["xt60", "connector", "plug"],
    compatibleWith: ["Gens Ace 5000mAh 2S 7.4V 50C LiPo Battery", "Tattu R-Line 1550mAh 6S 120C LiPo"],
    daysAgo: 5,
  },
  {
    title: "Deans T-Plug Connectors (5 pairs)",
    category: "plugs-connectors", brand: "Generic", price: 600, cost: 250, skill: "BEGINNER", stock: 35,
    shape: "plug", color: "#dc2626",
    short: "Classic T-plugs for older cars and ESCs, with shrink tube included.",
    description: "<p>Low-resistance T-style plugs. Handy when your ESC and battery use different connectors.</p>",
    specs: { Rating: "50A", Quantity: "5 male + 5 female" },
    inTheBox: ["5 male plugs", "5 female plugs", "Heat-shrink tube"],
    tags: ["deans", "t-plug", "connector"],
    daysAgo: 30,
  },
  {
    title: "APC 10x4.7 Slow Flyer Propeller (2 pack)",
    category: "propellers", brand: "APC", price: 1100, cost: 600, skill: "BEGINNER", stock: 15,
    shape: "propeller", color: "#18181b",
    short: "Efficient slow-flyer props for trainers and park flyers.",
    description: "<p>Balanced straight from the factory, with adapter rings for common motor shafts.</p>",
    specs: { Size: "10 x 4.7 in", Type: "Slow flyer", Quantity: "2" },
    inTheBox: ["2 propellers", "Adapter rings"],
    tags: ["propeller", "plane"],
    daysAgo: 14,
  },
];
