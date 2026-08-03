import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function Map({ center, selectedLocation, hospitals = [], activeHospital, onSelectHospital }) {
  const defaultCenter = [12.2958, 76.6394]
  const mapCenter = Array.isArray(center) && center.length === 2 ? center : defaultCenter
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
    return () => setMapReady(false)
  }, [])

  const renderedHospitals = useMemo(
    () => hospitals.filter((hospital) => Number.isFinite(hospital.lat) && Number.isFinite(hospital.lon)),
    [hospitals],
  )

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm sm:h-[460px]">
      {mapReady ? (
        <MapContainer center={mapCenter} zoom={13} scrollWheelZoom zoomControl={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="topright" />

          {selectedLocation && (
            <Marker position={selectedLocation}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">Searched city</p>
                  <p className="mt-1 text-slate-600">Map centered on this location.</p>
                </div>
              </Popup>
            </Marker>
          )}

          {renderedHospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              position={[hospital.lat, hospital.lon]}
              eventHandlers={{ click: () => onSelectHospital?.(hospital) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{hospital.name}</p>
                  <p className="mt-1 text-slate-600">{hospital.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {activeHospital && (
            <Marker position={[activeHospital.lat, activeHospital.lon]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{activeHospital.name}</p>
                  <p className="mt-1 text-slate-600">{activeHospital.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      ) : null}
    </div>
  )
}

export default Map
