import { useState, useEffect } from 'react';

const INITIAL_TRANSMUTATION = [
  { min: 99.50, max: 100.00, transmutedValue: 100 },
  { min: 97.50, max: 99.49, transmutedValue: 99 },
  { min: 96.00, max: 97.49, transmutedValue: 98 },
  { min: 95.00, max: 95.99, transmutedValue: 97 },
  { min: 94.00, max: 94.99, transmutedValue: 96 },
  { min: 93.00, max: 93.99, transmutedValue: 95 },
  { min: 92.00, max: 92.99, transmutedValue: 94 },
  { min: 91.00, max: 91.99, transmutedValue: 93 },
  { min: 90.00, max: 90.99, transmutedValue: 92 },
  { min: 89.00, max: 89.99, transmutedValue: 91 },
  { min: 88.00, max: 88.99, transmutedValue: 90 },
  { min: 87.00, max: 87.99, transmutedValue: 89 },
  { min: 86.00, max: 86.99, transmutedValue: 88 },
  { min: 85.00, max: 85.99, transmutedValue: 87 },
  { min: 84.00, max: 84.99, transmutedValue: 86 },
  { min: 83.00, max: 83.99, transmutedValue: 85 },
  { min: 82.00, max: 82.99, transmutedValue: 84 },
  { min: 81.00, max: 81.99, transmutedValue: 83 },
  { min: 80.00, max: 80.99, transmutedValue: 82 },
  { min: 79.00, max: 79.99, transmutedValue: 81 },
  { min: 78.00, max: 78.99, transmutedValue: 80 },
  { min: 77.00, max: 77.99, transmutedValue: 79 },
  { min: 76.00, max: 76.99, transmutedValue: 78 },
  { min: 75.00, max: 75.99, transmutedValue: 77 },
  { min: 73.00, max: 74.99, transmutedValue: 76 },
  { min: 70.00, max: 72.99, transmutedValue: 75 },
  { min: 68.00, max: 69.99, transmutedValue: 74 },
  { min: 66.00, max: 67.99, transmutedValue: 73 },
  { min: 64.00, max: 65.99, transmutedValue: 72 },
  { min: 62.00, max: 63.99, transmutedValue: 71 },
  { min: 60.00, max: 61.99, transmutedValue: 70 },
  { min: 58.00, max: 59.99, transmutedValue: 69 },
  { min: 56.00, max: 57.99, transmutedValue: 68 },
  { min: 54.00, max: 55.99, transmutedValue: 67 },
  { min: 52.00, max: 53.99, transmutedValue: 66 },
  { min: 50.00, max: 51.99, transmutedValue: 65 },
  { min: 48.00, max: 49.99, transmutedValue: 64 },
  { min: 46.00, max: 47.99, transmutedValue: 63 },
  { min: 43.00, max: 45.99, transmutedValue: 62 },
  { min: 40.00, max: 42.99, transmutedValue: 61 },
  { min: 0.00, max: 39.99, transmutedValue: 60 }
];

const INITIAL_DESCRIPTORS = [
  { min: 90, max: 100, label: 'Advancing', color: 'text-emerald-600' },
  { min: 80, max: 89, label: 'Benchmarking', color: 'text-blue-600' },
  { min: 75, max: 79, label: 'Connecting', color: 'text-amber-600' },
  { min: 65, max: 74, label: 'Developing', color: 'text-orange-600' },
  { min: 0, max: 64, label: 'Emerging', color: 'text-rose-600' },
];

export function useGradingStandards() {
  const [transmutationTable, setTransmutationTable] = useState(() => JSON.parse(localStorage.getItem('gradeMaster_transmutation')) || INITIAL_TRANSMUTATION);
  const [descriptors, setDescriptors] = useState(() => JSON.parse(localStorage.getItem('gradeMaster_descriptors')) || INITIAL_DESCRIPTORS);

  useEffect(() => localStorage.setItem('gradeMaster_transmutation', JSON.stringify(transmutationTable)), [transmutationTable]);
  useEffect(() => localStorage.setItem('gradeMaster_descriptors', JSON.stringify(descriptors)), [descriptors]);

  return { transmutationTable, setTransmutationTable, descriptors, setDescriptors };
}