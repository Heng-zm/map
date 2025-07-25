
export interface Place {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number];
  rating: number;
  reviews: number;
  type: string;
  images: string[];
  hours: string;
  tags: string[];
  phone: string;
  website: string;
  icon?: string;
  photosBy: string;
  posts: {
    date: string;
    text: string;
    image?: string;
  }[];
}

export const places: Place[] = [
  {
    id: '1',
    name: 'Gramercy Tavern',
    description: 'A pillar of American fine dining, Gramercy Tavern offers a refined yet rustic experience with its seasonal menu and warm, inviting atmosphere. Known for its exceptional service and commitment to local ingredients.',
    coordinates: [-73.9880, 40.7380],
    rating: 4.7,
    reviews: 2300,
    type: 'American Restaurant',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    hours: 'Open now',
    tags: ['Fine Dining', 'Seasonal Menu', 'Farm-to-table'],
    phone: '(212) 477-0777',
    website: 'gramercytavern.com',
    icon: 'restaurant',
    photosBy: 'Eater NY',
    posts: [
      { date: '2 days ago', text: 'Our new fall menu is here! Featuring butternut squash risotto and roasted duck breast.', image: 'https://placehold.co/100x100.png' },
      { date: '1 week ago', text: 'Join us for happy hour every weekday from 4-6 PM. Special cocktails and appetizers available.', image: 'https://placehold.co/100x100.png' },
    ]
  },
  {
    id: '2',
    name: 'The Modern',
    description: 'Overlooking MoMA\'s sculpture garden, The Modern serves contemporary American cuisine with French influences. The restaurant holds two Michelin stars and features a stunning dining room.',
    coordinates: [-73.9780, 40.7614],
    rating: 4.6,
    reviews: 1800,
    type: 'Contemporary American',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    hours: 'Open now',
    tags: ['Michelin Star', 'Museum Dining', 'Elegant'],
    phone: '(212) 333-1220',
    website: 'themodernnyc.com',
    icon: 'restaurant',
    photosBy: 'NY Times',
    posts: [
        { date: '4 days ago', text: 'Experience our new tasting menu, a journey through seasonal flavors and artistic presentation.' },
        { date: '2 weeks ago', text: 'We are honored to be featured in this year\'s Michelin guide once again.' },
    ]
  },
  {
    id: '3',
    name: 'Katz\'s Delicatessen',
    description: 'A New York institution since 1888, Katz\'s is famous for its towering pastrami sandwiches and classic Jewish deli fare. The bustling, no-frills atmosphere is part of its charm.',
    coordinates: [-73.9873, 40.7223],
    rating: 4.5,
    reviews: 15000,
    type: 'Delicatessen',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    hours: 'Open 24 hours',
    tags: ['Iconic', 'Pastrami', 'Casual'],
    phone: '(212) 254-2246',
    website: 'katzsdelicatessen.com',
    icon: 'restaurant',
    photosBy: 'Various Guests',
     posts: [
        { date: 'Yesterday', text: 'Send a Salami to Your Boy in the Army! Our care packages are available for shipping worldwide.', image: 'https://placehold.co/100x100.png' },
        { date: '5 days ago', text: 'Nothing beats a classic. Pastrami on rye, just the way you like it.' },
    ]
  },
];
