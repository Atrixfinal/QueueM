import axios from 'axios';
import { getDistance } from 'geolib';
import crypto from 'crypto';
import { db } from '../db/index.js';

// Convert user-friendly text location to coordinates via OpenStreetMap Nominatim
async function geocodeLocation(locationStr) {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: locationStr, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'QueueM-App' } // Nominatim requires User-Agent
    });
    
    if (res.data && res.data.length > 0) {
      return {
        lat: parseFloat(res.data[0].lat),
        lon: parseFloat(res.data[0].lon),
        displayName: res.data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

// Ensure the hospital exists in our local SQLite database so it has an ID we can use for tokens
function syncHospitalToDatabase(h) {
  const txn = db.transaction(() => {
    // Check if hospital with exact name already exists
    const existing = db.prepare('SELECT id FROM hospitals WHERE name = ? COLLATE NOCASE').get(h.name);
    
    if (existing) {
      return existing.id;
    }

    // Insert new Hospital
    const hospitalId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO hospitals (id, name, address, city, type)
      VALUES (?, ?, ?, ?, 'hospital')
    `).run(hospitalId, h.name, h.address, h.city || 'Unknown');

    // Insert default Location for this hospital
    const locationId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO locations (id, hospital_id, name, address, type)
      VALUES (?, ?, ?, ?, 'hospital')
    `).run(locationId, hospitalId, `${h.name} - Main`, h.address);

    // Insert standard Services for this location
    const standardServices = [
      { name: 'General Medicine', avg: 300 },
      { name: 'Emergency', avg: 300 },
      { name: 'Cardiology', avg: 600 }
    ];

    for (const s of standardServices) {
      const serviceId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO services (id, location_id, name, avg_service_time_seconds)
        VALUES (?, ?, ?, ?)
      `).run(serviceId, locationId, s.name, s.avg);
    }

    // Insert default Counters
    db.prepare(`
      INSERT INTO counters (id, location_id, counter_number, status)
      VALUES (?, ?, 1, 'open')
    `).run(crypto.randomUUID(), locationId);

    return hospitalId;
  });

  return txn();
}

export const getNearbyHospitals = async (req, res) => {
  try {
    let { lat, lon, location } = req.query;

    if (!lat || !lon) {
      if (!location) {
        return res.status(400).json({ message: 'Must provide either lat/lon or a location string.' });
      }
      const geo = await geocodeLocation(location);
      if (!geo) {
        return res.status(404).json({ message: `Could not find coordinates for location: ${location}` });
      }
      lat = geo.lat;
      lon = geo.lon;
    }

    // 50km radius Overpass API query for hospitals
    const radius = 50000;
    const overpassQuery = `
      [out:json];
      node(around:${radius},${lat},${lon})["amenity"="hospital"];
      out 20;
    `;

    // Try Overpass, but handle potential timeouts
    let elements = [];
    try {
      const overpassRes = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      elements = overpassRes.data?.elements || [];
    } catch (apiErr) {
      console.warn('Overpass API failed or timed out:', apiErr.message);
      // Fallback: If external API fails, query our SQLite database for whatever hospitals we have
      const existingHospitals = db.prepare('SELECT id, name, address, city FROM hospitals').all();
      return res.json({
        hospitals: existingHospitals.map(h => ({
          ...h,
          distance: 'Unknown km (Offline Mode)'
        })).slice(0, 5),
        source: 'local_database_fallback'
      });
    }

    const hospitals = elements
      .filter(el => el.tags && el.tags.name)
      .map(el => {
        const distMeters = getDistance(
          { latitude: parseFloat(lat), longitude: parseFloat(lon) },
          { latitude: el.lat, longitude: el.lon }
        );
        
        let addressStr = [
          el.tags['addr:housename'],
          el.tags['addr:street'],
          el.tags['addr:suburb'],
          el.tags['addr:city']
        ].filter(Boolean).join(', ');

        return {
          osm_id: el.id,
          name: el.tags.name,
          address: addressStr || 'Address not listed',
          city: el.tags['addr:city'] || '',
          distance_meters: distMeters,
          distance: (distMeters / 1000).toFixed(1) + ' km'
        };
      });

    // Sort by distance (asc)
    hospitals.sort((a, b) => a.distance_meters - b.distance_meters);

    // Limit to top 15 results to prevent overloading UI
    const topHospitals = hospitals.slice(0, 15);

    // Sync arrays to DB and assign local Database ID
    const syncedHospitals = topHospitals.map(h => {
      const localId = syncHospitalToDatabase(h);
      return {
        id: localId,
        name: h.name,
        address: h.address,
        distance: h.distance
      };
    });

    return res.json({ hospitals: syncedHospitals, center: { lat, lon } });

  } catch (error) {
    console.error('Error in getNearbyHospitals:', error);
    return res.status(500).json({ message: 'Internal server error while fetching hospitals' });
  }
};
