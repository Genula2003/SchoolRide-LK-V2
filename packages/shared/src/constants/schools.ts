export interface SchoolReference {
  id: string;
  name: string;
  district: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
}

export const INITIAL_SCHOOLS: SchoolReference[] = [
  // Colombo District
  {
    id: 'school-col-01',
    name: 'Royal College Colombo',
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Rajakeeya Mawatha, Colombo 00700',
    latitude: 6.9066,
    longitude: 79.8617,
    contactNumber: '+94 11 269 1163'
  },
  {
    id: 'school-col-02',
    name: 'Visakha Vidyalaya',
    district: 'Colombo',
    city: 'Colombo 05',
    address: 'Vajira Road, Colombo 00500',
    latitude: 6.8903,
    longitude: 79.8596,
    contactNumber: '+94 11 258 1904'
  },
  {
    id: 'school-col-03',
    name: 'Ananda College',
    district: 'Colombo',
    city: 'Colombo 10',
    address: 'Ananda Rajakaruna Mawatha, Colombo 01000',
    latitude: 6.9272,
    longitude: 79.8687,
    contactNumber: '+94 11 269 5503'
  },
  {
    id: 'school-col-04',
    name: 'Nalanda College',
    district: 'Colombo',
    city: 'Colombo 10',
    address: 'Ananda Mawatha, Colombo 01000',
    latitude: 6.9287,
    longitude: 79.8732,
    contactNumber: '+94 11 269 2293'
  },
  {
    id: 'school-col-05',
    name: "Ladies' College",
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Sir Ernest de Silva Mawatha, Colombo 00700',
    latitude: 6.9082,
    longitude: 79.8553,
    contactNumber: '+94 11 257 5306'
  },
  {
    id: 'school-col-06',
    name: "S. Thomas' College Mount Lavinia",
    district: 'Colombo',
    city: 'Mount Lavinia',
    address: 'Hotel Road, Mount Lavinia',
    latitude: 6.8378,
    longitude: 79.8647,
    contactNumber: '+94 11 271 2274'
  },
  {
    id: 'school-col-07',
    name: 'Museaus College',
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Rosmead Place, Colombo 00700',
    latitude: 6.9142,
    longitude: 79.8689,
    contactNumber: '+94 11 269 2405'
  },
  {
    id: 'school-col-08',
    name: "St. Joseph's College",
    district: 'Colombo',
    city: 'Colombo 10',
    address: 'Darley Road, Colombo 01000',
    latitude: 6.9248,
    longitude: 79.8624,
    contactNumber: '+94 11 269 2700'
  },
  {
    id: 'school-col-09',
    name: 'Devi Balika Vidyalaya',
    district: 'Colombo',
    city: 'Colombo 08',
    address: 'Dr. C.W.W. Kannangara Mawatha, Colombo 00800',
    latitude: 6.9137,
    longitude: 79.8798,
    contactNumber: '+94 11 269 1876'
  },
  {
    id: 'school-col-10',
    name: 'D.S. Senanayake College',
    district: 'Colombo',
    city: 'Colombo 07',
    address: 'Gregory\'s Road, Colombo 00700',
    latitude: 6.9051,
    longitude: 79.8732,
    contactNumber: '+94 11 269 3568'
  },
  // Gampaha District
  {
    id: 'school-gam-01',
    name: 'Bandaranayake College Gampaha',
    district: 'Gampaha',
    city: 'Gampaha',
    address: 'Miriswatta, Gampaha',
    latitude: 7.0917,
    longitude: 79.9984,
    contactNumber: '+94 33 222 2384'
  },
  {
    id: 'school-gam-02',
    name: 'Maris Stella College',
    district: 'Gampaha',
    city: 'Negombo',
    address: 'Sea Street, Negombo',
    latitude: 7.2105,
    longitude: 79.8427,
    contactNumber: '+94 31 222 2341'
  },
  {
    id: 'school-gam-03',
    name: 'Holy Cross College Gampaha',
    district: 'Gampaha',
    city: 'Gampaha',
    address: 'Miriswatta Road, Gampaha',
    latitude: 7.0890,
    longitude: 80.0012,
    contactNumber: '+94 33 222 2271'
  },
  // Kandy District
  {
    id: 'school-kdy-01',
    name: 'Trinity College Kandy',
    district: 'Kandy',
    city: 'Kandy',
    address: 'D.S. Senanayake Street, Kandy',
    latitude: 7.2965,
    longitude: 80.6382,
    contactNumber: '+94 81 222 3270'
  },
  {
    id: 'school-kdy-02',
    name: 'Dharmaraja College',
    district: 'Kandy',
    city: 'Kandy',
    address: 'Dharmaraja Mawatha, Kandy',
    latitude: 7.2911,
    longitude: 80.6481,
    contactNumber: '+94 81 222 3681'
  },
  {
    id: 'school-kdy-03',
    name: 'Kingswood College',
    district: 'Kandy',
    city: 'Kandy',
    address: 'Peradeniya Road, Kandy',
    latitude: 7.2785,
    longitude: 80.6189,
    contactNumber: '+94 81 222 2492'
  },
  {
    id: 'school-kdy-04',
    name: 'Mahamaya Girls\' College',
    district: 'Kandy',
    city: 'Kandy',
    address: 'Sanghamitta Mawatha, Kandy',
    latitude: 7.2926,
    longitude: 80.6418,
    contactNumber: '+94 81 222 3014'
  },
  // Galle District
  {
    id: 'school-gal-01',
    name: 'Richmond College Galle',
    district: 'Galle',
    city: 'Galle',
    address: 'Richmond Hill Road, Galle',
    latitude: 6.0469,
    longitude: 80.2098,
    contactNumber: '+94 91 223 4467'
  },
  {
    id: 'school-gal-02',
    name: 'Mahinda College Galle',
    district: 'Galle',
    city: 'Galle',
    address: 'Eliot Road, Galle',
    latitude: 6.0504,
    longitude: 80.2156,
    contactNumber: '+94 91 223 4296'
  },
  {
    id: 'school-gal-03',
    name: 'Southlands College Galle',
    district: 'Galle',
    city: 'Galle Fort',
    address: 'Rampart Street, Galle Fort',
    latitude: 6.0289,
    longitude: 80.2173,
    contactNumber: '+94 91 223 4252'
  }
];
