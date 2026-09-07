export interface Review {
  id: string;
  name: string;
  email?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedBuyer?: boolean;
  helpfulCount?: number;
  date: string;
  createdAt?: string;
}

export interface RatingBreakdown {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  percentages: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}


export interface Product {
  id: string;
  slug: string;

  name: string;

  collection: {
    name: string;

    slug: string;
  };

  price: number;

  images: string[];

  description: string;

  colors: string[];

  sizes: string[];

  featured: boolean;

  stock: number;

  rating: number;

  reviews: Review[];
}
