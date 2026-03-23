export const sampleListings = [
  {
    id: 1,
    address: "123 Main St, Apt 4B",
    borough: "Manhattan",
    neighborhood: "Tribeca",
    zip_code: "10013",
    price: 1850000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    property_type: "condo",
    maintenance_fee: 1200,
    common_charges: 1200,
    property_taxes: 4500,
    building_name: "The Artisan Lofts",
    year_built: 2005,
    doorman: true,
    elevator: true,
    amenities: ["Gym", "Pool", "Parking"],
    source: "streeteasy",
    source_url: "https://streeteasy.com/sale/123",
    listed_at: "2024-03-01",
    maintenance_history: [
      { year: 2024, amount: 1200 },
      { year: 2023, amount: 1150 },
      { year: 2022, amount: 1100 },
      { year: 2021, amount: 1050 },
      { year: 2020, amount: 1000 },
    ]
  },
  {
    id: 2,
    address: "456 Park Ave, Apt 15A",
    borough: "Manhattan",
    neighborhood: "Upper East Side",
    zip_code: "10028",
    price: 3200000,
    beds: 3,
    baths: 2.5,
    sqft: 2100,
    property_type: "coop",
    maintenance_fee: 3500,
    property_taxes: 8000,
    building_name: "The Parkwood",
    year_built: 1965,
    doorman: true,
    elevator: true,
    amenities: ["Doorman", "Elevator", "Storage"],
    source: "streeteasy",
    source_url: "https://streeteasy.com/sale/456",
    listed_at: "2024-02-15",
    maintenance_history: [
      { year: 2024, amount: 3500 },
      { year: 2023, amount: 3100 },
      { year: 2022, amount: 2800 },
      { year: 2021, amount: 2600 },
      { year: 2020, amount: 2400 },
    ]
  },
  {
    id: 3,
    address: "789 Berry St",
    borough: "Brooklyn",
    neighborhood: "Williamsburg",
    zip_code: "11211",
    price: 1450000,
    beds: 2,
    baths: 2,
    sqft: 950,
    property_type: "townhouse",
    hoa_fee: 0,
    property_taxes: 3200,
    year_built: 1890,
    doorman: false,
    elevator: false,
    amenities: ["Garden", "Roof Deck"],
    source: "zillow",
    source_url: "https://zillow.com/789",
    listed_at: "2024-03-10",
    maintenance_history: [
      { year: 2024, amount: 0 },
      { year: 2023, amount: 0 },
      { year: 2022, amount: 0 },
      { year: 2021, amount: 0 },
      { year: 2020, amount: 0 },
    ]
  },
  {
    id: 4,
    address: "321 Hudson St, Apt 8C",
    borough: "Manhattan",
    neighborhood: "Soho",
    zip_code: "10013",
    price: 2500000,
    beds: 1,
    baths: 1.5,
    sqft: 800,
    property_type: "condo",
    common_charges: 1800,
    property_taxes: 6000,
    building_name: "Soho Cast Iron",
    year_built: 1880,
    doorman: true,
    elevator: true,
    amenities: ["Concierge", "Gym", "Wine Cellar"],
    source: "streeteasy",
    source_url: "https://streeteasy.com/sale/321",
    listed_at: "2024-03-05",
    maintenance_history: [
      { year: 2024, amount: 1800 },
      { year: 2023, amount: 1750 },
      { year: 2022, amount: 1700 },
      { year: 2021, amount: 1650 },
      { year: 2020, amount: 1600 },
    ]
  },
  {
    id: 5,
    address: "555 5th Ave, Apt 32A",
    borough: "Manhattan",
    neighborhood: "Midtown",
    zip_code: "10017",
    price: 5800000,
    beds: 4,
    baths: 3.5,
    sqft: 3200,
    property_type: "condo",
    common_charges: 4200,
    property_taxes: 15000,
    building_name: "The Plaza Residences",
    year_built: 2007,
    doorman: true,
    elevator: true,
    amenities: ["Pool", "Gym", "Spa", "Parking", "Concierge"],
    source: "streeteasy",
    source_url: "https://streeteasy.com/sale/555",
    listed_at: "2024-01-20",
    maintenance_history: [
      { year: 2024, amount: 4200 },
      { year: 2023, amount: 3800 },
      { year: 2022, amount: 3500 },
      { year: 2021, amount: 3200 },
      { year: 2020, amount: 2900 },
    ]
  },
];

// Calculate maintenance score
export function calculateMaintenanceScore(history: {year: number, amount: number}[]) {
  if (!history || history.length < 2) return { score: 0, flag: false };
  
  const sorted = [...history].sort((a, b) => a.year - b.year);
  const startAmount = sorted[0].amount;
  const endAmount = sorted[sorted.length - 1].amount;
  const years = sorted.length - 1;
  
  if (startAmount === 0) return { score: 0, flag: false };
  
  // Calculate CAGR (Compound Annual Growth Rate)
  const cagr = (Math.pow(endAmount / startAmount, 1 / years) - 1) * 100;
  
  // Flag if >5% annual increase
  const flagged = cagr > 5;
  
  return {
    score: Math.round(cagr * 10) / 10,
    flag: flagged,
    trend: cagr > 0 ? 'increasing' : 'stable',
    annualChange: Math.round(cagr * 10) / 10
  };
}

// Apply filters
export function filterListings(listings: any[], filters: any) {
  return listings.filter(listing => {
    // Borough
    if (filters.borough && listing.borough !== filters.borough) return false;
    
    // Price
    if (filters.min_price && listing.price < parseInt(filters.min_price)) return false;
    if (filters.max_price && listing.price > parseInt(filters.max_price)) return false;
    
    // Beds
    if (filters.min_beds && listing.beds < parseFloat(filters.min_beds)) return false;
    if (filters.max_beds && listing.beds > parseFloat(filters.max_beds)) return false;
    
    // Baths
    if (filters.min_baths && listing.baths < parseFloat(filters.min_baths)) return false;
    
    // Sqft
    if (filters.min_sqft && listing.sqft < parseInt(filters.min_sqft)) return false;
    if (filters.max_sqft && listing.sqft > parseInt(filters.max_sqft)) return false;
    
    // Property type
    if (filters.property_type && listing.property_type !== filters.property_type) return false;
    
    // Fees
    const totalFees = (listing.maintenance_fee || 0) + (listing.common_charges || 0) + (listing.hoa_fee || 0);
    if (filters.max_fees && totalFees > parseInt(filters.max_fees)) return false;
    
    // Amenities
    if (filters.has_doorman && !listing.doorman) return false;
    if (filters.has_elevator && !listing.elevator) return false;
    
    // Neighborhood
    if (filters.neighborhood && !listing.neighborhood?.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
    
    // Maintenance flag
    if (filters.flag_high_maintenance) {
      const score = calculateMaintenanceScore(listing.maintenance_history);
      if (!score.flag) return false;
    }
    
    return true;
  });
}

// Sort listings
export function sortListings(listings: any[], sort: string) {
  const sorted = [...listings];
  switch (sort) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'sqft_asc':
      return sorted.sort((a, b) => (a.sqft || 0) - (b.sqft || 0));
    case 'sqft_desc':
      return sorted.sort((a, b) => (b.sqft || 0) - (a.sqft || 0));
    case 'fees_asc':
      return sorted.sort((a, b) => {
        const feesA = (a.maintenance_fee || 0) + (a.common_charges || 0);
        const feesB = (b.maintenance_fee || 0) + (b.common_charges || 0);
        return feesA - feesB;
      });
    case 'maintenance_score_desc':
      return sorted.sort((a, b) => {
        const scoreA = calculateMaintenanceScore(a.maintenance_history).score;
        const scoreB = calculateMaintenanceScore(b.maintenance_history).score;
        return scoreB - scoreA;
      });
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime());
  }
}
