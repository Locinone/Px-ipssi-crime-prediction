// src/services/geocode.js
import axios from 'axios';

export async function geocodeAddress(address) {
  const url = 'https://nominatim.openstreetmap.org/search';
  const params = {
    q: address,
    format: 'json',
    addressdetails: 1,
    limit: 1
  };
  const { data } = await axios.get(url, {
    params,
    headers: {
      // Nominatim exige un User-Agent
      'Accept-Language': 'en',
      'User-Agent': 'NYC-Crime-Explorer/1.0 (+https://votre-site.example)'
    }
  });
  if (data.length === 0) {
    throw new Error('Adresse non trouvée');
  }
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}
