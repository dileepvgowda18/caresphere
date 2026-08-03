import { resolveAddress } from './addressCache'

export async function searchHospitalsAroundCity(lat, lon) {
  const radius = 10000

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      way["amenity"="hospital"](around:${radius},${lat},${lon});
      relation["amenity"="hospital"](around:${radius},${lat},${lon});
    );
    out center tags;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!response.ok) {
    throw new Error('Unable to load hospital data from the map service.')
  }

  const data = await response.json()

  const hospitals = await Promise.all(
    (data.elements || []).map(async (element) => {
      const latValue = Number(element.lat ?? element.center?.lat)
      const lonValue = Number(element.lon ?? element.center?.lon)
      const fallbackAddress = element.tags?.['addr:full'] || element.tags?.['addr:street'] || null
      const resolvedAddress = fallbackAddress || (await resolveAddress(latValue, lonValue))

      return {
        id: element.id,
        name: element.tags?.name || 'Unnamed hospital',
        address: resolvedAddress || 'Address unavailable',
        lat: latValue,
        lon: lonValue,
      }
    }),
  )

  return hospitals
}
