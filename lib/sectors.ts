// Sector definitions: which port cargo matters to which listed companies.
//
// Client-safe (no server imports) so charts and filters can use it too.
//
// The tickers are an editorial judgement about who is exposed to a cargo, not
// a data feed. Review them before publishing: listings, mergers and renames
// change, and a wrong ticker in front of an analyst costs more credibility
// than a missing one.

export type Direction = "Import" | "Export";

export interface SeriesDef {
  key: string;
  label: string;
  direction: Direction;
  /** commodity_standard values (upper case) that belong to this series. */
  standards: string[];
  /** Restrict to these terminals (PQ berth codes), if set. */
  terminals?: string[];
  /**
   * "mt" sums tonnage. "calls" counts cargoes instead, for commodities whose
   * tonnage the ports report unreliably (LNG is often keyed in cubic metres).
   */
  unit: "mt" | "calls";
  /** One line an analyst can act on: why this number moves earnings. */
  why: string;
}

export interface Sector {
  slug: string;
  name: string;
  icon: string; // Material Symbols name
  tickers: string[];
  summary: string;
  series: SeriesDef[];
}

export const SECTORS: Sector[] = [
  {
    slug: "cement",
    name: "Cement",
    icon: "foundation",
    tickers: ["LUCK", "DGKC", "MLCF", "FCCL", "CHCC", "KOHC", "PIOC", "ACPL", "POWER"],
    summary:
      "Imported coal is the largest input cost for southern producers; seaborne cement and clinker exports are the swing volume when local demand is soft.",
    series: [
      {
        key: "coal-imports",
        label: "Coal imports",
        direction: "Import",
        standards: ["COAL", "PET COKE"],
        unit: "mt",
        why: "Fuel is the biggest cost line for kilns; arrivals lead inventory cost by one to two months.",
      },
      {
        key: "cement-exports",
        label: "Cement exports",
        direction: "Export",
        standards: ["CEMENT"],
        unit: "mt",
        why: "Seaborne dispatches by southern plants, visible here before the monthly industry release.",
      },
      {
        key: "clinker-exports",
        label: "Clinker exports",
        direction: "Export",
        standards: ["CLINKER"],
        unit: "mt",
        why: "Lower-margin volume used to keep kilns running; rising clinker share signals weak domestic offtake.",
      },
    ],
  },
  {
    slug: "oil-refining-marketing",
    name: "Oil refining & marketing",
    icon: "local_gas_station",
    tickers: ["PSO", "APL", "WAFI", "ATRL", "NRL", "PRL", "CNERGY"],
    summary:
      "Crude arrivals show refinery throughput; product imports show how much of demand refiners are not meeting; furnace oil exports show how refiners are clearing surplus.",
    series: [
      {
        key: "crude-imports",
        label: "Crude oil imports",
        direction: "Import",
        standards: ["CRUDE OIL"],
        unit: "mt",
        why: "A direct read on refinery run rates for the coastal refineries.",
      },
      {
        key: "gasoline-imports",
        label: "Petrol (mogas) imports",
        direction: "Import",
        standards: ["MOGAS", "GASOLINE"],
        unit: "mt",
        why: "Import parcels are dominated by the large marketers; volume tracks retail demand and stock builds.",
      },
      {
        key: "diesel-imports",
        label: "Diesel (gas oil) imports",
        direction: "Import",
        standards: ["GAS OIL", "HSD", "HIGH SPEED DIESEL"],
        unit: "mt",
        why: "Diesel demand follows freight and farm activity; import swings move marketer inventory gains.",
      },
      {
        key: "furnace-oil-exports",
        label: "Furnace oil exports",
        direction: "Export",
        standards: [
          "HSFO",
          "LSFO",
          "FURNACE OIL",
          "HIGH SULPHER FURNACE OIL (H.S.F.O.)",
          "LOW SULPHER FURNACE OIL (L.S.F.O.)",
        ],
        unit: "mt",
        why: "Refiners export furnace oil at a discount when local power demand cannot absorb it; a drag on margins.",
      },
    ],
  },
  {
    slug: "gas",
    name: "LNG & LPG",
    icon: "propane_tank",
    tickers: ["PSO", "SSGC", "SNGP"],
    summary:
      "LNG cargo count drives regasification volume and circular-debt receivables; LPG parcels track the retail cylinder market.",
    series: [
      {
        key: "lng-cargoes",
        label: "LNG cargoes",
        direction: "Import",
        standards: ["LNG"],
        unit: "calls",
        why: "Counted as cargoes: the ports record LNG volume inconsistently, but a cargo is a cargo.",
      },
      {
        key: "lpg-imports",
        label: "LPG imports",
        direction: "Import",
        standards: ["LPG"],
        unit: "mt",
        why: "Seaborne LPG supplements local production in winter; parcels are small and frequent.",
      },
    ],
  },
  {
    slug: "edible-oil-oilseeds",
    name: "Edible oil & oilseeds",
    icon: "water_drop",
    tickers: ["UNITY"],
    summary:
      "Palm oil is the country's largest food import; soybean and canola feed the crushing and poultry-feed chain.",
    series: [
      {
        key: "palm-oil-imports",
        label: "Palm oil imports",
        direction: "Import",
        standards: ["PALM OIL", "PALM OLEIN", "PALM KERNEL OIL"],
        unit: "mt",
        why: "Arrivals set refiners' inventory cost roughly a month ahead of shelf prices.",
      },
      {
        key: "soybean-imports",
        label: "Soybean seed imports",
        direction: "Import",
        standards: ["SOYBEAN SEED"],
        unit: "mt",
        why: "Feeds solvent extractors; meal availability drives poultry feed costs.",
      },
      {
        key: "canola-imports",
        label: "Canola seed imports",
        direction: "Import",
        standards: ["CANOLA SEED", "RAPESEED"],
        unit: "mt",
        why: "The alternative crush; substitution with soybean shows up here first.",
      },
    ],
  },
  {
    slug: "steel",
    name: "Steel",
    icon: "construction",
    tickers: ["ISL", "ASL", "MUGHAL", "ASTL", "AGHA"],
    summary:
      "Hot-rolled coil is the raw material for the flat-steel makers. Scrap for long-steel makers moves in containers and is not visible in this data.",
    series: [
      {
        key: "steel-coil-imports",
        label: "Steel coil imports",
        direction: "Import",
        standards: ["STEEL COIL", "STEEL PRODUCTS", "HR STEEL", "STEEL PLATE"],
        unit: "mt",
        why: "Raw-material intake for cold-rolling mills, and a gauge of finished flat-steel import competition.",
      },
    ],
  },
  {
    slug: "fertilizer",
    name: "Fertilizer",
    icon: "grass",
    tickers: ["FFC", "EFERT", "FATIMA"],
    summary:
      "DAP is largely imported, and phosphoric acid feeds local DAP production at Port Qasim. Arrivals ahead of the sowing seasons set channel inventory.",
    series: [
      {
        key: "dap-imports",
        label: "DAP & fertilizer imports",
        direction: "Import",
        standards: ["DI AMMONIUM PHOSPHATE (DAP)", "DAP", "FERTILIZER", "UREA", "MURIATE OF POTASH (MOP)"],
        unit: "mt",
        why: "Import arrivals before Rabi and Kharif determine whether the market is long or short.",
      },
      {
        key: "phos-acid-imports",
        label: "Phosphoric acid & rock phosphate",
        direction: "Import",
        standards: ["PHOSPHORIC ACID", "PHOSP. ACID", "ROCK PHOSPHATE"],
        unit: "mt",
        why: "Feedstock for domestic DAP production; steady parcels mean the plant is running.",
      },
    ],
  },
  {
    slug: "chemicals",
    name: "Chemicals",
    icon: "science",
    tickers: ["EPCL", "LOTCHEM"],
    summary:
      "Feedstock parcels for the PVC and PTA chains arrive at the Port Qasim chemical terminal on a regular cycle; a missed parcel means a plant outage.",
    series: [
      {
        key: "pvc-feedstock",
        label: "PVC feedstock (ethylene, EDC, VCM)",
        direction: "Import",
        standards: ["ETHYLENE", "EDC", "VCM"],
        unit: "mt",
        why: "Ethylene and EDC intake tracks PVC plant utilisation.",
      },
      {
        key: "pta-feedstock",
        label: "PTA feedstock (paraxylene, acetic acid)",
        direction: "Import",
        standards: ["PARAXYLENE", "ACETIC ACID"],
        unit: "mt",
        why: "Paraxylene parcels track PTA plant run rates.",
      },
    ],
  },
  {
    slug: "food-agri",
    name: "Rice, wheat & sugar",
    icon: "rice_bowl",
    tickers: ["MATCO"],
    summary:
      "Rice is the largest bulk export; wheat and sugar imports appear only in deficit years and move food inflation expectations.",
    series: [
      {
        key: "rice-exports",
        label: "Rice exports (break-bulk)",
        direction: "Export",
        standards: ["RICE"],
        unit: "mt",
        why: "Bulk and bagged vessels only; containerised basmati is not visible here.",
      },
      {
        key: "wheat-imports",
        label: "Wheat imports",
        direction: "Import",
        standards: ["WHEAT"],
        unit: "mt",
        why: "Government and private wheat cargoes; a leading signal for flour prices.",
      },
    ],
  },
  {
    slug: "port-terminals",
    name: "Port terminals",
    icon: "anchor",
    tickers: ["PIBTL"],
    summary:
      "Pakistan International Bulk Terminal earns a per-tonne tariff, so cargo over its berth is close to a direct revenue estimate.",
    series: [
      {
        key: "pibt-cargo",
        label: "PIBT cargo handled",
        direction: "Import",
        standards: [],
        terminals: ["PIBT"],
        unit: "mt",
        why: "Coal dominates; tonnage times tariff approximates quarterly handling revenue.",
      },
    ],
  },
];

export function findSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

export const PORT_NAMES: Record<string, string> = {
  PQ: "Port Qasim",
  KPT: "Karachi Port",
};
