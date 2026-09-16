import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle, Clock, FileText, Wrench } from 'lucide-react';
import { getServiceBookings } from '../../services/serviceService';

const ServiceNotifications = ({ onOpenMyServices }) => {
  const [open, setOpen] = useState(false);
  const { data: services = [] } = useQuery({
    queryKey: ['my-service-bookings'],
    queryFn: getServiceBookings,
    refetchInterval: 60000,
  });

  const list = Array.isArray(services) ? services : [];
  const notifications = useMemo(() => {
    const items = [];
    list.forEach((service) => {
      const name = service.service_catalog?.name || service.title || 'Property Service';
      const property = service.rental_property?.title || 'Your Property';
      if (service.quote_status === 'pending') {
        items.push({ id: `quote-${service.id}`, icon: FileText, title: 'Quote Ready for Review', text: `${name} · ${property}`, priority: 1 });
      } else if (service.status === 'in_progress') {
        items.push({ id: `progress-${service.id}`, icon: Wrench, title: 'Service in Progress', text: `${name} · ${property}`, priority: 2 });
      } else if (service.status === 'assigned') {
        items.push({ id: `scheduled-${service.id}`, icon: Clock, title: 'Service Scheduled', text: `${name} · ${property}`, priority: 3 });
      } else if (service.status === 'resolved') {
        items.push({ id: `completed-${service.id}`, icon: CheckCircle, title: 'Service Completed', text: `${name} · ${property}`, priority: 4 });
      }
    });
    return items.sort((a, b) => a.priority - b.priority).slice(0, 6);
  }, [list]);

  const actionableCount = list.filter((service) => service.quote_status === 'pending' || ['assigned', 'in_progress'].includes(service.status)).length;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-propertree-green hover:border-propertree-green transition-colors" aria-label="Service Notifications">
        <Bell className="w-5 h-5" />
        {actionableCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-propertree-green text-white text-[11px] font-semibold flex items-center justify-center">{actionableCount > 9 ? '9+' : actionableCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-xl z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100"><p className="font-semibold text-gray-900">Service Notifications</p><p className="text-xs text-gray-500 mt-1">Current Updates Across Your Properties</p></div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? <div className="px-4 py-8 text-center text-sm text-gray-500">No New Service Updates</div> : notifications.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} type="button" onClick={() => { setOpen(false); onOpenMyServices?.(); }} className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3"><div className="mt-0.5 h-8 w-8 rounded-full bg-propertree-cream flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-propertree-green" /></div><div><p className="text-sm font-medium text-gray-900">{item.title}</p><p className="text-xs text-gray-500 mt-0.5">{item.text}</p></div></button>;
            })}
          </div>
          <button type="button" onClick={() => { setOpen(false); onOpenMyServices?.(); }} className="w-full px-4 py-3 text-sm font-semibold text-propertree-green hover:bg-gray-50">View My Services</button>
        </div>
      )}
    </div>
  );
};

export default ServiceNotifications;
