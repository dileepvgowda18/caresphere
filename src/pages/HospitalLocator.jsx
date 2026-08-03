import { useEffect, useMemo, useState } from 'react'
import Map from '../components/Map'
import { geocodeCity } from '../services/geocoding'
import { searchHospitalsAroundCity } from '../services/overpass'

function calculateDistanceKm(startLat, startLon, endLat, endLon) {
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371

  const deltaLat = toRadians(endLat - startLat)
  const deltaLon = toRadians(endLon - startLon)

  const startLatRadians = toRadians(startLat)
  const endLatRadians = toRadians(endLat)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLatRadians) * Math.cos(endLatRadians) * Math.sin(deltaLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

function HospitalLocator() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [hospitals, setHospitals] = useState([])
  const [activeHospital, setActiveHospital] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('loading')

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unavailable')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lon: coords.longitude })
        setLocationStatus('ready')
      },
      () => {
        setUserLocation(null)
        setLocationStatus('denied')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }, [])

  const displayHospitals = useMemo(() => {
    if (!hospitals.length) {
      return []
    }

    return hospitals
      .map((hospital) => {
        if (!userLocation || locationStatus !== 'ready') {
          return { ...hospital, distanceLabel: 'Distance unavailable', distanceKm: null }
        }

        const distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lon, hospital.lat, hospital.lon)

        return {
          ...hospital,
          distanceLabel: `Distance: ${distanceKm.toFixed(1)} km`,
          distanceKm,
        }
      })
      .sort((a, b) => {
        if (a.distanceKm === null || b.distanceKm === null) {
          return 0
        }

        return a.distanceKm - b.distanceKm
      })
  }, [hospitals, locationStatus, userLocation])

  async function handleSearch(event) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    setHospitals([])
    setActiveHospital(null)

    try {
      const result = await geocodeCity(query)
      setSelectedLocation([result.lat, result.lon])
      setLocationLabel(result.displayName)

      const hospitalResults = await searchHospitalsAroundCity(result.lat, result.lon)
      setHospitals(hospitalResults)

      if (hospitalResults.length === 0) {
        setError('No hospitals were found within 10 km for that city.')
      }
    } catch (err) {
      setSelectedLocation(null)
      setLocationLabel('')
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleDirections(hospital) {
    const baseUrl = 'https://www.google.com/maps/dir/?api=1&travelmode=driving'
    const destination = `&destination=${hospital.lat},${hospital.lon}`
    const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lon}` : ''
    const mapsUrl = `${baseUrl}${origin}${destination}`

    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <section className="mb-8">
        <h2 className="text-3xl font-semibold text-slate-900">Hospital Locator</h2>
        <p className="mt-2 text-lg text-slate-600">Search for nearby hospitals and care centers without leaving the app.</p>
      </section>

      <form onSubmit={handleSearch} className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by city"
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 focus:border-cyan-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      {locationLabel && <p className="mb-4 text-sm text-slate-600">Showing results for: {locationLabel}</p>}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {displayHospitals.length > 0 ? (
            displayHospitals.map((hospital) => (
              <article key={hospital.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">{hospital.name}</h3>
                    <p className="mt-2 flex items-center text-sm font-medium text-cyan-700">
                      <span className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Open now
                    </p>
                    <p className="mt-2 text-sm text-slate-600">📍 {hospital.address}</p>
                    <p className="mt-2 text-sm text-slate-500">📏 {hospital.distanceLabel}</p>
                    <p className="mt-2 text-sm text-amber-600">⭐ Rating available soon</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDirections(hospital)}
                    className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700 whitespace-nowrap"
                  >
                    Get Directions
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Search a city to view hospitals within 10 km.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm">
          <Map center={selectedLocation} selectedLocation={selectedLocation} hospitals={displayHospitals} activeHospital={activeHospital} onSelectHospital={setActiveHospital} />
        </div>
      </section>
    </div>
  )
}

export default HospitalLocator
