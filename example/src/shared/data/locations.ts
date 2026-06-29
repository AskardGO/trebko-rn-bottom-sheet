export interface LocationItem {
  id: number;
  city: string;
  region: string;
  hasDelivery: boolean;
}

export const LOCATIONS: LocationItem[] = [
  { id: 1,  city: 'Kharkiv',         region: 'Kharkiv Oblast',          hasDelivery: true  },
  { id: 2,  city: 'Kyiv',            region: 'Kyiv City',               hasDelivery: true  },
  { id: 3,  city: 'Lviv',            region: 'Lviv Oblast',             hasDelivery: true  },
  { id: 4,  city: 'Odesa',           region: 'Odesa Oblast',            hasDelivery: true  },
  { id: 5,  city: 'Dnipro',          region: 'Dnipropetrovsk Oblast',   hasDelivery: true  },
  { id: 6,  city: 'Zaporizhzhia',    region: 'Zaporizhzhia Oblast',     hasDelivery: true  },
  { id: 7,  city: 'Vinnytsia',       region: 'Vinnytsia Oblast',        hasDelivery: true  },
  { id: 8,  city: 'Poltava',         region: 'Poltava Oblast',          hasDelivery: true  },
  { id: 9,  city: 'Chernihiv',       region: 'Chernihiv Oblast',        hasDelivery: false },
  { id: 10, city: 'Cherkasy',        region: 'Cherkasy Oblast',         hasDelivery: true  },
  { id: 11, city: 'Sumy',            region: 'Sumy Oblast',             hasDelivery: true  },
  { id: 12, city: 'Rivne',           region: 'Rivne Oblast',            hasDelivery: false },
  { id: 13, city: 'Ternopil',        region: 'Ternopil Oblast',         hasDelivery: true  },
  { id: 14, city: 'Lutsk',           region: 'Volyn Oblast',            hasDelivery: false },
  { id: 15, city: 'Uzhhorod',        region: 'Zakarpattia Oblast',      hasDelivery: true  },
  { id: 16, city: 'Ivano-Frankivsk', region: 'Ivano-Frankivsk Oblast',  hasDelivery: true  },
  { id: 17, city: 'Khmelnytskyi',    region: 'Khmelnytskyi Oblast',     hasDelivery: false },
  { id: 18, city: 'Mykolaiv',        region: 'Mykolaiv Oblast',         hasDelivery: true  },
  { id: 19, city: 'Kherson',         region: 'Kherson Oblast',          hasDelivery: false },
  { id: 20, city: 'Zhytomyr',        region: 'Zhytomyr Oblast',         hasDelivery: true  },
  { id: 21, city: 'Kramatorsk',      region: 'Donetsk Oblast',          hasDelivery: false },
  { id: 22, city: 'Mariupol',        region: 'Donetsk Oblast',          hasDelivery: false },
  { id: 23, city: 'Brovary',         region: 'Kyiv Oblast',             hasDelivery: true  },
  { id: 24, city: 'Bila Tserkva',    region: 'Kyiv Oblast',             hasDelivery: true  },
  { id: 25, city: 'Kryvyi Rih',      region: 'Dnipropetrovsk Oblast',   hasDelivery: true  },
];
