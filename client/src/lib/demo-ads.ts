export type DemoAd = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  is_featured: boolean;
  status: 'published';
  view_count: number;
  rank_score: number;
  published_at: string;
  expires_at: string;
  category: { name: string; slug: string };
  city: { name: string; slug: string };
  package: { name: string; featured_scope?: string; weight?: number };
  seller?: {
    full_name: string;
    email: string;
    member_since: string;
  };
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  media: { media_url: string; is_primary: boolean; media_type: 'image' }[];
};

const FUTURE_DATE = '2099-12-31T00:00:00.000Z';

export const DEMO_ADS: DemoAd[] = [
  {
    id: 'demo-1',
    slug: 'iphone-15-pro-max-256gb',
    title: 'iPhone 15 Pro Max 256GB PTA Approved',
    description: 'Excellent condition, battery health 96%, original box and charger included.',
    price: 314999,
    is_featured: true,
    status: 'published',
    view_count: 278,
    rank_score: 98,
    published_at: '2026-04-20T10:00:00.000Z',
    expires_at: FUTURE_DATE,
    category: { name: 'Mobiles', slug: 'mobiles' },
    city: { name: 'Karachi', slug: 'karachi' },
    package: { name: 'Premium', featured_scope: 'homepage', weight: 3 },
    seller: {
      full_name: 'Ahmed Mobile Hub',
      email: 'seller@adflow.com',
      member_since: '2023-02-15T00:00:00.000Z',
    },
    contact_phone: '+923001112233',
    contact_email: 'seller@adflow.com',
    contact_whatsapp: '923001112233',
    media: [
      {
        media_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
        is_primary: true,
        media_type: 'image',
      },
    ],
  },
  {
    id: 'demo-2',
    slug: 'toyota-corolla-altis-2021',
    title: 'Toyota Corolla Altis 1.6 - 2021',
    description: 'Single owner, bumper to bumper genuine, complete documents and token paid.',
    price: 5490000,
    is_featured: true,
    status: 'published',
    view_count: 190,
    rank_score: 96,
    published_at: '2026-04-19T09:00:00.000Z',
    expires_at: FUTURE_DATE,
    category: { name: 'Vehicles', slug: 'vehicles' },
    city: { name: 'Lahore', slug: 'lahore' },
    package: { name: 'Premium', featured_scope: 'homepage', weight: 3 },
    seller: {
      full_name: 'Auto Zone Lahore',
      email: 'autozone@adflow.com',
      member_since: '2022-09-01T00:00:00.000Z',
    },
    contact_phone: '+923331234567',
    contact_email: 'autozone@adflow.com',
    contact_whatsapp: '923331234567',
    media: [
      {
        media_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
        is_primary: true,
        media_type: 'image',
      },
    ],
  },
  {
    id: 'demo-3',
    slug: 'macbook-pro-m3-16inch',
    title: 'MacBook Pro M3 16-inch 18GB RAM',
    description: 'Like new, barely used. Ideal for developers, designers, and video editors.',
    price: 489999,
    is_featured: true,
    status: 'published',
    view_count: 142,
    rank_score: 95,
    published_at: '2026-04-18T13:00:00.000Z',
    expires_at: FUTURE_DATE,
    category: { name: 'Laptops', slug: 'laptops' },
    city: { name: 'Islamabad', slug: 'islamabad' },
    package: { name: 'Premium', featured_scope: 'homepage', weight: 3 },
    seller: {
      full_name: 'Tech House Islamabad',
      email: 'techhouse@adflow.com',
      member_since: '2024-01-05T00:00:00.000Z',
    },
    contact_phone: '+923451112233',
    contact_email: 'techhouse@adflow.com',
    contact_whatsapp: '923451112233',
    media: [
      {
        media_url: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200',
        is_primary: true,
        media_type: 'image',
      },
    ],
  },
  {
    id: 'demo-4',
    slug: 'furnished-portion-dha-phase-6',
    title: '2 Bed Furnished Portion for Rent in DHA Phase 6',
    description: 'Family-friendly area, attached baths, near market and mosque.',
    price: 155000,
    is_featured: false,
    status: 'published',
    view_count: 87,
    rank_score: 92,
    published_at: '2026-04-17T07:30:00.000Z',
    expires_at: FUTURE_DATE,
    category: { name: 'Property', slug: 'property' },
    city: { name: 'Karachi', slug: 'karachi' },
    package: { name: 'Standard', weight: 2 },
    seller: {
      full_name: 'DHA Estate Links',
      email: 'estate@adflow.com',
      member_since: '2021-07-10T00:00:00.000Z',
    },
    contact_phone: '+923008887766',
    contact_email: 'estate@adflow.com',
    contact_whatsapp: '923008887766',
    media: [
      {
        media_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
        is_primary: true,
        media_type: 'image',
      },
    ],
  },
  {
    id: 'demo-5',
    slug: 'sony-a7iii-mirrorless-camera',
    title: 'Sony A7III Mirrorless Camera with 50mm Lens',
    description: 'Low shutter count, no issue, includes bag + memory card.',
    price: 279999,
    is_featured: false,
    status: 'published',
    view_count: 74,
    rank_score: 90,
    published_at: '2026-04-16T11:00:00.000Z',
    expires_at: FUTURE_DATE,
    category: { name: 'Electronics', slug: 'electronics' },
    city: { name: 'Rawalpindi', slug: 'rawalpindi' },
    package: { name: 'Standard', weight: 2 },
    seller: {
      full_name: 'Photo Gear PK',
      email: 'photogear@adflow.com',
      member_since: '2023-06-20T00:00:00.000Z',
    },
    contact_phone: '+923211234567',
    contact_email: 'photogear@adflow.com',
    contact_whatsapp: '923211234567',
    media: [
      {
        media_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
        is_primary: true,
        media_type: 'image',
      },
    ],
  },
  {
    id: 'demo-6',
    slug: 'graphic-designer-remote-job',
    title: 'Graphic Designer (Remote) - Full Time',
    description: 'Agency is hiring a creative designer with Adobe Suite and branding experience.',
    price: 120000,
    is_featured: false,
    status: 'published',
    view_count: 63,
    rank_score: 88,
    published_at: '2026-04-15T15:00:00.000Z',
    expires_at: FUTURE_DATE,
    category: { name: 'Jobs', slug: 'jobs' },
    city: { name: 'Dubai', slug: 'dubai' },
    package: { name: 'Basic', weight: 1 },
    seller: {
      full_name: 'Creative Talent LLC',
      email: 'hr@adflow.com',
      member_since: '2022-03-18T00:00:00.000Z',
    },
    contact_phone: '+971501112233',
    contact_email: 'hr@adflow.com',
    contact_whatsapp: '971501112233',
    media: [
      {
        media_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        is_primary: true,
        media_type: 'image',
      },
    ],
  },
];
