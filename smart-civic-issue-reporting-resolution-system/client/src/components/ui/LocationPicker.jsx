import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvent, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const DEFAULT_POSITION = [20.5937, 78.9629];

function MapAutoCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !position?.length) return;
    try {
      const nextZoom = position[0] === DEFAULT_POSITION[0] && position[1] === DEFAULT_POSITION[1] ? 5 : 16;
      map.setView(position, nextZoom, { animate: true });
    } catch (err) {
      console.error('MapAutoCenter error:', err);
    }
  }, [map, position]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvent('click', (event) => {
    const { latlng } = event;
    if (typeof onMapClick === 'function') {
      onMapClick(latlng);
    }
  });

  return null;
}

export default function LocationPicker({ onLocationSelect }) {
  const [position, setPosition] = useState([20.5937, 78.9629]);
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [locationError, setLocationError] = useState('');

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      if (data && data.address) {
        setAddress(data.address.road || data.address.street || '');
        setArea(data.address.suburb || data.address.village || data.address.neighbourhood || '');
        setCity(data.address.city || data.address.town || data.address.county || '');
        setPincode(data.address.postcode || '');
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }
  };

  const handleGpsDetect = () => {
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setPosition([latitude, longitude]);
        setAccuracy(accuracy);
        reverseGeocode(latitude, longitude);
        setGpsLoading(false);
      },
      (error) => {
        setGpsError('Location access denied. Please enter manually.');
        setGpsLoading(false);
      }
    );
  };

  const handleMapClick = (latlng) => {
    if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') {
      setLocationError('Unable to determine location from map click.');
      return;
    }

    const { lat, lng } = latlng;
    setPosition([lat, lng]);
    setAccuracy(null);
    reverseGeocode(lat, lng);
  };

  const handleMarkerDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    setPosition([lat, lng]);
    setAccuracy(null);
    reverseGeocode(lat, lng);
  };

  const handleConfirm = () => {
    if (!position || position.length < 2) {
      setLocationError('Please select a valid position on the map.');
      return;
    }

    const locationData = {
      latitude: position[0],
      longitude: position[1],
      address: address || 'Location Pin',
      area: area || 'Area Not Specified',
      city: city || 'City Not Specified',
      pincode: pincode || '000000',
    };

    setLocationError('');

    if (typeof onLocationSelect === 'function') {
      onLocationSelect(locationData);
    } else {
      console.error('onLocationSelect is not a function');
    }
  };

  return (
    <div className="space-y-4">
      {/* GPS Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGpsDetect}
          disabled={gpsLoading}
          className="flex items-center gap-2 rounded-lg bg-civic-600 px-4 py-2 text-sm font-semibold text-white hover:bg-civic-700 disabled:opacity-50"
        >
          {gpsLoading ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
          {gpsLoading ? 'Detecting...' : 'Use GPS'}
        </button>
        {accuracy && (
          <span className="text-xs text-slate-500">Accurate to {Math.round(accuracy)} meters</span>
        )}
      </div>

      {gpsError && <p className="text-sm text-rose-600">{gpsError}</p>}
      {locationError && <p className="text-sm text-rose-600">{locationError}</p>}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 w-full">
        <ErrorBoundary
          fallback={
            <div className="rounded-xl bg-slate-100 p-6 text-slate-700 w-full" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Map temporarily unavailable</h3>
                <p className="mt-2 text-sm text-slate-600">
                  You can still enter the location manually and confirm.
                </p>
              </div>
            </div>
          }
        >
          <div className="w-full" style={{ height: '350px' }}>
            <MapContainer
              center={position}
              zoom={position[0] === DEFAULT_POSITION[0] && position[1] === DEFAULT_POSITION[1] ? 5 : 16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapAutoCenter position={position} />
              <MapClickHandler onMapClick={handleMapClick} />
              <Marker
                position={position}
                draggable={true}
                eventHandlers={{ dragend: handleMarkerDrag }}
              />
              {accuracy && (
                <Circle
                  center={position}
                  radius={accuracy}
                  pathOptions={{ color: 'rgba(59, 130, 246, 0.3)', fillOpacity: 0.1 }}
                />
              )}
            </MapContainer>
          </div>
        </ErrorBoundary>
      </div>

      {/* Coordinates Display */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Latitude</label>
          <input
            type="text"
            value={position[0].toFixed(6)}
            readOnly
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Longitude</label>
          <input
            type="text"
            value={position[1].toFixed(6)}
            readOnly
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Manual Address Fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Area / Locality</label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Neighbourhood or locality"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Postal code"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full rounded-lg bg-civic-600 px-4 py-3 text-sm font-semibold text-white hover:bg-civic-700 active:bg-civic-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ cursor: 'pointer' }}
      >
        ✓ Confirm Location
      </button>
    </div>
  );
}
