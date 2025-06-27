// src/services/geocodeSearch.js
import axios from 'axios';

/** Bounding box NYC : left (west), top (north), right (east), bottom (south) */
const NYC_VIEWBOX = '-74.25909,40.917577,-73.700272,40.477399';

/** Les 5 boroughs + "New York" souvent utilisé comme city */
const NYC_CITIES = [
  'New York',
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island'
];

/**
 * Retourne jusqu’à 5 suggestions d’adresses,
 * garanties à l’intérieur de New York City.
 */
export async function searchAddress(query) {
  const url = 'https://nominatim.openstreetmap.org/search';
  const params = {
    q: query,
    format: 'json',
    addressdetails: 1,
    dedupe: 1,
    limit: 10,           // on filtre ensuite
    countrycodes: 'us',
    viewbox: NYC_VIEWBOX,
    bounded: 1           // ne sort pas du rectangle
  };

  const { data } = await axios.get(url, {
    params,
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'NYC-Crime-Explorer/1.0 (+https://your-site.example)'
    }
  });

  // Ne garder que les adresses dont city / borough est dans NYC_CITIES
  const onlyNYC = data.filter(item => {
    const adr = item.address || {};
    const city =
      adr.city || adr.town || adr.village ||
      adr.borough || adr.county || '';
    return NYC_CITIES.includes(city);
  });

  // Limiter à 5 suggestions
  return onlyNYC.slice(0, 5).map(item => ({
    label: item.display_name,
    lat:   parseFloat(item.lat),
    lon:   parseFloat(item.lon)
  }));
}
