export const indianStatesAndUTs = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",

    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
];

// India PIN code first 2-digit mapping
const stateByPinPrefix = {
    11: "Delhi",
    12: "Haryana",
    13: "Punjab",
    14: "Punjab",
    15: "Punjab",
    16: "Chandigarh",
    17: "Himachal Pradesh",
    18: "Jammu and Kashmir",
    19: "Jammu and Kashmir",

    20: "Uttar Pradesh",
    21: "Uttar Pradesh",
    22: "Uttar Pradesh",
    23: "Uttar Pradesh",
    24: "Uttar Pradesh",
    25: "Uttar Pradesh",
    26: "Uttar Pradesh",
    27: "Uttar Pradesh",
    28: "Uttar Pradesh",

    30: "Rajasthan",
    31: "Rajasthan",
    32: "Rajasthan",
    33: "Rajasthan",
    34: "Rajasthan",

    36: "Gujarat",
    37: "Gujarat",
    38: "Gujarat",
    39: "Gujarat",

    40: "Maharashtra",
    41: "Maharashtra",
    42: "Maharashtra",
    43: "Maharashtra",
    44: "Maharashtra",

    45: "Madhya Pradesh",
    46: "Madhya Pradesh",
    47: "Madhya Pradesh",
    48: "Chhattisgarh",
    49: "Chhattisgarh",

    50: "Telangana",

    51: "Andhra Pradesh",
    52: "Andhra Pradesh",
    53: "Andhra Pradesh",

    56: "Karnataka",
    57: "Karnataka",
    58: "Karnataka",

    60: "Tamil Nadu",
    61: "Tamil Nadu",
    62: "Tamil Nadu",
    63: "Tamil Nadu",
    64: "Tamil Nadu",

    67: "Kerala",
    68: "Kerala",
    69: "Kerala",

    70: "West Bengal",
    71: "West Bengal",
    72: "West Bengal",
    73: "Sikkim",
    74: "West Bengal",

    75: "Odisha",
    76: "Odisha",
    77: "Odisha",

    78: "Assam",
    79: "Assam",

    80: "Bihar",
    81: "Bihar",
    82: "Jharkhand",
    83: "Jharkhand",
    84: "Bihar",
    85: "Bihar",

    90: "Army Postal Service",
    91: "Army Postal Service",
    92: "Army Postal Service",
    93: "Army Postal Service",
};

export function detectState(address = "") {
    if (!address || typeof address !== "string") {
        return null;
    }

    // Clean address
    const cleanedAddress = address
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    for (const state of indianStatesAndUTs) {
        if (cleanedAddress.includes(state.toLowerCase())) {
            return state;
        }
    }

    const pinMatch = cleanedAddress.match(/\b\d{6}\b/);

    if (pinMatch) {
        const pin = pinMatch[0];
        const prefix = Number(pin.substring(0, 2));

        if (stateByPinPrefix[prefix]) {
            return stateByPinPrefix[prefix];
        }
    }

    const cityStateMap = {
        pune: "Maharashtra",
        mumbai: "Maharashtra",
        nagpur: "Maharashtra",

        bengaluru: "Karnataka",
        bangalore: "Karnataka",
        mysore: "Karnataka",

        chennai: "Tamil Nadu",
        coimbatore: "Tamil Nadu",

        hyderabad: "Telangana",

        kolkata: "West Bengal",
        howrah: "West Bengal",

        delhi: "Delhi",
        gurugram: "Haryana",
        gurgaon: "Haryana",

        ahmedabad: "Gujarat",
        surat: "Gujarat",

        jaipur: "Rajasthan",

        lucknow: "Uttar Pradesh",
        kanpur: "Uttar Pradesh",

        bhubaneswar: "Odisha",

        patna: "Bihar"
    };

    for (const city in cityStateMap) {
        if (cleanedAddress.includes(city)) {
            return cityStateMap[city];
        }
    }

    return null;
}