const addressCache = new Map()

export async function resolveAddress(lat, lon) {
  const key = `${lat.toFixed(5)}:${lon.toFixed(5)}`

  if (addressCache.has(key)) {
    return addressCache.get(key)
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      },
    )

    if (!response.ok) {
      const fallback = 'Address unavailable'
      addressCache.set(key, fallback)
      return fallback
    }

    const data = await response.json()
    const resolved = data?.display_name || 'Address unavailable'
    addressCache.set(key, resolved)
    return resolved
  } catch {
    const fallback = 'Address unavailable'
    addressCache.set(key, fallback)
    return fallback
  }
}
