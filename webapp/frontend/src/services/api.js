// src/services/api.js
import axios from 'axios';

export const fetchIncidents = (params) =>
  axios
    .get('http://localhost:5000/api/incidents', { params })
    .then(res => res.data)
    .catch(err => {
      console.error('API error:', err);
      throw err;
    });
