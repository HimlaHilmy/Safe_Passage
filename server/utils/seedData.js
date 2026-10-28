const mongoose = require('mongoose');
const User = require('../models/User');
const { Incident, INCIDENT_STATUS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');

const seedInitialData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Database not connected. Skipping DB seed.');
      return;
    }

    // Check if demo users exist
    const travelerCount = await User.countDocuments({ email: 'traveler@safepassage.org' });
    if (travelerCount === 0) {
      console.log('[Seed] Seeding demo users...');
      await User.create([
        {
          _id: new mongoose.Types.ObjectId('65e000000000000000000001'),
          name: 'Sarah Jenkins',
          email: 'traveler@safepassage.org',
          passwordHash: 'Password123!',
          role: 'traveler',
          phone: '+1 (555) 234-5678',
          accountStatus: 'active',
        },
        {
          _id: new mongoose.Types.ObjectId('65e000000000000000000002'),
          name: 'Apex Rapid Response Ltd',
          email: 'provider@safepassage.org',
          passwordHash: 'Password123!',
          role: 'provider',
          phone: '+1 (555) 987-6543',
          accountStatus: 'active',
          providerDetails: {
            serviceTypes: ['Roadside & Towing', 'Medical First Response'],
            licenseNumber: 'SRI-MED-2026-99',
            verified: true,
            currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
            isAvailable: true,
          },
        },
        {
          _id: new mongoose.Types.ObjectId('65e000000000000000000003'),
          name: 'Himla (Admin Lead)',
          email: 'admin@safepassage.org',
          passwordHash: 'Password123!',
          role: 'admin',
          phone: '+1 (555) 000-1122',
          accountStatus: 'active',
        },
      ]);
      console.log('[Seed] Demo users successfully created.');
    }

    // Check if initial incidents exist for the traveler
    const incidentCount = await Incident.countDocuments();
    if (incidentCount === 0) {
      console.log('[Seed] Seeding sample incidents...');
      const createdIncidents = await Incident.create([
        {
          _id: new mongoose.Types.ObjectId('65f000000000000000000010'),
          incidentReference: 'INC-20261028-1001',
          referenceNumber: 'INC-20261028-1001',
          travelerId: new mongoose.Types.ObjectId('65e000000000000000000001'),
          category: 'Vehicle Breakdown',
          title: 'Engine overheating on Mountain Pass A4',
          description: 'Vehicle radiator steam observed, unable to proceed. Two passengers on board with limited water.',
          severity: 'High',
          incidentDate: new Date(Date.now() - 7200000),
          location: {
            type: 'Point',
            coordinates: [80.6337, 7.2906],
            address: 'Route A4, Mile Marker 42, Central Province',
            landmark: 'Near Viewpoint Cafe',
          },
          media: [
            {
              url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
              type: 'image',
              caption: 'Radiator steam and warning light on dashboard',
              uploadedAt: new Date(Date.now() - 3600000),
            },
          ],
          status: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
          assignedProviderId: new mongoose.Types.ObjectId('65e000000000000000000002'),
          estimatedArrivalTimeMinutes: 18,
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          _id: new mongoose.Types.ObjectId('65f000000000000000000011'),
          incidentReference: 'INC-20261028-1002',
          referenceNumber: 'INC-20261028-1002',
          travelerId: new mongoose.Types.ObjectId('65e000000000000000000001'),
          category: 'Medical Emergency',
          title: 'Severe allergic reaction to food ingredient',
          description: 'Difficulty breathing, facial swelling. Antihistamine administered but condition worsening.',
          severity: 'Critical',
          incidentDate: new Date(Date.now() - 14400000),
          location: {
            type: 'Point',
            coordinates: [79.8612, 6.9271],
            address: 'Galle Face Terrace, Coastal Road',
            landmark: 'Opposite Lighthouse Hotel',
          },
          media: [],
          status: INCIDENT_STATUS.IN_PROGRESS,
          assignedProviderId: new mongoose.Types.ObjectId('65e000000000000000000002'),
          estimatedArrivalTimeMinutes: 5,
          createdAt: new Date(Date.now() - 14400000),
        },
        {
          _id: new mongoose.Types.ObjectId('65f000000000000000000012'),
          incidentReference: 'INC-20261028-1003',
          referenceNumber: 'INC-20261028-1003',
          travelerId: new mongoose.Types.ObjectId('65e000000000000000000001'),
          category: 'Lost Passport or Documents',
          title: 'Backpack stolen with passport and visa documents',
          description: 'Stolen from restaurant table while ordering. Police report required for emergency travel doc.',
          severity: 'Medium',
          incidentDate: new Date(Date.now() - 21600000),
          location: {
            type: 'Point',
            coordinates: [80.7891, 6.8096],
            address: 'Central Station Food Court, Colombo',
            landmark: 'Platform 2 entrance',
          },
          media: [],
          status: INCIDENT_STATUS.UNDER_REVIEW,
          assignedProviderId: null,
          estimatedArrivalTimeMinutes: null,
          createdAt: new Date(Date.now() - 21600000),
        },
      ]);

      // Seed initial case logs
      for (const inc of createdIncidents) {
        await CaseLog.create({
          incidentId: inc._id,
          updatedBy: inc.travelerId,
          updaterRole: 'traveler',
          previousStatus: 'None',
          newStatus: inc.status,
          notes: `Initial incident reported and status set to ${inc.status}`,
          timestamp: inc.createdAt,
        });
      }
      console.log('[Seed] Sample incidents successfully created.');
    }
  } catch (err) {
    console.warn('[Seed Warning]:', err.message);
  }
};

module.exports = seedInitialData;

