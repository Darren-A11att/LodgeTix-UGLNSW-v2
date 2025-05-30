// List of countries with phone codes for use in phone input
export interface PhoneCountryType {
  id: string; // ISO 2-letter country code
  name: string;
  dialCode: string;
  priority?: number; // For commonly used countries
  areaCodes?: string[]; // For countries with specific area codes
}

// Common/frequently used countries first
const commonCountries: PhoneCountryType[] = [
  { id: 'AU', name: 'Australia', dialCode: '61', priority: 1 },
  { id: 'NZ', name: 'New Zealand', dialCode: '64', priority: 2 },
  { id: 'GB', name: 'United Kingdom', dialCode: '44', priority: 3 },
  { id: 'US', name: 'United States', dialCode: '1', priority: 4, areaCodes: ['907', '205', '202', '701'] },
  { id: 'CA', name: 'Canada', dialCode: '1', priority: 5, areaCodes: ['204', '226', '236', '249'] }
];

// Rest of the countries alphabetically
const otherCountries: PhoneCountryType[] = [
  { id: 'AF', name: 'Afghanistan', dialCode: '93' },
  { id: 'AL', name: 'Albania', dialCode: '355' },
  { id: 'DZ', name: 'Algeria', dialCode: '213' },
  { id: 'AS', name: 'American Samoa', dialCode: '1684' },
  { id: 'AD', name: 'Andorra', dialCode: '376' },
  { id: 'AO', name: 'Angola', dialCode: '244' },
  { id: 'AI', name: 'Anguilla', dialCode: '1264' },
  { id: 'AG', name: 'Antigua and Barbuda', dialCode: '1268' },
  { id: 'AR', name: 'Argentina', dialCode: '54' },
  { id: 'AM', name: 'Armenia', dialCode: '374' },
  { id: 'AW', name: 'Aruba', dialCode: '297' },
  { id: 'AT', name: 'Austria', dialCode: '43' },
  { id: 'AZ', name: 'Azerbaijan', dialCode: '994' },
  { id: 'BS', name: 'Bahamas', dialCode: '1242' },
  { id: 'BH', name: 'Bahrain', dialCode: '973' },
  { id: 'BD', name: 'Bangladesh', dialCode: '880' },
  { id: 'BB', name: 'Barbados', dialCode: '1246' },
  { id: 'BY', name: 'Belarus', dialCode: '375' },
  { id: 'BE', name: 'Belgium', dialCode: '32' },
  { id: 'BZ', name: 'Belize', dialCode: '501' },
  { id: 'BJ', name: 'Benin', dialCode: '229' },
  { id: 'BM', name: 'Bermuda', dialCode: '1441' },
  { id: 'BT', name: 'Bhutan', dialCode: '975' },
  { id: 'BO', name: 'Bolivia', dialCode: '591' },
  { id: 'BA', name: 'Bosnia and Herzegovina', dialCode: '387' },
  { id: 'BW', name: 'Botswana', dialCode: '267' },
  { id: 'BR', name: 'Brazil', dialCode: '55' },
  { id: 'IO', name: 'British Indian Ocean Territory', dialCode: '246' },
  { id: 'BN', name: 'Brunei Darussalam', dialCode: '673' },
  { id: 'BG', name: 'Bulgaria', dialCode: '359' },
  { id: 'BF', name: 'Burkina Faso', dialCode: '226' },
  { id: 'BI', name: 'Burundi', dialCode: '257' },
  { id: 'KH', name: 'Cambodia', dialCode: '855' },
  { id: 'CM', name: 'Cameroon', dialCode: '237' },
  { id: 'CV', name: 'Cape Verde', dialCode: '238' },
  { id: 'KY', name: 'Cayman Islands', dialCode: '1345' },
  { id: 'CF', name: 'Central African Republic', dialCode: '236' },
  { id: 'TD', name: 'Chad', dialCode: '235' },
  { id: 'CL', name: 'Chile', dialCode: '56' },
  { id: 'CN', name: 'China', dialCode: '86' },
  { id: 'CX', name: 'Christmas Island', dialCode: '61' },
  { id: 'CC', name: 'Cocos (Keeling) Islands', dialCode: '61' },
  { id: 'CO', name: 'Colombia', dialCode: '57' },
  { id: 'KM', name: 'Comoros', dialCode: '269' },
  { id: 'CG', name: 'Congo', dialCode: '242' },
  { id: 'CD', name: 'Congo, Democratic Republic of the', dialCode: '243' },
  { id: 'CK', name: 'Cook Islands', dialCode: '682' },
  { id: 'CR', name: 'Costa Rica', dialCode: '506' },
  { id: 'CI', name: 'Cote d\'Ivoire', dialCode: '225' },
  { id: 'HR', name: 'Croatia', dialCode: '385' },
  { id: 'CU', name: 'Cuba', dialCode: '53' },
  { id: 'CY', name: 'Cyprus', dialCode: '357' },
  { id: 'CZ', name: 'Czech Republic', dialCode: '420' },
  { id: 'DK', name: 'Denmark', dialCode: '45' },
  { id: 'DJ', name: 'Djibouti', dialCode: '253' },
  { id: 'DM', name: 'Dominica', dialCode: '1767' },
  { id: 'DO', name: 'Dominican Republic', dialCode: '1849' },
  { id: 'EC', name: 'Ecuador', dialCode: '593' },
  { id: 'EG', name: 'Egypt', dialCode: '20' },
  { id: 'SV', name: 'El Salvador', dialCode: '503' },
  { id: 'GQ', name: 'Equatorial Guinea', dialCode: '240' },
  { id: 'ER', name: 'Eritrea', dialCode: '291' },
  { id: 'EE', name: 'Estonia', dialCode: '372' },
  { id: 'ET', name: 'Ethiopia', dialCode: '251' },
  { id: 'FK', name: 'Falkland Islands (Malvinas)', dialCode: '500' },
  { id: 'FO', name: 'Faroe Islands', dialCode: '298' },
  { id: 'FJ', name: 'Fiji', dialCode: '679' },
  { id: 'FI', name: 'Finland', dialCode: '358' },
  { id: 'FR', name: 'France', dialCode: '33' },
  { id: 'GF', name: 'French Guiana', dialCode: '594' },
  { id: 'PF', name: 'French Polynesia', dialCode: '689' },
  { id: 'GA', name: 'Gabon', dialCode: '241' },
  { id: 'GM', name: 'Gambia', dialCode: '220' },
  { id: 'GE', name: 'Georgia', dialCode: '995' },
  { id: 'DE', name: 'Germany', dialCode: '49' },
  { id: 'GH', name: 'Ghana', dialCode: '233' },
  { id: 'GI', name: 'Gibraltar', dialCode: '350' },
  { id: 'GR', name: 'Greece', dialCode: '30' },
  { id: 'GL', name: 'Greenland', dialCode: '299' },
  { id: 'GD', name: 'Grenada', dialCode: '1473' },
  { id: 'GP', name: 'Guadeloupe', dialCode: '590' },
  { id: 'GU', name: 'Guam', dialCode: '1671' },
  { id: 'GT', name: 'Guatemala', dialCode: '502' },
  { id: 'GN', name: 'Guinea', dialCode: '224' },
  { id: 'GW', name: 'Guinea-Bissau', dialCode: '245' },
  { id: 'GY', name: 'Guyana', dialCode: '592' },
  { id: 'HT', name: 'Haiti', dialCode: '509' },
  { id: 'VA', name: 'Holy See (Vatican City State)', dialCode: '379' },
  { id: 'HN', name: 'Honduras', dialCode: '504' },
  { id: 'HK', name: 'Hong Kong', dialCode: '852' },
  { id: 'HU', name: 'Hungary', dialCode: '36' },
  { id: 'IS', name: 'Iceland', dialCode: '354' },
  { id: 'IN', name: 'India', dialCode: '91' },
  { id: 'ID', name: 'Indonesia', dialCode: '62' },
  { id: 'IR', name: 'Iran', dialCode: '98' },
  { id: 'IQ', name: 'Iraq', dialCode: '964' },
  { id: 'IE', name: 'Ireland', dialCode: '353' },
  { id: 'IL', name: 'Israel', dialCode: '972' },
  { id: 'IT', name: 'Italy', dialCode: '39' },
  { id: 'JM', name: 'Jamaica', dialCode: '1876' },
  { id: 'JP', name: 'Japan', dialCode: '81' },
  { id: 'JO', name: 'Jordan', dialCode: '962' },
  { id: 'KZ', name: 'Kazakhstan', dialCode: '7' },
  { id: 'KE', name: 'Kenya', dialCode: '254' },
  { id: 'KI', name: 'Kiribati', dialCode: '686' },
  { id: 'KP', name: 'Korea, Democratic People\'s Republic of', dialCode: '850' },
  { id: 'KR', name: 'Korea, Republic of', dialCode: '82' },
  { id: 'KW', name: 'Kuwait', dialCode: '965' },
  { id: 'KG', name: 'Kyrgyzstan', dialCode: '996' },
  { id: 'LA', name: 'Lao People\'s Democratic Republic', dialCode: '856' },
  { id: 'LV', name: 'Latvia', dialCode: '371' },
  { id: 'LB', name: 'Lebanon', dialCode: '961' },
  { id: 'LS', name: 'Lesotho', dialCode: '266' },
  { id: 'LR', name: 'Liberia', dialCode: '231' },
  { id: 'LY', name: 'Libya', dialCode: '218' },
  { id: 'LI', name: 'Liechtenstein', dialCode: '423' },
  { id: 'LT', name: 'Lithuania', dialCode: '370' },
  { id: 'LU', name: 'Luxembourg', dialCode: '352' },
  { id: 'MO', name: 'Macao', dialCode: '853' },
  { id: 'MK', name: 'Macedonia', dialCode: '389' },
  { id: 'MG', name: 'Madagascar', dialCode: '261' },
  { id: 'MW', name: 'Malawi', dialCode: '265' },
  { id: 'MY', name: 'Malaysia', dialCode: '60' },
  { id: 'MV', name: 'Maldives', dialCode: '960' },
  { id: 'ML', name: 'Mali', dialCode: '223' },
  { id: 'MT', name: 'Malta', dialCode: '356' },
  { id: 'MH', name: 'Marshall Islands', dialCode: '692' },
  { id: 'MQ', name: 'Martinique', dialCode: '596' },
  { id: 'MR', name: 'Mauritania', dialCode: '222' },
  { id: 'MU', name: 'Mauritius', dialCode: '230' },
  { id: 'YT', name: 'Mayotte', dialCode: '262' },
  { id: 'MX', name: 'Mexico', dialCode: '52' },
  { id: 'FM', name: 'Micronesia, Federated States of', dialCode: '691' },
  { id: 'MD', name: 'Moldova, Republic of', dialCode: '373' },
  { id: 'MC', name: 'Monaco', dialCode: '377' },
  { id: 'MN', name: 'Mongolia', dialCode: '976' },
  { id: 'ME', name: 'Montenegro', dialCode: '382' },
  { id: 'MS', name: 'Montserrat', dialCode: '1664' },
  { id: 'MA', name: 'Morocco', dialCode: '212' },
  { id: 'MZ', name: 'Mozambique', dialCode: '258' },
  { id: 'MM', name: 'Myanmar', dialCode: '95' },
  { id: 'NA', name: 'Namibia', dialCode: '264' },
  { id: 'NR', name: 'Nauru', dialCode: '674' },
  { id: 'NP', name: 'Nepal', dialCode: '977' },
  { id: 'NL', name: 'Netherlands', dialCode: '31' },
  { id: 'NC', name: 'New Caledonia', dialCode: '687' },
  { id: 'NI', name: 'Nicaragua', dialCode: '505' },
  { id: 'NE', name: 'Niger', dialCode: '227' },
  { id: 'NG', name: 'Nigeria', dialCode: '234' },
  { id: 'NU', name: 'Niue', dialCode: '683' },
  { id: 'NF', name: 'Norfolk Island', dialCode: '672' },
  { id: 'MP', name: 'Northern Mariana Islands', dialCode: '1670' },
  { id: 'NO', name: 'Norway', dialCode: '47' },
  { id: 'OM', name: 'Oman', dialCode: '968' },
  { id: 'PK', name: 'Pakistan', dialCode: '92' },
  { id: 'PW', name: 'Palau', dialCode: '680' },
  { id: 'PS', name: 'Palestine', dialCode: '970' },
  { id: 'PA', name: 'Panama', dialCode: '507' },
  { id: 'PG', name: 'Papua New Guinea', dialCode: '675' },
  { id: 'PY', name: 'Paraguay', dialCode: '595' },
  { id: 'PE', name: 'Peru', dialCode: '51' },
  { id: 'PH', name: 'Philippines', dialCode: '63' },
  { id: 'PN', name: 'Pitcairn', dialCode: '64' },
  { id: 'PL', name: 'Poland', dialCode: '48' },
  { id: 'PT', name: 'Portugal', dialCode: '351' },
  { id: 'PR', name: 'Puerto Rico', dialCode: '1939' },
  { id: 'QA', name: 'Qatar', dialCode: '974' },
  { id: 'RE', name: 'Reunion', dialCode: '262' },
  { id: 'RO', name: 'Romania', dialCode: '40' },
  { id: 'RU', name: 'Russian Federation', dialCode: '7' },
  { id: 'RW', name: 'Rwanda', dialCode: '250' },
  { id: 'BL', name: 'Saint Barthelemy', dialCode: '590' },
  { id: 'SH', name: 'Saint Helena', dialCode: '290' },
  { id: 'KN', name: 'Saint Kitts and Nevis', dialCode: '1869' },
  { id: 'LC', name: 'Saint Lucia', dialCode: '1758' },
  { id: 'MF', name: 'Saint Martin', dialCode: '590' },
  { id: 'PM', name: 'Saint Pierre and Miquelon', dialCode: '508' },
  { id: 'VC', name: 'Saint Vincent and the Grenadines', dialCode: '1784' },
  { id: 'WS', name: 'Samoa', dialCode: '685' },
  { id: 'SM', name: 'San Marino', dialCode: '378' },
  { id: 'ST', name: 'Sao Tome and Principe', dialCode: '239' },
  { id: 'SA', name: 'Saudi Arabia', dialCode: '966' },
  { id: 'SN', name: 'Senegal', dialCode: '221' },
  { id: 'RS', name: 'Serbia', dialCode: '381' },
  { id: 'SC', name: 'Seychelles', dialCode: '248' },
  { id: 'SL', name: 'Sierra Leone', dialCode: '232' },
  { id: 'SG', name: 'Singapore', dialCode: '65' },
  { id: 'SK', name: 'Slovakia', dialCode: '421' },
  { id: 'SI', name: 'Slovenia', dialCode: '386' },
  { id: 'SB', name: 'Solomon Islands', dialCode: '677' },
  { id: 'SO', name: 'Somalia', dialCode: '252' },
  { id: 'ZA', name: 'South Africa', dialCode: '27' },
  { id: 'SS', name: 'South Sudan', dialCode: '211' },
  { id: 'ES', name: 'Spain', dialCode: '34' },
  { id: 'LK', name: 'Sri Lanka', dialCode: '94' },
  { id: 'SD', name: 'Sudan', dialCode: '249' },
  { id: 'SR', name: 'Suriname', dialCode: '597' },
  { id: 'SJ', name: 'Svalbard and Jan Mayen', dialCode: '47' },
  { id: 'SZ', name: 'Swaziland', dialCode: '268' },
  { id: 'SE', name: 'Sweden', dialCode: '46' },
  { id: 'CH', name: 'Switzerland', dialCode: '41' },
  { id: 'SY', name: 'Syrian Arab Republic', dialCode: '963' },
  { id: 'TW', name: 'Taiwan', dialCode: '886' },
  { id: 'TJ', name: 'Tajikistan', dialCode: '992' },
  { id: 'TZ', name: 'Tanzania, United Republic of', dialCode: '255' },
  { id: 'TH', name: 'Thailand', dialCode: '66' },
  { id: 'TL', name: 'Timor-Leste', dialCode: '670' },
  { id: 'TG', name: 'Togo', dialCode: '228' },
  { id: 'TK', name: 'Tokelau', dialCode: '690' },
  { id: 'TO', name: 'Tonga', dialCode: '676' },
  { id: 'TT', name: 'Trinidad and Tobago', dialCode: '1868' },
  { id: 'TN', name: 'Tunisia', dialCode: '216' },
  { id: 'TR', name: 'Turkey', dialCode: '90' },
  { id: 'TM', name: 'Turkmenistan', dialCode: '993' },
  { id: 'TC', name: 'Turks and Caicos Islands', dialCode: '1649' },
  { id: 'TV', name: 'Tuvalu', dialCode: '688' },
  { id: 'UG', name: 'Uganda', dialCode: '256' },
  { id: 'UA', name: 'Ukraine', dialCode: '380' },
  { id: 'AE', name: 'United Arab Emirates', dialCode: '971' },
  { id: 'UY', name: 'Uruguay', dialCode: '598' },
  { id: 'UZ', name: 'Uzbekistan', dialCode: '998' },
  { id: 'VU', name: 'Vanuatu', dialCode: '678' },
  { id: 'VE', name: 'Venezuela', dialCode: '58' },
  { id: 'VN', name: 'Viet Nam', dialCode: '84' },
  { id: 'VG', name: 'Virgin Islands, British', dialCode: '1284' },
  { id: 'VI', name: 'Virgin Islands, U.S.', dialCode: '1340' },
  { id: 'WF', name: 'Wallis and Futuna', dialCode: '681' },
  { id: 'YE', name: 'Yemen', dialCode: '967' },
  { id: 'ZM', name: 'Zambia', dialCode: '260' },
  { id: 'ZW', name: 'Zimbabwe', dialCode: '263' }
];

// Combine and export all countries
export const phoneCountries: PhoneCountryType[] = [...commonCountries, ...otherCountries];

// Helper function to find country by ID
export const getCountryById = (id: string): PhoneCountryType | undefined => {
  return phoneCountries.find(country => country.id.toLowerCase() === id.toLowerCase());
};

// Helper function to find country by dial code
export const getCountryByDialCode = (dialCode: string): PhoneCountryType | undefined => {
  return phoneCountries.find(country => country.dialCode === dialCode);
};

// Helper function to format phone number for display
export const formatPhoneNumber = (phoneNumber: string, countryId?: string): string => {
  if (!phoneNumber) return '';
  
  // If country is provided, try to format according to country rules
  if (countryId) {
    const country = getCountryById(countryId);
    if (country) {
      // Remove country code if present
      const numberWithoutCountry = phoneNumber.startsWith(country.dialCode) 
        ? phoneNumber.substring(country.dialCode.length) 
        : phoneNumber;
      
      // Format based on country
      switch (country.id) {
        case 'AU':
          // Australian format: 04XX XXX XXX or +61 4XX XXX XXX
          if (numberWithoutCountry.startsWith('4')) {
            return numberWithoutCountry.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
          }
          break;
        // Add more country-specific formatting as needed
      }
    }
  }
  
  // Default formatting for unknown formats
  return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
};