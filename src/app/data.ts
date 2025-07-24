export interface Trail {
  id: string;
  name: string;
  type: string;
  county: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  imageUrl: string;
}

export const trails: Trail[] = [
  {
    id: 'congress-trail',
    name: 'Congress Trail Hike',
    type: 'Loop Hike',
    county: 'Tulare County',
    distance: 2.7,
    elevationGain: 741,
    elevationLoss: 741,
    imageUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'big-trees-trail',
    name: 'The Big Trees Trail Hike',
    type: 'Loop Hike',
    county: 'Tulare County',
    distance: 1.3,
    elevationGain: 240,
    elevationLoss: 240,
    imageUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'crescent-meadow',
    name: 'Crescent Meadow Hike',
    type: 'Loop Hike',
    county: 'Tulare County',
    distance: 1.8,
    elevationGain: 190,
    elevationLoss: 190,
    imageUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'moro-rock',
    name: 'Moro Rock Trail',
    type: 'Out & Back',
    county: 'Tulare County',
    distance: 0.5,
    elevationGain: 200,
    elevationLoss: 200,
    imageUrl: 'https://placehold.co/100x100.png',
  },
];
