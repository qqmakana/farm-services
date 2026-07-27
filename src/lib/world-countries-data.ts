/** ISO countries seed — builds the global Village Ride country catalog. */
export type WorldCountrySeed = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  phoneLocalDigits: number;
  mapCenter: { lat: number; lng: number };
};

export const WORLD_COUNTRY_SEEDS: WorldCountrySeed[] = [
  {
    "code": "AF",
    "name": "Afghanistan",
    "flag": "🇦🇫",
    "currency": "AFN",
    "currencySymbol": "؋",
    "phonePrefix": "93",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 34.5553,
      "lng": 69.2075
    }
  },
  {
    "code": "AL",
    "name": "Albania",
    "flag": "🇦🇱",
    "currency": "ALL",
    "currencySymbol": "L",
    "phonePrefix": "355",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 41.3275,
      "lng": 19.8187
    }
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "flag": "🇩🇿",
    "currency": "DZD",
    "currencySymbol": "دج",
    "phonePrefix": "213",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 36.7538,
      "lng": 3.0588
    }
  },
  {
    "code": "AD",
    "name": "Andorra",
    "flag": "🇦🇩",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "376",
    "phoneLocalDigits": 6,
    "mapCenter": {
      "lat": 42.5063,
      "lng": 1.5218
    }
  },
  {
    "code": "AO",
    "name": "Angola",
    "flag": "🇦🇴",
    "currency": "AOA",
    "currencySymbol": "Kz",
    "phonePrefix": "244",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -8.839,
      "lng": 13.2894
    }
  },
  {
    "code": "AG",
    "name": "Antigua and Barbuda",
    "flag": "🇦🇬",
    "currency": "XCD",
    "currencySymbol": "$",
    "phonePrefix": "1268",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 17.0608,
      "lng": -61.7964
    }
  },
  {
    "code": "AR",
    "name": "Argentina",
    "flag": "🇦🇷",
    "currency": "ARS",
    "currencySymbol": "$",
    "phonePrefix": "54",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": -34.6037,
      "lng": -58.3816
    }
  },
  {
    "code": "AM",
    "name": "Armenia",
    "flag": "🇦🇲",
    "currency": "AMD",
    "currencySymbol": "֏",
    "phonePrefix": "374",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 40.1792,
      "lng": 44.4991
    }
  },
  {
    "code": "AU",
    "name": "Australia",
    "flag": "🇦🇺",
    "currency": "AUD",
    "currencySymbol": "A$",
    "phonePrefix": "61",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -35.2809,
      "lng": 149.13
    }
  },
  {
    "code": "AT",
    "name": "Austria",
    "flag": "🇦🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "43",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 48.2082,
      "lng": 16.3738
    }
  },
  {
    "code": "AZ",
    "name": "Azerbaijan",
    "flag": "🇦🇿",
    "currency": "AZN",
    "currencySymbol": "₼",
    "phonePrefix": "994",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 40.4093,
      "lng": 49.8671
    }
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "flag": "🇧🇸",
    "currency": "BSD",
    "currencySymbol": "B$",
    "phonePrefix": "1242",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 25.0343,
      "lng": -77.3963
    }
  },
  {
    "code": "BH",
    "name": "Bahrain",
    "flag": "🇧🇭",
    "currency": "BHD",
    "currencySymbol": ".د.ب",
    "phonePrefix": "973",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 26.2285,
      "lng": 50.586
    }
  },
  {
    "code": "BD",
    "name": "Bangladesh",
    "flag": "🇧🇩",
    "currency": "BDT",
    "currencySymbol": "৳",
    "phonePrefix": "880",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 23.8103,
      "lng": 90.4125
    }
  },
  {
    "code": "BB",
    "name": "Barbados",
    "flag": "🇧🇧",
    "currency": "BBD",
    "currencySymbol": "Bds$",
    "phonePrefix": "1246",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 13.0969,
      "lng": -59.6145
    }
  },
  {
    "code": "BY",
    "name": "Belarus",
    "flag": "🇧🇾",
    "currency": "BYN",
    "currencySymbol": "Br",
    "phonePrefix": "375",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 53.9006,
      "lng": 27.559
    }
  },
  {
    "code": "BE",
    "name": "Belgium",
    "flag": "🇧🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "32",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 50.8503,
      "lng": 4.3517
    }
  },
  {
    "code": "BZ",
    "name": "Belize",
    "flag": "🇧🇿",
    "currency": "BZD",
    "currencySymbol": "BZ$",
    "phonePrefix": "501",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 17.251,
      "lng": -88.759
    }
  },
  {
    "code": "BJ",
    "name": "Benin",
    "flag": "🇧🇯",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "229",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 6.4969,
      "lng": 2.6289
    }
  },
  {
    "code": "BT",
    "name": "Bhutan",
    "flag": "🇧🇹",
    "currency": "BTN",
    "currencySymbol": "Nu",
    "phonePrefix": "975",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 27.4728,
      "lng": 89.639
    }
  },
  {
    "code": "BO",
    "name": "Bolivia",
    "flag": "🇧🇴",
    "currency": "BOB",
    "currencySymbol": "Bs",
    "phonePrefix": "591",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -16.4897,
      "lng": -68.1193
    }
  },
  {
    "code": "BA",
    "name": "Bosnia and Herzegovina",
    "flag": "🇧🇦",
    "currency": "BAM",
    "currencySymbol": "KM",
    "phonePrefix": "387",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 43.8563,
      "lng": 18.4131
    }
  },
  {
    "code": "BW",
    "name": "Botswana",
    "flag": "🇧🇼",
    "currency": "BWP",
    "currencySymbol": "P",
    "phonePrefix": "267",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -24.6282,
      "lng": 25.9231
    }
  },
  {
    "code": "BR",
    "name": "Brazil",
    "flag": "🇧🇷",
    "currency": "BRL",
    "currencySymbol": "R$",
    "phonePrefix": "55",
    "phoneLocalDigits": 11,
    "mapCenter": {
      "lat": -23.5505,
      "lng": -46.6333
    }
  },
  {
    "code": "BN",
    "name": "Brunei",
    "flag": "🇧🇳",
    "currency": "BND",
    "currencySymbol": "B$",
    "phonePrefix": "673",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 4.9031,
      "lng": 114.9398
    }
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "flag": "🇧🇬",
    "currency": "BGN",
    "currencySymbol": "лв",
    "phonePrefix": "359",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 42.6977,
      "lng": 23.3219
    }
  },
  {
    "code": "BF",
    "name": "Burkina Faso",
    "flag": "🇧🇫",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "226",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 12.3714,
      "lng": -1.5197
    }
  },
  {
    "code": "BI",
    "name": "Burundi",
    "flag": "🇧🇮",
    "currency": "BIF",
    "currencySymbol": "FBu",
    "phonePrefix": "257",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -3.3614,
      "lng": 29.3599
    }
  },
  {
    "code": "CV",
    "name": "Cabo Verde",
    "flag": "🇨🇻",
    "currency": "CVE",
    "currencySymbol": "$",
    "phonePrefix": "238",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 14.9331,
      "lng": -23.5133
    }
  },
  {
    "code": "KH",
    "name": "Cambodia",
    "flag": "🇰🇭",
    "currency": "KHR",
    "currencySymbol": "៛",
    "phonePrefix": "855",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 11.5564,
      "lng": 104.9282
    }
  },
  {
    "code": "CM",
    "name": "Cameroon",
    "flag": "🇨🇲",
    "currency": "XAF",
    "currencySymbol": "FCFA",
    "phonePrefix": "237",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 3.848,
      "lng": 11.5021
    }
  },
  {
    "code": "CA",
    "name": "Canada",
    "flag": "🇨🇦",
    "currency": "CAD",
    "currencySymbol": "C$",
    "phonePrefix": "1",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 45.4215,
      "lng": -75.6972
    }
  },
  {
    "code": "CF",
    "name": "Central African Republic",
    "flag": "🇨🇫",
    "currency": "XAF",
    "currencySymbol": "FCFA",
    "phonePrefix": "236",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 4.3947,
      "lng": 18.5582
    }
  },
  {
    "code": "TD",
    "name": "Chad",
    "flag": "🇹🇩",
    "currency": "XAF",
    "currencySymbol": "FCFA",
    "phonePrefix": "235",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 12.1348,
      "lng": 15.0557
    }
  },
  {
    "code": "CL",
    "name": "Chile",
    "flag": "🇨🇱",
    "currency": "CLP",
    "currencySymbol": "$",
    "phonePrefix": "56",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -33.4489,
      "lng": -70.6693
    }
  },
  {
    "code": "CN",
    "name": "China",
    "flag": "🇨🇳",
    "currency": "CNY",
    "currencySymbol": "¥",
    "phonePrefix": "86",
    "phoneLocalDigits": 11,
    "mapCenter": {
      "lat": 39.9042,
      "lng": 116.4074
    }
  },
  {
    "code": "CO",
    "name": "Colombia",
    "flag": "🇨🇴",
    "currency": "COP",
    "currencySymbol": "$",
    "phonePrefix": "57",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 4.711,
      "lng": -74.0721
    }
  },
  {
    "code": "KM",
    "name": "Comoros",
    "flag": "🇰🇲",
    "currency": "KMF",
    "currencySymbol": "CF",
    "phonePrefix": "269",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -11.7172,
      "lng": 43.2473
    }
  },
  {
    "code": "CG",
    "name": "Congo",
    "flag": "🇨🇬",
    "currency": "XAF",
    "currencySymbol": "FCFA",
    "phonePrefix": "242",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -4.2634,
      "lng": 15.2429
    }
  },
  {
    "code": "CD",
    "name": "DR Congo",
    "flag": "🇨🇩",
    "currency": "CDF",
    "currencySymbol": "FC",
    "phonePrefix": "243",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -4.4419,
      "lng": 15.2663
    }
  },
  {
    "code": "CR",
    "name": "Costa Rica",
    "flag": "🇨🇷",
    "currency": "CRC",
    "currencySymbol": "₡",
    "phonePrefix": "506",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 9.9281,
      "lng": -84.0907
    }
  },
  {
    "code": "CI",
    "name": "Cote d'Ivoire",
    "flag": "🇨🇮",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "225",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 5.36,
      "lng": -4.0083
    }
  },
  {
    "code": "HR",
    "name": "Croatia",
    "flag": "🇭🇷",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "385",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 45.815,
      "lng": 15.9819
    }
  },
  {
    "code": "CU",
    "name": "Cuba",
    "flag": "🇨🇺",
    "currency": "CUP",
    "currencySymbol": "$",
    "phonePrefix": "53",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 23.1136,
      "lng": -82.3666
    }
  },
  {
    "code": "CY",
    "name": "Cyprus",
    "flag": "🇨🇾",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "357",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 35.1856,
      "lng": 33.3823
    }
  },
  {
    "code": "CZ",
    "name": "Czechia",
    "flag": "🇨🇿",
    "currency": "CZK",
    "currencySymbol": "Kč",
    "phonePrefix": "420",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 50.0755,
      "lng": 14.4378
    }
  },
  {
    "code": "DK",
    "name": "Denmark",
    "flag": "🇩🇰",
    "currency": "DKK",
    "currencySymbol": "kr",
    "phonePrefix": "45",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 55.6761,
      "lng": 12.5683
    }
  },
  {
    "code": "DJ",
    "name": "Djibouti",
    "flag": "🇩🇯",
    "currency": "DJF",
    "currencySymbol": "Fdj",
    "phonePrefix": "253",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 11.5721,
      "lng": 43.1456
    }
  },
  {
    "code": "DM",
    "name": "Dominica",
    "flag": "🇩🇲",
    "currency": "XCD",
    "currencySymbol": "$",
    "phonePrefix": "1767",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 15.301,
      "lng": -61.388
    }
  },
  {
    "code": "DO",
    "name": "Dominican Republic",
    "flag": "🇩🇴",
    "currency": "DOP",
    "currencySymbol": "RD$",
    "phonePrefix": "1809",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 18.4861,
      "lng": -69.9312
    }
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "flag": "🇪🇨",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "593",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -0.1807,
      "lng": -78.4678
    }
  },
  {
    "code": "EG",
    "name": "Egypt",
    "flag": "🇪🇬",
    "currency": "EGP",
    "currencySymbol": "E£",
    "phonePrefix": "20",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 30.0444,
      "lng": 31.2357
    }
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "flag": "🇸🇻",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "503",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 13.6929,
      "lng": -89.2182
    }
  },
  {
    "code": "GQ",
    "name": "Equatorial Guinea",
    "flag": "🇬🇶",
    "currency": "XAF",
    "currencySymbol": "FCFA",
    "phonePrefix": "240",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 3.7504,
      "lng": 8.7371
    }
  },
  {
    "code": "ER",
    "name": "Eritrea",
    "flag": "🇪🇷",
    "currency": "ERN",
    "currencySymbol": "Nfk",
    "phonePrefix": "291",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 15.3229,
      "lng": 38.9251
    }
  },
  {
    "code": "EE",
    "name": "Estonia",
    "flag": "🇪🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "372",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 59.4371,
      "lng": 24.7536
    }
  },
  {
    "code": "SZ",
    "name": "Eswatini",
    "flag": "🇸🇿",
    "currency": "SZL",
    "currencySymbol": "E",
    "phonePrefix": "268",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -26.3054,
      "lng": 31.1367
    }
  },
  {
    "code": "ET",
    "name": "Ethiopia",
    "flag": "🇪🇹",
    "currency": "ETB",
    "currencySymbol": "Br",
    "phonePrefix": "251",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 9.032,
      "lng": 38.7469
    }
  },
  {
    "code": "FJ",
    "name": "Fiji",
    "flag": "🇫🇯",
    "currency": "FJD",
    "currencySymbol": "FJ$",
    "phonePrefix": "679",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -18.1416,
      "lng": 178.4419
    }
  },
  {
    "code": "FI",
    "name": "Finland",
    "flag": "🇫🇮",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "358",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 60.1699,
      "lng": 24.9384
    }
  },
  {
    "code": "FR",
    "name": "France",
    "flag": "🇫🇷",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "33",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 48.8566,
      "lng": 2.3522
    }
  },
  {
    "code": "GA",
    "name": "Gabon",
    "flag": "🇬🇦",
    "currency": "XAF",
    "currencySymbol": "FCFA",
    "phonePrefix": "241",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 0.4162,
      "lng": 9.4673
    }
  },
  {
    "code": "GM",
    "name": "Gambia",
    "flag": "🇬🇲",
    "currency": "GMD",
    "currencySymbol": "D",
    "phonePrefix": "220",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 13.4549,
      "lng": -16.579
    }
  },
  {
    "code": "GE",
    "name": "Georgia",
    "flag": "🇬🇪",
    "currency": "GEL",
    "currencySymbol": "₾",
    "phonePrefix": "995",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 41.7151,
      "lng": 44.8271
    }
  },
  {
    "code": "DE",
    "name": "Germany",
    "flag": "🇩🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "49",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 52.52,
      "lng": 13.405
    }
  },
  {
    "code": "GH",
    "name": "Ghana",
    "flag": "🇬🇭",
    "currency": "GHS",
    "currencySymbol": "GH₵",
    "phonePrefix": "233",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 5.6037,
      "lng": -0.187
    }
  },
  {
    "code": "GR",
    "name": "Greece",
    "flag": "🇬🇷",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "30",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 37.9838,
      "lng": 23.7275
    }
  },
  {
    "code": "GD",
    "name": "Grenada",
    "flag": "🇬🇩",
    "currency": "XCD",
    "currencySymbol": "$",
    "phonePrefix": "1473",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 12.0561,
      "lng": -61.7486
    }
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "flag": "🇬🇹",
    "currency": "GTQ",
    "currencySymbol": "Q",
    "phonePrefix": "502",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 14.6349,
      "lng": -90.5069
    }
  },
  {
    "code": "GN",
    "name": "Guinea",
    "flag": "🇬🇳",
    "currency": "GNF",
    "currencySymbol": "FG",
    "phonePrefix": "224",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 9.6412,
      "lng": -13.5784
    }
  },
  {
    "code": "GW",
    "name": "Guinea-Bissau",
    "flag": "🇬🇼",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "245",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 11.8636,
      "lng": -15.5977
    }
  },
  {
    "code": "GY",
    "name": "Guyana",
    "flag": "🇬🇾",
    "currency": "GYD",
    "currencySymbol": "$",
    "phonePrefix": "592",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 6.8013,
      "lng": -58.1551
    }
  },
  {
    "code": "HT",
    "name": "Haiti",
    "flag": "🇭🇹",
    "currency": "HTG",
    "currencySymbol": "G",
    "phonePrefix": "509",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 18.5944,
      "lng": -72.3074
    }
  },
  {
    "code": "HN",
    "name": "Honduras",
    "flag": "🇭🇳",
    "currency": "HNL",
    "currencySymbol": "L",
    "phonePrefix": "504",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 14.0723,
      "lng": -87.1921
    }
  },
  {
    "code": "HU",
    "name": "Hungary",
    "flag": "🇭🇺",
    "currency": "HUF",
    "currencySymbol": "Ft",
    "phonePrefix": "36",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 47.4979,
      "lng": 19.0402
    }
  },
  {
    "code": "IS",
    "name": "Iceland",
    "flag": "🇮🇸",
    "currency": "ISK",
    "currencySymbol": "kr",
    "phonePrefix": "354",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 64.1466,
      "lng": -21.9426
    }
  },
  {
    "code": "IN",
    "name": "India",
    "flag": "🇮🇳",
    "currency": "INR",
    "currencySymbol": "₹",
    "phonePrefix": "91",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 28.6139,
      "lng": 77.209
    }
  },
  {
    "code": "ID",
    "name": "Indonesia",
    "flag": "🇮🇩",
    "currency": "IDR",
    "currencySymbol": "Rp",
    "phonePrefix": "62",
    "phoneLocalDigits": 11,
    "mapCenter": {
      "lat": -6.2088,
      "lng": 106.8456
    }
  },
  {
    "code": "IR",
    "name": "Iran",
    "flag": "🇮🇷",
    "currency": "IRR",
    "currencySymbol": "﷼",
    "phonePrefix": "98",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 35.6892,
      "lng": 51.389
    }
  },
  {
    "code": "IQ",
    "name": "Iraq",
    "flag": "🇮🇶",
    "currency": "IQD",
    "currencySymbol": "ع.د",
    "phonePrefix": "964",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 33.3152,
      "lng": 44.3661
    }
  },
  {
    "code": "IE",
    "name": "Ireland",
    "flag": "🇮🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "353",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 53.3498,
      "lng": -6.2603
    }
  },
  {
    "code": "IL",
    "name": "Israel",
    "flag": "🇮🇱",
    "currency": "ILS",
    "currencySymbol": "₪",
    "phonePrefix": "972",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 31.7683,
      "lng": 35.2137
    }
  },
  {
    "code": "IT",
    "name": "Italy",
    "flag": "🇮🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "39",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 41.9028,
      "lng": 12.4964
    }
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "flag": "🇯🇲",
    "currency": "JMD",
    "currencySymbol": "J$",
    "phonePrefix": "1876",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 18.0179,
      "lng": -76.8099
    }
  },
  {
    "code": "JP",
    "name": "Japan",
    "flag": "🇯🇵",
    "currency": "JPY",
    "currencySymbol": "¥",
    "phonePrefix": "81",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 35.6762,
      "lng": 139.6503
    }
  },
  {
    "code": "JO",
    "name": "Jordan",
    "flag": "🇯🇴",
    "currency": "JOD",
    "currencySymbol": "د.ا",
    "phonePrefix": "962",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 31.9454,
      "lng": 35.9284
    }
  },
  {
    "code": "KZ",
    "name": "Kazakhstan",
    "flag": "🇰🇿",
    "currency": "KZT",
    "currencySymbol": "₸",
    "phonePrefix": "7",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 43.222,
      "lng": 76.8512
    }
  },
  {
    "code": "KE",
    "name": "Kenya",
    "flag": "🇰🇪",
    "currency": "KES",
    "currencySymbol": "KSh",
    "phonePrefix": "254",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -1.2921,
      "lng": 36.8219
    }
  },
  {
    "code": "KI",
    "name": "Kiribati",
    "flag": "🇰🇮",
    "currency": "AUD",
    "currencySymbol": "A$",
    "phonePrefix": "686",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 1.3292,
      "lng": 172.979
    }
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "flag": "🇰🇼",
    "currency": "KWD",
    "currencySymbol": "د.ك",
    "phonePrefix": "965",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 29.3759,
      "lng": 47.9774
    }
  },
  {
    "code": "KG",
    "name": "Kyrgyzstan",
    "flag": "🇰🇬",
    "currency": "KGS",
    "currencySymbol": "som",
    "phonePrefix": "996",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 42.8746,
      "lng": 74.5698
    }
  },
  {
    "code": "LA",
    "name": "Laos",
    "flag": "🇱🇦",
    "currency": "LAK",
    "currencySymbol": "₭",
    "phonePrefix": "856",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 17.9757,
      "lng": 102.6331
    }
  },
  {
    "code": "LV",
    "name": "Latvia",
    "flag": "🇱🇻",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "371",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 56.9496,
      "lng": 24.1052
    }
  },
  {
    "code": "LB",
    "name": "Lebanon",
    "flag": "🇱🇧",
    "currency": "LBP",
    "currencySymbol": "ل.ل",
    "phonePrefix": "961",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 33.8938,
      "lng": 35.5018
    }
  },
  {
    "code": "LS",
    "name": "Lesotho",
    "flag": "🇱🇸",
    "currency": "LSL",
    "currencySymbol": "L",
    "phonePrefix": "266",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -29.31,
      "lng": 27.48
    }
  },
  {
    "code": "LR",
    "name": "Liberia",
    "flag": "🇱🇷",
    "currency": "LRD",
    "currencySymbol": "$",
    "phonePrefix": "231",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 6.2907,
      "lng": -10.7605
    }
  },
  {
    "code": "LY",
    "name": "Libya",
    "flag": "🇱🇾",
    "currency": "LYD",
    "currencySymbol": "ل.د",
    "phonePrefix": "218",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 32.8872,
      "lng": 13.1913
    }
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "flag": "🇱🇮",
    "currency": "CHF",
    "currencySymbol": "CHF",
    "phonePrefix": "423",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 47.141,
      "lng": 9.5209
    }
  },
  {
    "code": "LT",
    "name": "Lithuania",
    "flag": "🇱🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "370",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 54.6872,
      "lng": 25.2797
    }
  },
  {
    "code": "LU",
    "name": "Luxembourg",
    "flag": "🇱🇺",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "352",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 49.6116,
      "lng": 6.1319
    }
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "flag": "🇲🇬",
    "currency": "MGA",
    "currencySymbol": "Ar",
    "phonePrefix": "261",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -18.8792,
      "lng": 47.5079
    }
  },
  {
    "code": "MW",
    "name": "Malawi",
    "flag": "🇲🇼",
    "currency": "MWK",
    "currencySymbol": "MK",
    "phonePrefix": "265",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -13.9626,
      "lng": 33.7741
    }
  },
  {
    "code": "MY",
    "name": "Malaysia",
    "flag": "🇲🇾",
    "currency": "MYR",
    "currencySymbol": "RM",
    "phonePrefix": "60",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 3.139,
      "lng": 101.6869
    }
  },
  {
    "code": "MV",
    "name": "Maldives",
    "flag": "🇲🇻",
    "currency": "MVR",
    "currencySymbol": "Rf",
    "phonePrefix": "960",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 4.1755,
      "lng": 73.5093
    }
  },
  {
    "code": "ML",
    "name": "Mali",
    "flag": "🇲🇱",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "223",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 12.6392,
      "lng": -8.0029
    }
  },
  {
    "code": "MT",
    "name": "Malta",
    "flag": "🇲🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "356",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 35.8989,
      "lng": 14.5146
    }
  },
  {
    "code": "MH",
    "name": "Marshall Islands",
    "flag": "🇲🇭",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "692",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 7.1164,
      "lng": 171.185
    }
  },
  {
    "code": "MR",
    "name": "Mauritania",
    "flag": "🇲🇷",
    "currency": "MRU",
    "currencySymbol": "UM",
    "phonePrefix": "222",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 18.0735,
      "lng": -15.9582
    }
  },
  {
    "code": "MU",
    "name": "Mauritius",
    "flag": "🇲🇺",
    "currency": "MUR",
    "currencySymbol": "₨",
    "phonePrefix": "230",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -20.1609,
      "lng": 57.5012
    }
  },
  {
    "code": "MX",
    "name": "Mexico",
    "flag": "🇲🇽",
    "currency": "MXN",
    "currencySymbol": "$",
    "phonePrefix": "52",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 19.4326,
      "lng": -99.1332
    }
  },
  {
    "code": "FM",
    "name": "Micronesia",
    "flag": "🇫🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "691",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 6.9248,
      "lng": 158.1611
    }
  },
  {
    "code": "MD",
    "name": "Moldova",
    "flag": "🇲🇩",
    "currency": "MDL",
    "currencySymbol": "L",
    "phonePrefix": "373",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 47.0105,
      "lng": 28.8638
    }
  },
  {
    "code": "MC",
    "name": "Monaco",
    "flag": "🇲🇨",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "377",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 43.7384,
      "lng": 7.4246
    }
  },
  {
    "code": "MN",
    "name": "Mongolia",
    "flag": "🇲🇳",
    "currency": "MNT",
    "currencySymbol": "₮",
    "phonePrefix": "976",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 47.8864,
      "lng": 106.9057
    }
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "flag": "🇲🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "382",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 42.4304,
      "lng": 19.2594
    }
  },
  {
    "code": "MA",
    "name": "Morocco",
    "flag": "🇲🇦",
    "currency": "MAD",
    "currencySymbol": "د.م.",
    "phonePrefix": "212",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 33.9716,
      "lng": -6.8498
    }
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "flag": "🇲🇿",
    "currency": "MZN",
    "currencySymbol": "MT",
    "phonePrefix": "258",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -25.9692,
      "lng": 32.5732
    }
  },
  {
    "code": "MM",
    "name": "Myanmar",
    "flag": "🇲🇲",
    "currency": "MMK",
    "currencySymbol": "K",
    "phonePrefix": "95",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 16.8661,
      "lng": 96.1951
    }
  },
  {
    "code": "NA",
    "name": "Namibia",
    "flag": "🇳🇦",
    "currency": "NAD",
    "currencySymbol": "N$",
    "phonePrefix": "264",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -22.5609,
      "lng": 17.0658
    }
  },
  {
    "code": "NR",
    "name": "Nauru",
    "flag": "🇳🇷",
    "currency": "AUD",
    "currencySymbol": "A$",
    "phonePrefix": "674",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -0.5228,
      "lng": 166.9315
    }
  },
  {
    "code": "NP",
    "name": "Nepal",
    "flag": "🇳🇵",
    "currency": "NPR",
    "currencySymbol": "रू",
    "phonePrefix": "977",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 27.7172,
      "lng": 85.324
    }
  },
  {
    "code": "NL",
    "name": "Netherlands",
    "flag": "🇳🇱",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "31",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 52.3676,
      "lng": 4.9041
    }
  },
  {
    "code": "NZ",
    "name": "New Zealand",
    "flag": "🇳🇿",
    "currency": "NZD",
    "currencySymbol": "NZ$",
    "phonePrefix": "64",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -41.2865,
      "lng": 174.7762
    }
  },
  {
    "code": "NI",
    "name": "Nicaragua",
    "flag": "🇳🇮",
    "currency": "NIO",
    "currencySymbol": "C$",
    "phonePrefix": "505",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 12.1364,
      "lng": -86.2514
    }
  },
  {
    "code": "NE",
    "name": "Niger",
    "flag": "🇳🇪",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "227",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 13.5116,
      "lng": 2.1254
    }
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "flag": "🇳🇬",
    "currency": "NGN",
    "currencySymbol": "₦",
    "phonePrefix": "234",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 6.5244,
      "lng": 3.3792
    }
  },
  {
    "code": "KP",
    "name": "North Korea",
    "flag": "🇰🇵",
    "currency": "KPW",
    "currencySymbol": "₩",
    "phonePrefix": "850",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 39.0392,
      "lng": 125.7625
    }
  },
  {
    "code": "MK",
    "name": "North Macedonia",
    "flag": "🇲🇰",
    "currency": "MKD",
    "currencySymbol": "ден",
    "phonePrefix": "389",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 41.9981,
      "lng": 21.4254
    }
  },
  {
    "code": "NO",
    "name": "Norway",
    "flag": "🇳🇴",
    "currency": "NOK",
    "currencySymbol": "kr",
    "phonePrefix": "47",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 59.9139,
      "lng": 10.7522
    }
  },
  {
    "code": "OM",
    "name": "Oman",
    "flag": "🇴🇲",
    "currency": "OMR",
    "currencySymbol": "ر.ع.",
    "phonePrefix": "968",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 23.588,
      "lng": 58.3829
    }
  },
  {
    "code": "PK",
    "name": "Pakistan",
    "flag": "🇵🇰",
    "currency": "PKR",
    "currencySymbol": "₨",
    "phonePrefix": "92",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 31.5204,
      "lng": 74.3587
    }
  },
  {
    "code": "PW",
    "name": "Palau",
    "flag": "🇵🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "680",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 7.5149,
      "lng": 134.5825
    }
  },
  {
    "code": "PS",
    "name": "Palestine",
    "flag": "🇵🇸",
    "currency": "ILS",
    "currencySymbol": "₪",
    "phonePrefix": "970",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 31.9522,
      "lng": 35.2332
    }
  },
  {
    "code": "PA",
    "name": "Panama",
    "flag": "🇵🇦",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "507",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 8.9824,
      "lng": -79.5199
    }
  },
  {
    "code": "PG",
    "name": "Papua New Guinea",
    "flag": "🇵🇬",
    "currency": "PGK",
    "currencySymbol": "K",
    "phonePrefix": "675",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -9.4438,
      "lng": 147.1803
    }
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "flag": "🇵🇾",
    "currency": "PYG",
    "currencySymbol": "₲",
    "phonePrefix": "595",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -25.2637,
      "lng": -57.5759
    }
  },
  {
    "code": "PE",
    "name": "Peru",
    "flag": "🇵🇪",
    "currency": "PEN",
    "currencySymbol": "S/",
    "phonePrefix": "51",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -12.0464,
      "lng": -77.0428
    }
  },
  {
    "code": "PH",
    "name": "Philippines",
    "flag": "🇵🇭",
    "currency": "PHP",
    "currencySymbol": "₱",
    "phonePrefix": "63",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 14.5995,
      "lng": 120.9842
    }
  },
  {
    "code": "PL",
    "name": "Poland",
    "flag": "🇵🇱",
    "currency": "PLN",
    "currencySymbol": "zł",
    "phonePrefix": "48",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 52.2297,
      "lng": 21.0122
    }
  },
  {
    "code": "PT",
    "name": "Portugal",
    "flag": "🇵🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "351",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 38.7223,
      "lng": -9.1393
    }
  },
  {
    "code": "QA",
    "name": "Qatar",
    "flag": "🇶🇦",
    "currency": "QAR",
    "currencySymbol": "ر.ق",
    "phonePrefix": "974",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 25.2854,
      "lng": 51.531
    }
  },
  {
    "code": "RO",
    "name": "Romania",
    "flag": "🇷🇴",
    "currency": "RON",
    "currencySymbol": "lei",
    "phonePrefix": "40",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 44.4268,
      "lng": 26.1025
    }
  },
  {
    "code": "RU",
    "name": "Russia",
    "flag": "🇷🇺",
    "currency": "RUB",
    "currencySymbol": "₽",
    "phonePrefix": "7",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 55.7558,
      "lng": 37.6173
    }
  },
  {
    "code": "RW",
    "name": "Rwanda",
    "flag": "🇷🇼",
    "currency": "RWF",
    "currencySymbol": "FRw",
    "phonePrefix": "250",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -1.9441,
      "lng": 30.0619
    }
  },
  {
    "code": "KN",
    "name": "Saint Kitts and Nevis",
    "flag": "🇰🇳",
    "currency": "XCD",
    "currencySymbol": "$",
    "phonePrefix": "1869",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 17.3026,
      "lng": -62.7177
    }
  },
  {
    "code": "LC",
    "name": "Saint Lucia",
    "flag": "🇱🇨",
    "currency": "XCD",
    "currencySymbol": "$",
    "phonePrefix": "1758",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 14.0101,
      "lng": -60.9875
    }
  },
  {
    "code": "VC",
    "name": "Saint Vincent and the Grenadines",
    "flag": "🇻🇨",
    "currency": "XCD",
    "currencySymbol": "$",
    "phonePrefix": "1784",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 13.16,
      "lng": -61.22
    }
  },
  {
    "code": "WS",
    "name": "Samoa",
    "flag": "🇼🇸",
    "currency": "WST",
    "currencySymbol": "T",
    "phonePrefix": "685",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -13.8333,
      "lng": -171.7667
    }
  },
  {
    "code": "SM",
    "name": "San Marino",
    "flag": "🇸🇲",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "378",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 43.9424,
      "lng": 12.4578
    }
  },
  {
    "code": "ST",
    "name": "Sao Tome and Principe",
    "flag": "🇸🇹",
    "currency": "STN",
    "currencySymbol": "Db",
    "phonePrefix": "239",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 0.3365,
      "lng": 6.7273
    }
  },
  {
    "code": "SA",
    "name": "Saudi Arabia",
    "flag": "🇸🇦",
    "currency": "SAR",
    "currencySymbol": "﷼",
    "phonePrefix": "966",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 24.7136,
      "lng": 46.6753
    }
  },
  {
    "code": "SN",
    "name": "Senegal",
    "flag": "🇸🇳",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "221",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 14.7167,
      "lng": -17.4677
    }
  },
  {
    "code": "RS",
    "name": "Serbia",
    "flag": "🇷🇸",
    "currency": "RSD",
    "currencySymbol": "дин",
    "phonePrefix": "381",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 44.7866,
      "lng": 20.4489
    }
  },
  {
    "code": "SC",
    "name": "Seychelles",
    "flag": "🇸🇨",
    "currency": "SCR",
    "currencySymbol": "₨",
    "phonePrefix": "248",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -4.6191,
      "lng": 55.4513
    }
  },
  {
    "code": "SL",
    "name": "Sierra Leone",
    "flag": "🇸🇱",
    "currency": "SLE",
    "currencySymbol": "Le",
    "phonePrefix": "232",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 8.4657,
      "lng": -13.2317
    }
  },
  {
    "code": "SG",
    "name": "Singapore",
    "flag": "🇸🇬",
    "currency": "SGD",
    "currencySymbol": "S$",
    "phonePrefix": "65",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 1.3521,
      "lng": 103.8198
    }
  },
  {
    "code": "SK",
    "name": "Slovakia",
    "flag": "🇸🇰",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "421",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 48.1486,
      "lng": 17.1077
    }
  },
  {
    "code": "SI",
    "name": "Slovenia",
    "flag": "🇸🇮",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "386",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 46.0569,
      "lng": 14.5058
    }
  },
  {
    "code": "SB",
    "name": "Solomon Islands",
    "flag": "🇸🇧",
    "currency": "SBD",
    "currencySymbol": "SI$",
    "phonePrefix": "677",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -9.4281,
      "lng": 159.9729
    }
  },
  {
    "code": "SO",
    "name": "Somalia",
    "flag": "🇸🇴",
    "currency": "SOS",
    "currencySymbol": "Sh",
    "phonePrefix": "252",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 2.0469,
      "lng": 45.3182
    }
  },
  {
    "code": "ZA",
    "name": "South Africa",
    "flag": "🇿🇦",
    "currency": "ZAR",
    "currencySymbol": "R",
    "phonePrefix": "27",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -31.5833,
      "lng": 28.7833
    }
  },
  {
    "code": "KR",
    "name": "South Korea",
    "flag": "🇰🇷",
    "currency": "KRW",
    "currencySymbol": "₩",
    "phonePrefix": "82",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 37.5665,
      "lng": 126.978
    }
  },
  {
    "code": "SS",
    "name": "South Sudan",
    "flag": "🇸🇸",
    "currency": "SSP",
    "currencySymbol": "£",
    "phonePrefix": "211",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 4.8594,
      "lng": 31.5713
    }
  },
  {
    "code": "ES",
    "name": "Spain",
    "flag": "🇪🇸",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "34",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 40.4168,
      "lng": -3.7038
    }
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "flag": "🇱🇰",
    "currency": "LKR",
    "currencySymbol": "Rs",
    "phonePrefix": "94",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 6.9271,
      "lng": 79.8612
    }
  },
  {
    "code": "SD",
    "name": "Sudan",
    "flag": "🇸🇩",
    "currency": "SDG",
    "currencySymbol": "ج.س.",
    "phonePrefix": "249",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 15.5007,
      "lng": 32.5599
    }
  },
  {
    "code": "SR",
    "name": "Suriname",
    "flag": "🇸🇷",
    "currency": "SRD",
    "currencySymbol": "$",
    "phonePrefix": "597",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 5.852,
      "lng": -55.2038
    }
  },
  {
    "code": "SE",
    "name": "Sweden",
    "flag": "🇸🇪",
    "currency": "SEK",
    "currencySymbol": "kr",
    "phonePrefix": "46",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 59.3293,
      "lng": 18.0686
    }
  },
  {
    "code": "CH",
    "name": "Switzerland",
    "flag": "🇨🇭",
    "currency": "CHF",
    "currencySymbol": "CHF",
    "phonePrefix": "41",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 46.948,
      "lng": 7.4474
    }
  },
  {
    "code": "SY",
    "name": "Syria",
    "flag": "🇸🇾",
    "currency": "SYP",
    "currencySymbol": "£",
    "phonePrefix": "963",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 33.5138,
      "lng": 36.2765
    }
  },
  {
    "code": "TW",
    "name": "Taiwan",
    "flag": "🇹🇼",
    "currency": "TWD",
    "currencySymbol": "NT$",
    "phonePrefix": "886",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 25.033,
      "lng": 121.5654
    }
  },
  {
    "code": "TJ",
    "name": "Tajikistan",
    "flag": "🇹🇯",
    "currency": "TJS",
    "currencySymbol": "ЅМ",
    "phonePrefix": "992",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 38.5598,
      "lng": 68.7738
    }
  },
  {
    "code": "TZ",
    "name": "Tanzania",
    "flag": "🇹🇿",
    "currency": "TZS",
    "currencySymbol": "TSh",
    "phonePrefix": "255",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -6.7924,
      "lng": 39.2083
    }
  },
  {
    "code": "TH",
    "name": "Thailand",
    "flag": "🇹🇭",
    "currency": "THB",
    "currencySymbol": "฿",
    "phonePrefix": "66",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 13.7563,
      "lng": 100.5018
    }
  },
  {
    "code": "TL",
    "name": "Timor-Leste",
    "flag": "🇹🇱",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "670",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -8.5569,
      "lng": 125.5603
    }
  },
  {
    "code": "TG",
    "name": "Togo",
    "flag": "🇹🇬",
    "currency": "XOF",
    "currencySymbol": "CFA",
    "phonePrefix": "228",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 6.1725,
      "lng": 1.2314
    }
  },
  {
    "code": "TO",
    "name": "Tonga",
    "flag": "🇹🇴",
    "currency": "TOP",
    "currencySymbol": "T$",
    "phonePrefix": "676",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -21.1393,
      "lng": -175.2018
    }
  },
  {
    "code": "TT",
    "name": "Trinidad and Tobago",
    "flag": "🇹🇹",
    "currency": "TTD",
    "currencySymbol": "TT$",
    "phonePrefix": "1868",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": 10.6918,
      "lng": -61.2225
    }
  },
  {
    "code": "TN",
    "name": "Tunisia",
    "flag": "🇹🇳",
    "currency": "TND",
    "currencySymbol": "د.ت",
    "phonePrefix": "216",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 36.8065,
      "lng": 10.1815
    }
  },
  {
    "code": "TR",
    "name": "Turkey",
    "flag": "🇹🇷",
    "currency": "TRY",
    "currencySymbol": "₺",
    "phonePrefix": "90",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 39.9334,
      "lng": 32.8597
    }
  },
  {
    "code": "TM",
    "name": "Turkmenistan",
    "flag": "🇹🇲",
    "currency": "TMT",
    "currencySymbol": "m",
    "phonePrefix": "993",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": 37.9601,
      "lng": 58.3261
    }
  },
  {
    "code": "TV",
    "name": "Tuvalu",
    "flag": "🇹🇻",
    "currency": "AUD",
    "currencySymbol": "A$",
    "phonePrefix": "688",
    "phoneLocalDigits": 5,
    "mapCenter": {
      "lat": -8.5211,
      "lng": 179.1962
    }
  },
  {
    "code": "UG",
    "name": "Uganda",
    "flag": "🇺🇬",
    "currency": "UGX",
    "currencySymbol": "USh",
    "phonePrefix": "256",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 0.3476,
      "lng": 32.5825
    }
  },
  {
    "code": "UA",
    "name": "Ukraine",
    "flag": "🇺🇦",
    "currency": "UAH",
    "currencySymbol": "₴",
    "phonePrefix": "380",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 50.4501,
      "lng": 30.5234
    }
  },
  {
    "code": "AE",
    "name": "United Arab Emirates",
    "flag": "🇦🇪",
    "currency": "AED",
    "currencySymbol": "د.إ",
    "phonePrefix": "971",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 24.4539,
      "lng": 54.3773
    }
  },
  {
    "code": "GB",
    "name": "United Kingdom",
    "flag": "🇬🇧",
    "currency": "GBP",
    "currencySymbol": "£",
    "phonePrefix": "44",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 51.5074,
      "lng": -0.1278
    }
  },
  {
    "code": "US",
    "name": "United States",
    "flag": "🇺🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "phonePrefix": "1",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 38.9072,
      "lng": -77.0369
    }
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "flag": "🇺🇾",
    "currency": "UYU",
    "currencySymbol": "$",
    "phonePrefix": "598",
    "phoneLocalDigits": 8,
    "mapCenter": {
      "lat": -34.9011,
      "lng": -56.1645
    }
  },
  {
    "code": "UZ",
    "name": "Uzbekistan",
    "flag": "🇺🇿",
    "currency": "UZS",
    "currencySymbol": "so'm",
    "phonePrefix": "998",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 41.2995,
      "lng": 69.2401
    }
  },
  {
    "code": "VU",
    "name": "Vanuatu",
    "flag": "🇻🇺",
    "currency": "VUV",
    "currencySymbol": "VT",
    "phonePrefix": "678",
    "phoneLocalDigits": 7,
    "mapCenter": {
      "lat": -17.7333,
      "lng": 168.3167
    }
  },
  {
    "code": "VA",
    "name": "Vatican City",
    "flag": "🇻🇦",
    "currency": "EUR",
    "currencySymbol": "€",
    "phonePrefix": "379",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 41.9029,
      "lng": 12.4534
    }
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "flag": "🇻🇪",
    "currency": "VES",
    "currencySymbol": "Bs",
    "phonePrefix": "58",
    "phoneLocalDigits": 10,
    "mapCenter": {
      "lat": 10.4806,
      "lng": -66.9036
    }
  },
  {
    "code": "VN",
    "name": "Vietnam",
    "flag": "🇻🇳",
    "currency": "VND",
    "currencySymbol": "₫",
    "phonePrefix": "84",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 21.0278,
      "lng": 105.8342
    }
  },
  {
    "code": "YE",
    "name": "Yemen",
    "flag": "🇾🇪",
    "currency": "YER",
    "currencySymbol": "﷼",
    "phonePrefix": "967",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": 15.3694,
      "lng": 44.191
    }
  },
  {
    "code": "ZM",
    "name": "Zambia",
    "flag": "🇿🇲",
    "currency": "ZMW",
    "currencySymbol": "ZK",
    "phonePrefix": "260",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -15.3875,
      "lng": 28.3228
    }
  },
  {
    "code": "ZW",
    "name": "Zimbabwe",
    "flag": "🇿🇼",
    "currency": "ZWL",
    "currencySymbol": "$",
    "phonePrefix": "263",
    "phoneLocalDigits": 9,
    "mapCenter": {
      "lat": -17.8252,
      "lng": 31.0335
    }
  }
];
