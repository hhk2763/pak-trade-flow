// Which listed companies each trade flow bears on. This is the hypothesis the
// Signals page and the weekly report present to PSX analysts; it is deliberately
// short and conservative, and every mapping states *why* so a reader can
// disagree with it. Review it with analysts before quoting it to clients.

export interface Exposure {
  ticker: string;
  why: string;
}

export interface SignalTheme {
  id: string;
  name: string;
  // Omitted when the theme counts both directions (a terminal's throughput).
  direction?: "Import" | "Export";
  // Matched against vessel_calls.commodity_standard (upper-case).
  commodities: string[];
  // Restricts the theme to one terminal (PQ), for terminal-level throughput.
  terminal?: string;
  exposures: Exposure[];
  readAs: string;
}

export const SIGNAL_THEMES: SignalTheme[] = [
  {
    id: "coal",
    name: "Coal imports",
    direction: "Import",
    commodities: ["COAL", "PET COKE"],
    exposures: [
      { ticker: "LUCK", why: "Imported coal is the main kiln fuel; also owns a Port Qasim coal power plant" },
      { ticker: "DGKC", why: "Cement kiln fuel cost" },
      { ticker: "MLCF", why: "Cement kiln fuel cost" },
      { ticker: "FCCL", why: "Cement kiln fuel cost" },
      { ticker: "HUBC", why: "Imported-coal power generation" },
    ],
    readAs: "Rising arrivals ahead of a price move suggest stocking; falling arrivals with long anchorage waits suggest port, not demand, constraints.",
  },
  {
    id: "pibt",
    name: "PIBT terminal throughput",
    commodities: ["COAL", "PET COKE", "CLINKER", "CEMENT"],
    terminal: "PIBT",
    exposures: [
      { ticker: "PIBTL", why: "Revenue is volume-driven: this is the terminal's own cargo" },
    ],
    readAs: "Direct read on the listed terminal's handling volume, weeks before quarterly results.",
  },
  {
    id: "clinker",
    name: "Cement & clinker exports",
    direction: "Export",
    commodities: ["CLINKER", "CEMENT"],
    exposures: [
      { ticker: "LUCK", why: "Largest southern-zone exporter" },
      { ticker: "ACPL", why: "Southern plant, export-oriented" },
      { ticker: "POWER", why: "Southern plant, export-oriented" },
      { ticker: "DGKC", why: "Exports from its Hub plant" },
    ],
    readAs: "Export volume offsets weak local despatches; watch it against the APCMA monthly numbers.",
  },
  {
    id: "crude",
    name: "Crude oil imports",
    direction: "Import",
    commodities: ["CRUDE OIL"],
    exposures: [
      { ticker: "PRL", why: "Karachi refinery fed through KPT oil piers" },
      { ticker: "NRL", why: "Karachi refinery fed through KPT oil piers" },
      { ticker: "ATRL", why: "Refining sector read-across (inland crude mostly)" },
    ],
    readAs: "Proxy for refinery run rates: crude in now is product out over the next month.",
  },
  {
    id: "mogas",
    name: "Petrol & diesel imports",
    direction: "Import",
    commodities: ["MOGAS", "GAS OIL", "HSD", "JET FUEL"],
    exposures: [
      { ticker: "PSO", why: "Largest fuel importer and marketer" },
      { ticker: "APL", why: "Fuel marketer" },
      { ticker: "SHEL", why: "Fuel marketer" },
    ],
    readAs: "Product imports rise when local refining falls short of demand; pair with the crude signal.",
  },
  {
    id: "furnace-oil",
    name: "Furnace oil exports",
    direction: "Export",
    commodities: [
      "HSFO",
      "HIGH SULPHER FURNACE OIL (H.S.F.O.)",
      "LOW SULPHER FURNACE OIL (L.S.F.O.)",
      "FURNACE OIL",
    ],
    exposures: [
      { ticker: "PRL", why: "Furnace oil is a large share of output" },
      { ticker: "NRL", why: "Furnace oil is a large share of output" },
      { ticker: "ATRL", why: "Furnace oil is a large share of output" },
    ],
    readAs: "Refiners export surplus furnace oil when local power demand for it is weak; sustained exports keep runs from being cut.",
  },
  {
    id: "lng",
    name: "LNG imports",
    direction: "Import",
    commodities: ["LNG"],
    exposures: [
      { ticker: "SNGP", why: "Distributes regasified LNG (north)" },
      { ticker: "SSGC", why: "Distributes regasified LNG (south)" },
    ],
    readAs: "Cargo count matters more than tonnage: each one is a scheduled delivery under term contracts.",
  },
  {
    id: "fertilizer",
    name: "Fertilizer inputs",
    direction: "Import",
    commodities: [
      "DI AMMONIUM PHOSPHATE (DAP)",
      "ROCK PHOSPHATE",
      "PHOSP. ACID",
      "MOP",
      "AMMONIUM SULPHATE",
    ],
    exposures: [
      { ticker: "FFC", why: "DAP importer; Port Qasim DAP plant runs on imported phosphoric acid" },
      { ticker: "EFERT", why: "DAP importer and distributor" },
      { ticker: "FATIMA", why: "Phosphate fertilizer producer" },
    ],
    readAs: "Imports build ahead of the Rabi (Oct-Dec) and Kharif (Apr-Jun) sowing seasons.",
  },
  {
    id: "oilseeds",
    name: "Oilseeds & edible oil imports",
    direction: "Import",
    commodities: ["SOYBEAN SEED", "CANOLA SEED", "CANOLA", "PALM OIL", "PALM KERNEL OIL"],
    exposures: [
      { ticker: "UNITY", why: "Oilseed crusher and edible oil refiner" },
    ],
    readAs: "Mostly unlisted importers; the signal is for supply and price, with UNITY the listed read-across.",
  },
  {
    id: "petchem",
    name: "Petrochemical feedstock imports",
    direction: "Import",
    commodities: ["PARAXYLENE", "EDC", "ETHYLENE"],
    exposures: [
      { ticker: "EPCL", why: "Imports ethylene and EDC for its PVC plant" },
      { ticker: "LOTCHEM", why: "Imports paraxylene for its PTA plant" },
    ],
    readAs: "Feedstock arrivals track plant utilisation a few weeks ahead.",
  },
  {
    id: "steel",
    name: "Steel coil imports",
    direction: "Import",
    commodities: ["STEEL COIL"],
    exposures: [
      { ticker: "ISL", why: "Imports hot-rolled coil as raw material" },
      { ticker: "ASL", why: "Imports hot-rolled coil as raw material" },
    ],
    readAs: "Coil imports track downstream flat-steel demand (autos, appliances, pipes).",
  },
];
