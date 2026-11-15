import React, { useRef, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { colors } from '../styles/theme';

let WebView = null;
if (Platform.OS !== 'web') {
  try {
    const webviewModule = require('react-native-webview');
    WebView = webviewModule.WebView || webviewModule.default || webviewModule;
  } catch (err) {
    console.warn('InteractiveMap: react-native-webview no disponible:', err.message);
  }
}

/**
 * Componente de Mapa Interactivo Multiplataforma (Android, iOS, Web)
 * Utiliza Leaflet + CartoDB Voyager / OpenStreetMap a través de WebView.
 * 
 * Ventajas:
 * 1. 100% libre de claves de Google Cloud Maps y sin costo ni bloqueos de facturación.
 * 2. Visualización fluida de calles, avenidas y zonas urbanas en alta resolución.
 * 3. Marcador reactivo del vehículo con placa e indicador de disponibilidad Online/Offline.
 * 4. Trazado de ruta y marcadores de recogida (verde) y destino (rojo) para viajes activos.
 * 5. Soporte para recentrado dinámico con animación fluida.
 */
export const InteractiveMap = forwardRef(function InteractiveMap(
  {
    coords = { latitude: 6.2442, longitude: -75.5812 },
    isOnline = false,
    driver = null,
    activeTrip = null,
    style,
    zoom = 16,
  },
  ref
) {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);

  const lat = coords?.latitude || 6.2442;
  const lng = coords?.longitude || -75.5812;
  const plate = driver?.vehicle?.plate || 'ABC123';

  // Exponer métodos imperativos (ej: recentrar)
  useImperativeHandle(ref, () => ({
    recenter: (targetCoords) => {
      const cLat = targetCoords?.latitude || lat;
      const cLng = targetCoords?.longitude || lng;
      const js = `if (window.recenterMap) { window.recenterMap(${cLat}, ${cLng}); } true;`;
      if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage({ type: 'RECENTER', lat: cLat, lng: cLng }, '*');
        } catch (_) {}
      } else if (webViewRef.current?.injectJavaScript) {
        webViewRef.current.injectJavaScript(js);
      }
    },
    updatePosition: (newLat, newLng) => {
      const js = `if (window.updatePosition) { window.updatePosition(${newLat}, ${newLng}); } true;`;
      if (webViewRef.current?.injectJavaScript) {
        webViewRef.current.injectJavaScript(js);
      }
    },
  }));

  // Notificar cambios de posición GPS al mapa en vivo
  useEffect(() => {
    if (webViewRef.current?.injectJavaScript) {
      webViewRef.current.injectJavaScript(
        `if (window.updatePosition) { window.updatePosition(${lat}, ${lng}); } true;`
      );
    }
  }, [lat, lng]);

  // Notificar cambio de estado Online / Offline al marcador
  useEffect(() => {
    if (webViewRef.current?.injectJavaScript) {
      webViewRef.current.injectJavaScript(
        `if (window.setOnlineStatus) { window.setOnlineStatus(${isOnline ? 'true' : 'false'}); } true;`
      );
    }
  }, [isOnline]);

  const mapHtml = useMemo(() => {
    const pickup = activeTrip?.pickup?.coords;
    const dropoff = activeTrip?.dropoff?.coords;
    const pickupAddr = (activeTrip?.pickup?.address || 'Punto de recogida').replace(/'/g, "\\'");
    const dropoffAddr = (activeTrip?.dropoff?.address || 'Destino final').replace(/'/g, "\\'");
    const roadCoords = (activeTrip?.routeCoordinates && activeTrip.routeCoordinates.length > 0)
      ? activeTrip.routeCoordinates
      : null;
    const pickupRoadCoords = (activeTrip?.pickupRouteCoordinates && activeTrip.pickupRouteCoordinates.length > 0)
      ? activeTrip.pickupRouteCoordinates
      : null;
    const initialOnlineColor = isOnline ? '#05A357' : '#1E1E1E';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      margin: 0; padding: 0; width: 100%; height: 100%;
      background: #E5E7EB; overflow: hidden;
      -webkit-user-select: none; user-select: none;
    }
    .car-marker-container {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .car-circle {
      width: 44px; height: 44px; border-radius: 22px;
      background-color: ${initialOnlineColor};
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; transition: background-color 0.3s ease, transform 0.2s ease;
    }
    .plate-badge {
      background: #FDE047; color: #1E1E1E; font-size: 9px; font-weight: 900;
      padding: 1.5px 6px; border-radius: 4px; border: 1px solid #CA8A04;
      margin-top: -6px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);
      letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .route-pin {
      padding: 4px 8px; border-radius: 8px; color: #FFFFFF; font-weight: 800; font-size: 11px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #FFFFFF;
      display: flex; align-items: center; gap: 4px; white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .pickup-pin { background-color: #15803D; }
    .dropoff-pin { background-color: #DC2626; }
    .leaflet-control-attribution { display: none !important; }

    /* Indicador visual de rutas para diferenciarlas a plena vista */
    .route-legend-card {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(15, 23, 42, 0.92);
      padding: 8px 12px;
      border-radius: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 5px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.18);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      pointer-events: none;
    }
    .legend-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-bar {
      width: 18px;
      height: 5px;
      border-radius: 3px;
    }
    .legend-bar-pickup {
      background-color: #10B981;
      border: 1px solid #064E3B;
    }
    .legend-bar-dropoff {
      background-color: #2563EB;
      border: 1px solid #1D4ED8;
    }
    .legend-text {
      color: #F8FAFC;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  ${pickup ? `
  <div class="route-legend-card">
    <div class="legend-row">
      <span class="legend-bar legend-bar-pickup"></span>
      <span class="legend-text">Tu ubicación → Recogida</span>
    </div>
    ${dropoff ? `
    <div class="legend-row">
      <span class="legend-bar legend-bar-dropoff"></span>
      <span class="legend-text">Recogida → Destino</span>
    </div>
    ` : ''}
  </div>
  ` : ''}
  <script>
    try {
      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([${lat}, ${lng}], ${zoom});

      // Mosaicos OpenStreetMap libres sin marca de agua ni requisito de API key
      var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      tileLayer.on('tileerror', function(error) {
        if (error && error.tile && error.coords) {
          var c = error.coords;
          error.tile.src = 'https://tile.openstreetmap.org/' + c.z + '/' + c.x + '/' + c.y + '.png';
        }
      });

      // Marcador del vehículo del conductor
      var carIcon = L.divIcon({
        className: 'car-marker-container',
        html: '<div class="car-circle" id="carCircle">🚗</div><div class="plate-badge">${plate}</div>',
        iconSize: [48, 54],
        iconAnchor: [24, 27]
      });
      var carMarker = L.marker([${lat}, ${lng}], { icon: carIcon }).addTo(map);

      var allBounds = L.latLngBounds([[${lat}, ${lng}]]);

      ${pickup ? `
        var pickupIcon = L.divIcon({
          className: 'custom-pin',
          html: '<div class="route-pin pickup-pin">📍 Recogida</div>',
          iconSize: [84, 30],
          iconAnchor: [42, 15]
        });
        var pickupMarker = L.marker([${pickup.latitude}, ${pickup.longitude}], { icon: pickupIcon }).addTo(map);
        pickupMarker.bindPopup('<b>Punto de Recogida:</b><br>${pickupAddr}');
        allBounds.extend([${pickup.latitude}, ${pickup.longitude}]);
      ` : ''}

      ${dropoff ? `
        var dropoffIcon = L.divIcon({
          className: 'custom-pin',
          html: '<div class="route-pin dropoff-pin">🏁 Destino</div>',
          iconSize: [80, 30],
          iconAnchor: [40, 15]
        });
        var dropoffMarker = L.marker([${dropoff.latitude}, ${dropoff.longitude}], { icon: dropoffIcon }).addTo(map);
        dropoffMarker.bindPopup('<b>Destino Final:</b><br>${dropoffAddr}');
        allBounds.extend([${dropoff.latitude}, ${dropoff.longitude}]);
      ` : ''}

      var initialRoadCoords = ${JSON.stringify(roadCoords || [])};
      var initialPickupRoadCoords = ${JSON.stringify(pickupRoadCoords || [])};

      function updateBounds() {
        if (allBounds && allBounds.isValid()) {
          map.fitBounds(allBounds, { padding: [45, 45], maxZoom: 16 });
        }
      }

      // 1. Trazado de ruta Conductor -> Recogida (Verde Esmeralda #10B981)
      function drawPickupRoute(coords) {
        if (!coords || coords.length < 2) return;
        // Borde oscuro para contraste sobre el mapa
        L.polyline(coords, {
          color: '#064E3B',
          weight: 7,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        // Línea principal sólida verde esmeralda con giros reales
        var pickupLine = L.polyline(coords, {
          color: '#10B981',
          weight: 4.5,
          opacity: 1.0,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        allBounds.extend(pickupLine.getBounds());
        updateBounds();
      }

      // 2. Trazado de ruta Recogida -> Destino (Azul Uber #2563EB)
      function drawDropoffRoute(coords) {
        if (!coords || coords.length < 2) return;
        // Borde exterior oscuro para contraste sobre el mapa
        L.polyline(coords, {
          color: '#1D4ED8',
          weight: 7,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        // Línea principal sólida de navegación azul Uber con giros reales
        var dropoffLine = L.polyline(coords, {
          color: '#2563EB',
          weight: 4.5,
          opacity: 1.0,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        allBounds.extend(dropoffLine.getBounds());
        updateBounds();
      }

      ${pickup ? `
        // Cargar o consultar ruta conductor -> recogida (Verde)
        if (initialPickupRoadCoords && initialPickupRoadCoords.length > 1) {
          drawPickupRoute(initialPickupRoadCoords);
        } else {
          var pickupOsrmUrl = 'https://router.project-osrm.org/route/v1/driving/${lng},${lat};${pickup.longitude},${pickup.latitude}?overview=full&geometries=geojson';
          fetch(pickupOsrmUrl)
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (data && data.routes && data.routes[0]) {
                var pts = data.routes[0].geometry.coordinates.map(function(c) {
                  return [c[1], c[0]];
                });
                drawPickupRoute(pts);
              }
            })
            .catch(function(err) {
              console.warn('Error obteniendo ruta conductor->recogida:', err);
            });
        }
      ` : ''}

      ${pickup && dropoff ? `
        // Cargar o consultar ruta recogida -> destino (Azul)
        if (initialRoadCoords && initialRoadCoords.length > 1) {
          drawDropoffRoute(initialRoadCoords);
        } else {
          var dropoffOsrmUrl = 'https://router.project-osrm.org/route/v1/driving/${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}?overview=full&geometries=geojson';
          fetch(dropoffOsrmUrl)
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (data && data.routes && data.routes[0]) {
                var pts = data.routes[0].geometry.coordinates.map(function(c) {
                  return [c[1], c[0]];
                });
                drawDropoffRoute(pts);
              }
            })
            .catch(function(err) {
              console.warn('Error obteniendo ruta recogida->destino:', err);
            });
        }
      ` : ''}

      window.updatePosition = function(newLat, newLng) {
        if (carMarker) {
          carMarker.setLatLng([newLat, newLng]);
        }
      };

      window.setOnlineStatus = function(isOnline) {
        var circle = document.getElementById('carCircle');
        if (circle) {
          circle.style.backgroundColor = isOnline ? '#05A357' : '#1E1E1E';
        }
      };

      window.recenterMap = function(targetLat, targetLng) {
        map.flyTo([targetLat, targetLng], ${zoom}, { duration: 0.8 });
      };

      window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'RECENTER') {
          window.recenterMap(e.data.lat, e.data.lng);
        }
      });
    } catch (err) {
      console.error('Error inicializando Leaflet:', err);
    }
  </script>
</body>
</html>`;
  }, [
    lat,
    lng,
    plate,
    isOnline,
    activeTrip?.pickup?.coords?.latitude,
    activeTrip?.pickup?.coords?.longitude,
    activeTrip?.dropoff?.coords?.latitude,
    activeTrip?.dropoff?.coords?.longitude,
    activeTrip?.routeCoordinates,
    activeTrip?.pickupRouteCoordinates,
    zoom,
  ]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={styles.webIframe}
          title="Mapa UberClone"
        />
      </View>
    );
  }

  if (!WebView) {
    return (
      <View style={[styles.container, styles.fallbackContainer, style]}>
        <ActivityIndicator size="large" color="#05A357" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        originWhitelist={['*']}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        scalesPageToFit={true}
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#05A357" />
          </View>
        )}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  webView: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  webIframe: {
    border: 'none',
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
