/**
 * Property Search Page - Search and browse approved properties
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/layout';
import { Card, Input, Button, Loading, EmptyState, Badge } from '../components/common';
import { Search, MapPin, Users, Bed, Home } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

const PropertySearch = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    bedrooms: '',
    guests: '',
    city: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      if (filters.guests) params.append('guests', filters.guests);
      if (filters.city) params.append('city', filters.city);
      if (searchQuery) params.append('search', searchQuery);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const url = `${API_BASE_URL}/properties/?${params.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.results || data);
      } else {
        toast.error('Failed to load properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error loading properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const filteredProperties = properties.filter(property => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      property.title?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-propertree-dark">Browse Properties</h1>
        <p className="text-gray-600 mt-2">Find your perfect rental property</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Card.Body>
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div>
              <Input
                leftIcon={<Search className="w-5 h-5" />}
                placeholder="Search by city, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.min_price}
                onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Bedrooms"
                value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Guests"
                value={filters.guests}
                onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
              />
              <Button type="submit" variant="primary" className="w-full sm:col-span-2 lg:col-span-1">
                Search
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
        </p>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={<Home className="w-16 h-16" />}
          title="No properties found"
          message="Try adjusting your search filters or browse all properties"
          action={() => {
            setSearchQuery('');
            setFilters({ min_price: '', max_price: '', bedrooms: '', guests: '', city: '' });
            fetchProperties();
          }}
          actionLabel="Clear Filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProperties.map((property) => (
            <Link key={property.id} to={`/properties/${property.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                {/* Property Image */}
                <div className="card-media bg-gray-200 overflow-hidden rounded-t-2xl">
                  {property.primary_photo ? (
                    <img 
                      src={property.primary_photo} 
                      alt={property.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <Card.Body className="p-4 sm:p-5">
                  {/* Location */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {property.city}, {property.state}, {property.country}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-propertree-dark mb-3 line-clamp-1">
                    {property.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">
                    {property.description}
                  </p>

                  {/* Property Details */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600 mb-5">
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-1.5" />
                      {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1.5" />
                      {property.max_guests} guest{property.max_guests > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xl sm:text-2xl font-bold text-propertree-green">
                        {formatCurrency(property.price_per_night)}
                      </span>
                      <span className="text-gray-600 text-sm ml-1"> / night</span>
                    </div>
                    <Badge variant="success">{property.property_type}</Badge>
                  </div>

                  {/* Landlord */}
                  <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Hosted by {property.landlord_name}
                  </div>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
};

export default PropertySearch;
