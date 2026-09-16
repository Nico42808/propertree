/**
 * Step 4: Address Information
 */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Input } from '../../../components/common';
import { MapPin } from 'lucide-react';

const AddressStep = ({ formData, updateFormData }) => {
  const [query, setQuery] = useState(formData.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setQuery(formData.address || '');
  }, [formData.address]);

  useEffect(() => {
    if (!query || query.trim().length < 3 || query === formData.address) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const search = encodeURIComponent(`${query}, Nova Scotia, Canada`);
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ca&viewbox=-66.45,47.1,-59.6,43.3&bounded=1&q=${search}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Address lookup failed');
        const results = await response.json();
        setSuggestions(Array.isArray(results) ? results : []);
      } catch (error) {
        if (error.name !== 'AbortError') setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, formData.address]);

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    updateFormData({ address: value });
  };

  const selectSuggestion = (suggestion) => {
    const address = suggestion.address || {};
    const street = [address.house_number, address.road].filter(Boolean).join(' ');
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.county ||
      '';

    const nextAddress = street || suggestion.display_name?.split(',')[0] || query;

    setQuery(nextAddress);
    setSuggestions([]);
    updateFormData({
      address: nextAddress,
      city,
      state: 'Nova Scotia',
      country: 'Canada',
      postal_code: address.postcode || '',
    });
  };

  return (
    <div>
      <p className="text-gray-600 mb-6">
        Where is your property located in Nova Scotia?
      </p>

      <div className="space-y-4">
        <div className="relative">
          <Input
            label="Address"
            name="address"
            placeholder="Start typing a Nova Scotia address"
            value={query}
            onChange={handleAddressChange}
            leftIcon={<MapPin className="w-5 h-5 text-gray-400" />}
            autoComplete="off"
            required
          />

          {(isSearching || suggestions.length > 0) && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {isSearching && suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching Nova Scotia addresses...</div>
              ) : (
                suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 last:border-b-0 hover:bg-gray-50"
                  >
                    {suggestion.display_name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            name="city"
            placeholder="Halifax"
            value={formData.city}
            onChange={handleManualChange}
            required
          />
          <Input
            label="Province"
            name="state"
            placeholder="Nova Scotia"
            value={formData.state}
            onChange={handleManualChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Country"
            name="country"
            placeholder="Canada"
            value={formData.country}
            onChange={handleManualChange}
            required
          />
          <Input
            label="Postal Code"
            name="postal_code"
            placeholder="B3H 1Y2"
            value={formData.postal_code}
            onChange={handleManualChange}
            required
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 text-sm">
          Start with the street address and select a suggestion to automatically fill City, Province, Country and Postal Code.
        </p>
        <p className="mt-1 text-xs text-green-700">Address suggestions powered by OpenStreetMap.</p>
      </div>
    </div>
  );
};

AddressStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default AddressStep;
