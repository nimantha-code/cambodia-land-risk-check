export const cambodiaBounds = {
  minLng: 102.3,
  maxLng: 107.8,
  minLat: 10.3,
  maxLat: 14.8
};

export const cambodiaOutline = [
  [102.35, 13.62],
  [102.85, 14.2],
  [103.45, 14.38],
  [104.15, 14.35],
  [104.86, 14.43],
  [105.55, 14.6],
  [106.2, 14.42],
  [106.75, 14.05],
  [107.48, 14.36],
  [107.54, 13.72],
  [107.36, 13.05],
  [107.62, 12.45],
  [107.22, 11.85],
  [106.62, 11.42],
  [105.9, 11.12],
  [105.22, 10.88],
  [104.55, 10.48],
  [103.96, 10.38],
  [103.55, 10.66],
  [103.22, 10.98],
  [102.92, 11.58],
  [102.56, 12.16],
  [102.35, 13.62]
];

export const localGazetteer = [
  { name: "Phnom Penh", lat: 11.5564, lng: 104.9282 },
  { name: "Siem Reap", lat: 13.3671, lng: 103.8448 },
  { name: "Battambang", lat: 13.0957, lng: 103.2022 },
  { name: "Sihanoukville", lat: 10.6253, lng: 103.5234 },
  { name: "Kampong Thom", lat: 12.7111, lng: 104.8887 },
  { name: "Kratie", lat: 12.4881, lng: 106.0188 },
  { name: "Mondulkiri / Sen Monorom", lat: 12.4558, lng: 107.1881 },
  { name: "Ratanakiri / Banlung", lat: 13.7394, lng: 106.9873 },
  { name: "Koh Kong", lat: 11.6175, lng: 102.9806 },
  { name: "Stung Treng", lat: 13.5259, lng: 105.9683 },
  { name: "Preah Vihear", lat: 13.8073, lng: 104.9805 },
  { name: "Pursat", lat: 12.5388, lng: 103.9192 }
];

export const waterBodies = [
  {
    id: "tonle-sap",
    name: "Tonle Sap Lake",
    polygon: [
      [103.35, 13.34],
      [103.74, 13.48],
      [104.22, 13.27],
      [104.53, 12.9],
      [104.44, 12.5],
      [104.07, 12.2],
      [103.62, 12.18],
      [103.24, 12.46],
      [103.13, 12.89],
      [103.35, 13.34]
    ]
  },
  {
    id: "coast",
    name: "Gulf of Thailand",
    polygon: [
      [102.45, 10.28],
      [104.0, 10.28],
      [104.02, 10.6],
      [103.54, 10.55],
      [103.08, 10.65],
      [102.78, 10.95],
      [102.45, 10.9],
      [102.45, 10.28]
    ]
  }
];

export const rivers = [
  {
    id: "mekong",
    name: "Mekong River",
    points: [
      [105.9, 14.55],
      [105.98, 13.95],
      [105.87, 13.54],
      [106.02, 13.0],
      [105.98, 12.49],
      [105.73, 12.05],
      [105.35, 11.73],
      [105.08, 11.55],
      [105.0, 11.05],
      [105.12, 10.58]
    ]
  },
  {
    id: "tonle-sap-river",
    name: "Tonle Sap River",
    points: [
      [104.25, 12.55],
      [104.55, 12.27],
      [104.73, 11.95],
      [104.93, 11.56]
    ]
  },
  {
    id: "bassac",
    name: "Bassac River",
    points: [
      [104.93, 11.56],
      [105.08, 11.24],
      [105.05, 10.8],
      [105.02, 10.45]
    ]
  },
  {
    id: "stung-sen",
    name: "Stung Sen",
    points: [
      [104.8, 13.35],
      [104.72, 12.95],
      [104.58, 12.72],
      [104.42, 12.55]
    ]
  }
];

export const roads = [
  {
    id: "pp-siem-reap",
    points: [
      [104.9282, 11.5564],
      [104.8887, 12.7111],
      [103.8448, 13.3671]
    ]
  },
  {
    id: "pp-battambang",
    points: [
      [104.9282, 11.5564],
      [104.58, 12.24],
      [103.9192, 12.5388],
      [103.2022, 13.0957]
    ]
  },
  {
    id: "pp-coast",
    points: [
      [104.9282, 11.5564],
      [104.25, 11.25],
      [103.5234, 10.6253]
    ]
  },
  {
    id: "east-corridor",
    points: [
      [104.9282, 11.5564],
      [106.0188, 12.4881],
      [107.1881, 12.4558],
      [106.9873, 13.7394]
    ]
  }
];

export const terrainBands = [
  {
    id: "cardamom-relief",
    polygon: [
      [102.45, 12.32],
      [103.32, 12.78],
      [104.08, 12.28],
      [104.3, 11.42],
      [103.55, 10.62],
      [102.58, 10.9],
      [102.45, 12.32]
    ]
  },
  {
    id: "eastern-highlands",
    polygon: [
      [106.2, 14.45],
      [107.55, 14.45],
      [107.55, 12.05],
      [106.72, 11.55],
      [106.1, 12.12],
      [106.2, 14.45]
    ]
  },
  {
    id: "northern-uplands",
    polygon: [
      [103.05, 14.45],
      [105.7, 14.55],
      [105.52, 13.78],
      [103.78, 13.42],
      [103.05, 14.45]
    ]
  }
];

export const protectedAreas = [
  {
    id: "keo-seima",
    name: "Keo Seima Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Mondulkiri / Kratie",
    confidence: "starter",
    polygon: [
      [106.55, 12.9],
      [107.1, 12.95],
      [107.36, 12.64],
      [107.28, 12.2],
      [106.86, 11.84],
      [106.45, 12.04],
      [106.32, 12.46],
      [106.55, 12.9]
    ]
  },
  {
    id: "phnom-prich",
    name: "Phnom Prich Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Mondulkiri",
    confidence: "starter",
    polygon: [
      [105.95, 13.05],
      [106.55, 13.1],
      [106.83, 12.76],
      [106.7, 12.3],
      [106.2, 12.13],
      [105.86, 12.45],
      [105.95, 13.05]
    ]
  },
  {
    id: "lomphat",
    name: "Lomphat Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Ratanakiri / Mondulkiri",
    confidence: "starter",
    polygon: [
      [106.58, 13.7],
      [107.16, 13.63],
      [107.31, 13.18],
      [106.92, 12.9],
      [106.48, 13.06],
      [106.35, 13.45],
      [106.58, 13.7]
    ]
  },
  {
    id: "virachey",
    name: "Virachey National Park",
    category: "National park",
    province: "Ratanakiri / Stung Treng",
    confidence: "starter",
    polygon: [
      [106.45, 14.45],
      [107.4, 14.42],
      [107.52, 14.08],
      [107.1, 13.82],
      [106.45, 13.95],
      [106.45, 14.45]
    ]
  },
  {
    id: "prey-lang",
    name: "Prey Lang Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Kampong Thom / Kratie / Stung Treng / Preah Vihear",
    confidence: "starter",
    polygon: [
      [104.65, 13.45],
      [105.55, 13.42],
      [105.92, 13.04],
      [105.72, 12.55],
      [105.18, 12.2],
      [104.58, 12.38],
      [104.35, 12.95],
      [104.65, 13.45]
    ]
  },
  {
    id: "kulen-promtep",
    name: "Kulen Promtep Wildlife Sanctuary",
    category: "Wildlife sanctuary",
    province: "Preah Vihear / Oddar Meanchey / Siem Reap",
    confidence: "starter",
    polygon: [
      [103.95, 14.35],
      [104.86, 14.32],
      [105.1, 13.82],
      [104.55, 13.42],
      [103.85, 13.68],
      [103.72, 14.08],
      [103.95, 14.35]
    ]
  },
  {
    id: "central-cardamom",
    name: "Central Cardamom Mountains National Park",
    category: "National park",
    province: "Koh Kong / Pursat / Kampong Speu",
    confidence: "starter",
    polygon: [
      [102.75, 12.18],
      [103.62, 12.42],
      [104.15, 12.08],
      [104.08, 11.45],
      [103.42, 11.05],
      [102.82, 11.3],
      [102.58, 11.82],
      [102.75, 12.18]
    ]
  },
  {
    id: "botum-sakor",
    name: "Botum Sakor National Park",
    category: "National park",
    province: "Koh Kong",
    confidence: "starter",
    polygon: [
      [103.05, 11.3],
      [103.78, 11.22],
      [103.94, 10.82],
      [103.5, 10.55],
      [103.05, 10.66],
      [102.9, 10.98],
      [103.05, 11.3]
    ]
  }
];
