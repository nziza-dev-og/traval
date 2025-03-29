import  { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GeoPoint, RouteStop } from '../types';

// Free public token - using this for demo purposes only
// In a real application, you would use your own token and secure it properly
mapboxgl.accessToken = 'pk.eyJ1IjoiZGVtb3VzZXIyMDIzIiwiYSI6ImNscGQ4bW14ODBsZDAyanFqbGk2dngxZXEifQ.XvdPHt94MibdKxo2Y_NaPQ';

interface MapboxMapProps {
  tripLocation?: GeoPoint | null;
  studentLocation?: GeoPoint | null;
  routeStops?: RouteStop[];
  className?: string;
  style?: React.CSSProperties;
  showFullRoute?: boolean;
  zoom?: number;
}

export const MapboxMap = ({
  tripLocation,
  studentLocation,
  routeStops,
  className = 'h-96 w-full rounded-lg',
  style,
  showFullRoute = false,
  zoom = 13
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initialLocation = tripLocation || studentLocation || 
      (routeStops && routeStops.length > 0 ? routeStops[0].location : { latitude: 40.7128, longitude: -74.0060 });

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLocation.longitude, initialLocation.latitude],
      zoom: zoom
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Clear markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Update map when locations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Center map on the trip location if it exists
    if (tripLocation) {
      map.current.setCenter([tripLocation.longitude, tripLocation.latitude]);
      
      // Add the bus marker
      const busMarker = new mapboxgl.Marker({ color: '#f59e0b' })
        .setLngLat([tripLocation.longitude, tripLocation.latitude])
        .addTo(map.current);
        
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML('<div class="font-bold">School Bus</div><div>Current Location</div>');
        
      busMarker.setPopup(popup);
      markersRef.current.push(busMarker);
    }

    // Add student's home location marker if it exists
    if (studentLocation) {
      const studentMarker = new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([studentLocation.longitude, studentLocation.latitude])
        .addTo(map.current);
        
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML('<div class="font-bold">Student\'s Home</div>');
        
      studentMarker.setPopup(popup);
      markersRef.current.push(studentMarker);
    }

    // Add route stops if available
    if (routeStops && routeStops.length > 0) {
      // Add all stops as markers
      routeStops.forEach((stop, index) => {
        const stopMarker = new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([stop.location.longitude, stop.location.latitude])
          .addTo(map.current!);
          
        const time = new Date(stop.estimatedTime as any).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="font-bold">Stop #${index + 1}</div><div>Estimated time: ${time}</div>`);
          
        stopMarker.setPopup(popup);
        markersRef.current.push(stopMarker);
      });

      // Draw route line if showing full route
      if (showFullRoute && map.current.getSource('route')) {
        const coordinates = routeStops.map(stop => [stop.location.longitude, stop.location.latitude]);
        
        if (tripLocation) {
          coordinates.unshift([tripLocation.longitude, tripLocation.latitude]);
        }

        // Update route line
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        });
      } else if (showFullRoute) {
        // Create route line
        const coordinates = routeStops.map(stop => [stop.location.longitude, stop.location.latitude]);
        
        if (tripLocation) {
          coordinates.unshift([tripLocation.longitude, tripLocation.latitude]);
        }

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.7
          }
        });
      }

      // Adjust map bounds to fit all markers
      if (routeStops.length > 1 || (routeStops.length === 1 && tripLocation)) {
        const bounds = new mapboxgl.LngLatBounds();
        
        if (tripLocation) {
          bounds.extend([tripLocation.longitude, tripLocation.latitude]);
        }
        
        if (studentLocation) {
          bounds.extend([studentLocation.longitude, studentLocation.latitude]);
        }
        
        routeStops.forEach(stop => {
          bounds.extend([stop.location.longitude, stop.location.latitude]);
        });
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  }, [tripLocation, studentLocation, routeStops, mapLoaded, showFullRoute]);

  return (
    <div ref={mapContainer} className={className} style={style}>
      {/* Fallback if map doesn't load */}
      {!mapLoaded && (
        <div className="h-full w-full flex items-center justify-center bg-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};
 