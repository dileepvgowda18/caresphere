export async function geocodeCity(cityName) {
  const query = cityName.trim()

  if (!query) {
    throw new Error('Please enter a city name.')
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Accept-Language': 'en',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Unable to search for that city right now.')
  }

  const data = await response.json()

  if (!data || data.length === 0) {
    throw new Error('No location found for that city name.')
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name,
  }
}
