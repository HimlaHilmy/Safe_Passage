import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import { Truck, Wrench, BatteryCharging, Fuel, ShieldCheck, PhoneCall, AlertOctagon } from 'lucide-react';

export default function RoadsidePage() {
  const roadsideServices = [
    { title: 'Flat Tire Replacement & Puncture Repair', icon: Wrench, time: '20-30 min', price: 'Standard Cover' },
    { title: 'Battery Jumpstart & Alternator Test', icon: BatteryCharging, time: '15-25 min', price: 'Standard Cover' },
    { title: 'Emergency Fuel & Coolant Delivery', icon: Fuel, time: '25-35 min', price: 'Fuel at pump cost' },
    { title: 'Heavy Duty Flatbed Highway Towing', icon: Truck, time: '30-45 min', price: 'Mileage based' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="24/7 Roadside Assistance & Recovery"
        subtitle="Accredited towing, mechanical repair, and emergency fuel delivery across highways and provincial roads."
        breadcrumbs={['Traveler', 'Roadside Assistance']}
      />

      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-white/80">Expressway Highway Command</span>
          <h3 className="text-xl sm:text-2xl font-bold mt-1">Stranded on an Expressway or Highway?</h3>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl">
            Towing patrols are stationed along southern and central interchanges for sub-20 minute dispatch.
          </p>
        </div>
        <Link to="/traveler/report?category=Roadside+%26+Vehicle+Breakdown">
          <Button variant="white" size="lg" icon={AlertOctagon}>
            Request Immediate Tow
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roadsideServices.map((srv, idx) => {
          const Icon = srv.icon;
          return (
            <Card key={idx} className="border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-navy">{srv.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span>ETA: <strong className="text-brand-navy">{srv.time}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">{srv.price}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
