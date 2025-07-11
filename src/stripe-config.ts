export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_SetbdHNHAB5kp6',
    priceId: 'price_1RjZoEROyjzYAPs13hu9pcPr',
    name: 'Adventure',
    description: 'Embark on an exciting adventure experience',
    mode: 'payment',
  },
];