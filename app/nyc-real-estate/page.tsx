'use client'

import { useState, useMemo } from 'react'
import { sampleListings, filterListings, sortListings, calculateMaintenanceScore } from '@/lib/sample-data'

export default function Home() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState('price_asc')
  const filtered = useMemo(() => {
    let result = filterListings(sampleListings, filters)
    result = sortListings(result, sort)
    return result
  }, [filters, sort])
  
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const clearFilters = () => {
    setFilters({})
  }
  
  const activeFilterCount = Object.values(filters).filter(v => v).length

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 z-10 bg-black/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium tracking-tight">NYC Real Estate</h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {filtered.length} listings
                {activeFilterCount > 0 && <span className="text-blue-400 ml-2">{activeFilterCount} filters</span>}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button 
                onClick={clearFilters}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Filters */}
        <aside className="w-72 flex-shrink-0">
          <div className="space-y-1">
            {/* Location */}
            <FilterSection title="Location">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Borough</label>
                  <select
                    value={filters.borough || ''}
                    onChange={(e) => updateFilter('borough', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">All Boroughs</option>
                    <option value="Manhattan">Manhattan</option>
                    <option value="Brooklyn">Brooklyn</option>
                    <option value="Queens">Queens</option>
                    <option value="Bronx">Bronx</option>
                    <option value="Staten Island">Staten Island</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Neighborhood</label>
                  <input
                    type="text"
                    placeholder="e.g. Tribeca"
                    value={filters.neighborhood || ''}
                    onChange={(e) => updateFilter('neighborhood', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </FilterSection>
            
            {/* Price */}
            <FilterSection title="Price">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Min</label>
                  <input
                    type="number"
                    placeholder="$"
                    value={filters.min_price || ''}
                    onChange={(e) => updateFilter('min_price', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Max</label>
                  <input
                    type="number"
                    placeholder="$"
                    value={filters.max_price || ''}
                    onChange={(e) => updateFilter('max_price', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </FilterSection>
            
            {/* Size */}
            <FilterSection title="Size">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Beds</label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_beds || ''}
                      onChange={(e) => updateFilter('min_beds', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Baths</label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_baths || ''}
                      onChange={(e) => updateFilter('min_baths', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Square Feet</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_sqft || ''}
                      onChange={(e) => updateFilter('min_sqft', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_sqft || ''}
                      onChange={(e) => updateFilter('max_sqft', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </FilterSection>
            
            {/* Property Type */}
            <FilterSection title="Property Type">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Type</label>
                  <select
                    value={filters.property_type || ''}
                    onChange={(e) => updateFilter('property_type', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">All Types</option>
                    <option value="condo">Condo</option>
                    <option value="coop">Co-op</option>
                    <option value="house">House</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.has_doorman === 'true'}
                      onChange={(e) => updateFilter('has_doorman', e.target.checked ? 'true' : '')}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                    />
                    Doorman
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.has_elevator === 'true'}
                      onChange={(e) => updateFilter('has_elevator', e.target.checked ? 'true' : '')}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                    />
                    Elevator
                  </label>
                </div>
              </div>
            </FilterSection>
            
            {/* Monthly Fees */}
            <FilterSection title="Monthly Fees">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Max Monthly</label>
                <input
                  type="number"
                  placeholder="$"
                  value={filters.max_fees || ''}
                  onChange={(e) => updateFilter('max_fees', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-zinc-600 mt-1.5">Co-op maintenance or condo common charges</p>
              </div>
            </FilterSection>
            
            {/* Maintenance Flags */}
            <FilterSection title="Maintenance Score">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.flag_high_maintenance === 'true'}
                  onChange={(e) => updateFilter('flag_high_maintenance', e.target.checked ? 'true' : '')}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                />
                <div>
                  <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Flag High Increases</span>
                  <p className="text-xs text-zinc-600 mt-0.5">Buildings with &gt;5% avg annual fee increases</p>
                </div>
              </label>
            </FilterSection>
          </div>
        </aside>
        
        {/* Results */}
        <main className="flex-1">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-500">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="sqft_asc">Sqft: Low to High</option>
              <option value="sqft_desc">Sqft: High to Low</option>
              <option value="fees_asc">Fees: Low to High</option>
              <option value="maintenance_score_desc">Risk: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          
          {/* Listings */}
          <div className="space-y-3">
            {filtered.map((listing) => {
              const maintenanceScore = calculateMaintenanceScore(listing.maintenance_history);
              const totalFees = (listing.maintenance_fee || 0) + (listing.common_charges || 0) + (listing.hoa_fee || 0);
              
              return (
                <div key={listing.id} className="group bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="font-medium text-white text-base">{listing.address}</h3>
                        {listing.building_name && (
                          <span className="text-sm text-zinc-500 truncate">· {listing.building_name}</span>
                        )}
                      </div>
                      
                      <p className="text-zinc-500 text-sm mt-0.5">
                        {listing.neighborhood}, {listing.borough}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded">
                          {listing.property_type}
                        </span>
                        {listing.doorman && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">
                            Doorman
                          </span>
                        )}
                        {listing.elevator && (
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                            Elevator
                          </span>
                        )}
                        {listing.year_built && (
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs rounded">
                            {listing.year_built}
                          </span>
                        )}
                      </div>
                      
                      {/* Maintenance Flag */}
                      {maintenanceScore.flag && (
                        <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">⚠</span>
                            <span className="text-sm text-red-300">
                              High fee increases: <strong>{maintenanceScore.annualChange}%</strong>/year avg
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {!maintenanceScore.flag && maintenanceScore.score > 0 && (
                        <div className="mt-3 text-xs text-zinc-500">
                          Fees stable · {maintenanceScore.annualChange}%/year
                        </div>
                      )}
                    </div>
                    
                    {/* Right side */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-medium text-white">${listing.price.toLocaleString()}</p>
                      
                      {listing.sqft && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          ${Math.round(listing.price / listing.sqft).toLocaleString()}/sqft
                        </p>
                      )}
                      
                      <div className="mt-2 text-sm text-zinc-400">
                        <span className="text-white">{listing.beds}</span>bd · <span className="text-white">{listing.baths}</span>ba
                        {listing.sqft && <span> · <span className="text-white">{listing.sqft.toLocaleString()}</span>sqft</span>}
                      </div>
                      
                      {totalFees > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <p className="text-sm">
                            <span className="text-zinc-500">Monthly:</span>{' '}
                            <span className="text-white">${totalFees.toLocaleString()}</span>
                          </p>
                          {listing.property_taxes > 0 && (
                            <p className="text-xs text-zinc-600 mt-0.5">
                              Taxes ${Math.round(listing.property_taxes / 12).toLocaleString()}/mo
                            </p>
                          )}
                        </div>
                      )}
                      
                      <a
                        href={listing.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="text-center py-16 border border-zinc-800 rounded-lg">
                <p className="text-zinc-500">No listings match</p>
                <button 
                  onClick={clearFilters} 
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
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

// Filter section component - simplified, always show content
function FilterSection({ title, children }: { 
  title: string;
  children: React.ReactNode 
}) {
  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-4 mb-3">
      <h3 className="text-sm font-medium text-zinc-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}
