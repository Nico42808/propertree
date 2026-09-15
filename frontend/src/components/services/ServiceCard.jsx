/**
 * ServiceCard component - Display a service catalog item
 */
import React from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  BarChart3,
  BadgeCheck,
  BellRing,
  Bike,
  Broom,
  CalendarCheck,
  CalendarDays,
  Car,
  ClipboardCheck,
  Droplets,
  FileText,
  Flame,
  Hammer,
  IdCard,
  KeyRound,
  Languages,
  Laptop,
  Leaf,
  Lock,
  Package,
  Paintbrush,
  Percent,
  PhoneCall,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Snowflake,
  Sparkles,
  Users,
  WalletCards,
  Wind,
  Wrench,
  Zap,
  Bug,
  Home,
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

// Prefer service-specific icons so the catalog is visually easy to scan.
// Category fallbacks remain in place for any future services.
const SERVICE_ICON_MAP = {
  'property management abo': ShieldCheck,
  'arrival preparation': CalendarCheck,
  'fridge refill': ShoppingBasket,
  '24/7 emergency service': BellRing,
  'on-call technician': PhoneCall,
  housekeeping: Broom,
  'handyman service': Hammer,
  maintenance: Wrench,
  'preventive maintenance': ShieldCheck,
  'repair service': Wrench,
  'plumbing repair': Droplets,
  'electrical repair': Zap,
  'hvac service': Wind,
  'interior painting': Paintbrush,
  'touch-up painting': Paintbrush,
  'deep cleaning': Sparkles,
  'mid-stay cleaning': Broom,
  'property inspection': ClipboardCheck,
  'safety inspection': ShieldCheck,
  'fire safety check': Flame,
  'smoke detector check': BellRing,
  'garden maintenance': Leaf,
  'snow removal': Snowflake,
  'key exchange': KeyRound,
  'key handover': KeyRound,
  'smart lock installation': Lock,
  'smart lock management': Lock,
  'pest inspection': Bug,
  'pest treatment': Bug,
  'fridge stocking': ShoppingBasket,
  'airport transfer': Car,
  'chauffeur service': Car,
  'car rental': Car,
  'bike rental': Bike,
  'equipment rental': Package,
  'workspace setup': Laptop,
  'contractor management': Users,
  'dynamic pricing': BarChart3,
  'revenue management': BarChart3,
  'yield management': Percent,
  'booking calendar sync': CalendarDays,
  'multilingual support': Languages,
  'damage reporting': AlertTriangle,
  'insurance claim handling': FileText,
  'deposit management': WalletCards,
  'compliance support': BadgeCheck,
  'guest identity verification': IdCard,
};

const CATEGORY_ICON_MAP = {
  plumbing: Droplets,
  electrical: Zap,
  hvac: Wind,
  appliance: Settings,
  cleaning: Sparkles,
  painting: Paintbrush,
  carpentry: Hammer,
  locksmith: Lock,
  gardening: Leaf,
  pest_control: Bug,
  general_maintenance: Home,
  other: Wrench,
};

const ServiceCard = ({ service, onBook }) => {
  const serviceName = service.name?.toLowerCase() || '';
  const Icon = SERVICE_ICON_MAP[serviceName] || CATEGORY_ICON_MAP[service.category] || CATEGORY_ICON_MAP.other;

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours}h ${mins}m`;
  };

  const formatPriceRange = () => {
    if (service.estimated_price_min && service.estimated_price_max) {
      return `${formatCurrency(service.estimated_price_min)} - ${formatCurrency(service.estimated_price_max)}`;
    }
    return 'Price on request';
  };

  return (
    <Card hover className="h-full flex flex-col">
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
            <Icon className="w-7 h-7" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {service.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {service.description}
          </p>

          {/* Price and Duration */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-gray-900">
                {formatPriceRange()}
              </span>
              {service.estimated_duration_minutes && (
                <span className="text-xs text-gray-500">
                  ~{formatDuration(service.estimated_duration_minutes)}
                </span>
              )}
            </div>
          </div>

          {/* Book Button */}
          <Button size="sm" fullWidth onClick={() => onBook(service)}>
            Book Service
          </Button>
        </div>
      </div>
    </Card>
  );
};

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    estimated_price_min: PropTypes.string,
    estimated_price_max: PropTypes.string,
    estimated_duration_minutes: PropTypes.number,
    icon: PropTypes.string,
    is_active: PropTypes.bool,
  }).isRequired,
  onBook: PropTypes.func.isRequired,
};

export default ServiceCard;
