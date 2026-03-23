'use client'

import { useState, useMemo } from 'react'
import { sampleListings, filterListings, sortListings, calculateMaintenanceScore } from '@/lib/sample-data'

interface FilterGroup {
  title: string
  expanded: boolean
  fields: React.ReactNode
}

export default function Home() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState('price_asc')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    location: true,
    price: false,
    size: false,
    fees: false,
    building: false,
    maintenance: false,
  })
  
  const filtered = useMemo(() => {
    let result = filterListings(sampleListings, filters)
    result = sortListings(result, sort)
    return result
  }, [filters, sort])
  
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }
  
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const clearFilters = () => {
    setFilters({})
  }
  
  const activeFilterCount = Object.values(filters).filter(v => v).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">NYC Real Estate</h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} listings found
            {activeFilterCount > 0 && ` · ${activeFilterCount} filters active`}
          </p>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar Filters */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
                  Clear all
                </button>
              )}
            </div>
            
            {/* Location Group */}
            <FilterGroup title="Location" expanded={expandedGroups.location} onToggle={() => toggleGroup('location')}>
              <select
                value={filters.borough || ''}
                onChange={(e) => updateFilter('borough', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All Boroughs</option>
                <option value="Manhattan">Manhattan</option>
                <option value="Brooklyn">Brooklyn</option>
                <option value="Queens">Queens</option>
                <option value="Bronx">Bronx</option>
                <option value="Staten Island">Staten Island</option>
              </select>
              <input
                type="text"
                placeholder="Neighborhood (e.g. Tribeca)"
                value={filters.neighborhood || ''}
                onChange={(e) => updateFilter('neighborhood', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm mt-2"
              />
            </FilterGroup>
            
            {/* Price Group */}
            <FilterGroup title="Price" expanded={expandedGroups.price} onToggle={() => toggleGroup('price')}>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={filters.min_price || ''}
                  onChange={(e) => updateFilter('min_price', e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max $"
                  value={filters.max_price || ''}
                  onChange={(e) => updateFilter('max_price', e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
            </FilterGroup>
            
            {/* Size Group */}
            <FilterGroup title="Size" expanded={expandedGroups.size} onToggle={() => toggleGroup('size')}>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min Beds"
                    value={filters.min_beds || ''}
                    onChange={(e) => updateFilter('min_beds', e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max Beds"
                    value={filters.max_beds || ''}
                    onChange={(e) => updateFilter('max_beds', e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Min Baths"
                  value={filters.min_baths || ''}
                  onChange={(e) => updateFilter('min_baths', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min Sqft"
                    value={filters.min_sqft || ''}
                    onChange={(e) => updateFilter('min_sqft', e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max Sqft"
                    value={filters.max_sqft || ''}
                    onChange={(e) => updateFilter('max_sqft', e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </FilterGroup>
            
            {/* Property Type */}
            <FilterGroup title="Property Type" expanded={expandedGroups.building} onToggle={() => toggleGroup('building')}>
              <select
                value={filters.property_type || ''}
                onChange={(e) => updateFilter('property_type', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="condo">Condo</option>
                <option value="coop">Co-op</option>
                <option value="house">House</option>
                <option value="townhouse">Townhouse</option>
                <option value="multi_family">Multi-Family</option>
              </select>
              <div className="flex gap-2 mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.has_doorman === 'true'}
                    onChange={(e) => updateFilter('has_doorman', e.target.checked ? 'true' : '')}
                  />
                  Doorman
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.has_elevator === 'true'}
                    onChange={(e) => updateFilter('has_elevator', e.target.checked ? 'true' : '')}
                  />
                  Elevator
                </label>
              </div>
            </FilterGroup>
            
            {/* Fees Group */}
            <FilterGroup title="Monthly Fees" expanded={expandedGroups.fees} onToggle={() => toggleGroup('fees')}>
              <p className="text-xs text-gray-500 mb-2">
                Combined maintenance/common charges/HOA
              </p>
              <input
                type="number"
                placeholder="Max Monthly Fees $"
                value={filters.max_fees || ''}
                onChange={(e) => updateFilter('max_fees', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </FilterGroup>
            
            {/* Maintenance Score Group */}
            <FilterGroup title="Maintenance Score" expanded={expandedGroups.maintenance} onToggle={() => toggleGroup('maintenance')}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.flag_high_maintenance === 'true'}
                  onChange={(e) => updateFilter('flag_high_maintenance', e.target.checked ? 'true' : '')}
                />
                <span className="text-red-600 font-medium">⚠️ Flag High Increases</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Shows buildings with &gt;5% average annual fee increases
              </p>
            </FilterGroup>
          </div>
        </aside>
        
        {/* Results */}
        <main className="flex-1">
          {/* Sort bar */}
          <div className="bg-white rounded-lg shadow px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="sqft_asc">Sqft: Low to High</option>
              <option value="sqft_desc">Sqft: High to Low</option>
              <option value="fees_asc">Fees: Low to High</option>
              <option value="maintenance_score_desc">Maintenance Risk: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
          
          {/* Listings */}
          <div className="space-y-4">
            {filtered.map((listing) => {
              const maintenanceScore = calculateMaintenanceScore(listing.maintenance_history);
              const totalFees = (listing.maintenance_fee || 0) + (listing.common_charges || 0) + (listing.hoa_fee || 0);
              
              return (
                <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{listing.address}</h3>
                        {listing.building_name && (
                          <span className="text-sm text-gray-500">· {listing.building_name}</span>
                        )}
                      </div>
                      <p className="text-gray-600">
                        {listing.borough} · {listing.neighborhood}
                      </p>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {listing.property_type}
                        </span>
                        {listing.doorman && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                            🚪 Doorman
                          </span>
                        )}
                        {listing.elevator && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                            🛗 Elevator
                          </span>
                        )}
                        {listing.year_built && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                            Built {listing.year_built}
                          </span>
                        )}
                      </div>
                      
                      {/* Maintenance Flag */}
                      {maintenanceScore.flag && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                          <span className="text-red-600">⚠️</span>
                          <span className="text-sm text-red-700">
                            <strong>High fee increases:</strong> {maintenanceScore.annualChange}% avg/year over 5 years
                          </span>
                        </div>
                      )}
                      
                      {/* Amenities */}
                      {listing.amenities && listing.amenities.length > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          {listing.amenities.join(' · ')}
                        </p>
                      )}
                    </div>
                    
                    {/* Price & Fees */}
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold">${listing.price.toLocaleString()}</p>
                      
                      {listing.sqft && (
                        <p className="text-sm text-gray-500">
                          ${Math.round(listing.price / listing.sqft).toLocaleString()}/sqft
                        </p>
                      )}
                      
                      <div className="mt-2 text-sm">
                        <p>{listing.beds}bd · {listing.baths}ba</p>
                        {listing.sqft && <p>{listing.sqft.toLocaleString()} sqft</p>}
                      </div>
                      
                      {totalFees > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-sm">
                            <span className="text-gray-600">Monthly:</span>{' '}
                            <span className="font-medium">${totalFees.toLocaleString()}</span>
                          </p>
                          {listing.property_taxes > 0 && (
                            <p className="text-xs text-gray-500">
                              Taxes: ${Math.round(listing.property_taxes / 12).toLocaleString()}/mo
                            </p>
                          )}
                          {!maintenanceScore.flag && maintenanceScore.score > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Fees stable ({maintenanceScore.annualChange}%/year)
                            </p>
                          )}
                        </div>
                      )}
                      
                      <a
                        href={listing.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        View on {listing.source}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No listings match your filters</p>
                <button onClick={clearFilters} className="mt-2 text-blue-600 hover:underline">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Filter group component
function FilterGroup({ title, expanded, onToggle, children }: { 
  title: string; 
  expanded: boolean; 
  onToggle: () => void;
  children: React.ReactNode 
}) {
  return (
    <div className="border-t pt-3">
      <button 
        onClick={onToggle}
        className="flex items-center justify-between w-full font-medium text-sm"
      >
        {title}
        <span>{expanded ? '−' : '+'}</span>
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
}
