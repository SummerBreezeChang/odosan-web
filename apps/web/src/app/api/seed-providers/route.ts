import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

// Sample East Bay providers seed data
const seedProviders = [
  // Plumbing & Drainage
  {
    name: 'Bay Area Plumbing Experts',
    category: 'plumbing_drainage',
    areas_served: ['Berkeley', 'Albany', 'El Cerrito'],
    phone: '(510) 555-0101',
    google_maps_url: 'https://maps.google.com/?cid=1234567890',
    rating: 4.8,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Drain Masters',
    category: 'plumbing_drainage',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville'],
    phone: '(510) 555-0102',
    google_maps_url: 'https://maps.google.com/?cid=1234567891',
    rating: 4.6,
    verification_status: 'verified',
  },
  {
    name: 'Berkeley Plumbing Solutions',
    category: 'plumbing_drainage',
    areas_served: ['Berkeley', 'Kensington', 'Albany'],
    phone: '(510) 555-0103',
    google_maps_url: 'https://maps.google.com/?cid=1234567892',
    rating: 4.7,
    verification_status: 'verified',
  },
  // Gutters & Drainage
  {
    name: 'Precision Gutter Services',
    category: 'gutters_drainage',
    areas_served: ['Berkeley', 'Albany', 'El Cerrito', 'Kensington'],
    phone: '(510) 555-0201',
    google_maps_url: 'https://maps.google.com/?cid=1234567893',
    rating: 4.9,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Gutter Pros',
    category: 'gutters_drainage',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Berkeley'],
    phone: '(510) 555-0202',
    google_maps_url: 'https://maps.google.com/?cid=1234567894',
    rating: 4.5,
    verification_status: 'verified',
  },
  // Landscaping
  {
    name: 'Berkeley Landscape Design',
    category: 'landscaping',
    areas_served: ['Berkeley', 'Albany', 'Kensington'],
    phone: '(510) 555-0301',
    google_maps_url: 'https://maps.google.com/?cid=1234567895',
    rating: 4.8,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Yard Care',
    category: 'landscaping',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville'],
    phone: '(510) 555-0302',
    google_maps_url: 'https://maps.google.com/?cid=1234567896',
    rating: 4.6,
    verification_status: 'verified',
  },
  {
    name: 'Green Thumb Landscaping',
    category: 'landscaping',
    areas_served: ['Berkeley', 'El Cerrito', 'Albany'],
    phone: '(510) 555-0303',
    google_maps_url: 'https://maps.google.com/?cid=1234567897',
    rating: 4.7,
    verification_status: 'verified',
  },
  // Roofing
  {
    name: 'Bay Area Roofing Specialists',
    category: 'roofing',
    areas_served: ['Berkeley', 'Albany', 'El Cerrito', 'Kensington'],
    phone: '(510) 555-0401',
    google_maps_url: 'https://maps.google.com/?cid=1234567898',
    rating: 4.9,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Roof Masters',
    category: 'roofing',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville'],
    phone: '(510) 555-0402',
    google_maps_url: 'https://maps.google.com/?cid=1234567899',
    rating: 4.7,
    verification_status: 'verified',
  },
  // Electrical
  {
    name: 'Berkeley Electric Co',
    category: 'electrical',
    areas_served: ['Berkeley', 'Albany', 'El Cerrito'],
    phone: '(510) 555-0501',
    google_maps_url: 'https://maps.google.com/?cid=1234567900',
    rating: 4.8,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Electrical Services',
    category: 'electrical',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville', 'Alameda'],
    phone: '(510) 555-0502',
    google_maps_url: 'https://maps.google.com/?cid=1234567901',
    rating: 4.6,
    verification_status: 'verified',
  },
  // HVAC
  {
    name: 'Bay Comfort Heating & Air',
    category: 'hvac',
    areas_served: ['Berkeley', 'Albany', 'El Cerrito', 'Kensington'],
    phone: '(510) 555-0601',
    google_maps_url: 'https://maps.google.com/?cid=1234567902',
    rating: 4.9,
    verification_status: 'verified',
  },
  {
    name: 'East Bay HVAC Pros',
    category: 'hvac',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville'],
    phone: '(510) 555-0602',
    google_maps_url: 'https://maps.google.com/?cid=1234567903',
    rating: 4.7,
    verification_status: 'verified',
  },
  // Pest Control
  {
    name: 'Berkeley Pest Solutions',
    category: 'pest_control',
    areas_served: ['Berkeley', 'Albany', 'El Cerrito', 'Kensington'],
    phone: '(510) 555-0701',
    google_maps_url: 'https://maps.google.com/?cid=1234567904',
    rating: 4.8,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Pest Control',
    category: 'pest_control',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville', 'Alameda'],
    phone: '(510) 555-0702',
    google_maps_url: 'https://maps.google.com/?cid=1234567905',
    rating: 4.6,
    verification_status: 'verified',
  },
  // Handyman
  {
    name: 'Berkeley Handyman Services',
    category: 'handyman',
    areas_served: ['Berkeley', 'Albany', 'Kensington'],
    phone: '(510) 555-0801',
    google_maps_url: 'https://maps.google.com/?cid=1234567906',
    rating: 4.7,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Home Repair',
    category: 'handyman',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville'],
    phone: '(510) 555-0802',
    google_maps_url: 'https://maps.google.com/?cid=1234567907',
    rating: 4.8,
    verification_status: 'verified',
  },
  // Painting
  {
    name: 'Bay Area Painting Pros',
    category: 'painting',
    areas_served: ['Berkeley', 'Albany', 'El Cerrito'],
    phone: '(510) 555-0901',
    google_maps_url: 'https://maps.google.com/?cid=1234567908',
    rating: 4.9,
    verification_status: 'verified',
  },
  {
    name: 'East Bay Painters',
    category: 'painting',
    areas_served: ['North Oakland / Rockridge', 'Piedmont', 'Emeryville', 'Alameda'],
    phone: '(510) 555-0902',
    google_maps_url: 'https://maps.google.com/?cid=1234567909',
    rating: 4.7,
    verification_status: 'verified',
  },
];

export async function POST(_request: NextRequest) {
  try {
    // Check if providers already exist
    const existing = await sql`SELECT COUNT(*) as count FROM providers`;
    if (existing[0]?.count > 0) {
      return Response.json({
        message: 'Providers already seeded',
        count: existing[0].count,
      });
    }

    // Insert seed providers
    for (const provider of seedProviders) {
      const provider_id = crypto.randomUUID();
      await sql`
        INSERT INTO providers (
          provider_id,
          name,
          category,
          areas_served,
          phone,
          google_maps_url,
          rating,
          verification_status,
          source_platform
        ) VALUES (
          ${provider_id},
          ${provider.name},
          ${provider.category},
          ${provider.areas_served},
          ${provider.phone},
          ${provider.google_maps_url},
          ${provider.rating},
          ${provider.verification_status},
          'seed_data'
        )
      `;
    }

    return Response.json({
      message: 'Providers seeded successfully',
      count: seedProviders.length,
    });
  } catch (error) {
    console.error('Error seeding providers:', error);
    return Response.json({ error: 'Failed to seed providers' }, { status: 500 });
  }
}
