// src/components/Filters.jsx
import React, { useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const crimeTypes = [
  'ROBBERY',
  'ASSAULT',
  'DANGEROUS DRUGS',
  'BURGLARY',
  // … ajoute les autres types souhaités
];

const boroughs = [
  'MANHATTAN',
  'BROOKLYN',
  'QUEENS',
  'BRONX',
  'STATEN ISLAND'
];

export default function Filters({ onApply }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [crimeType, setCrimeType] = useState('');
  const [borough, setBorough] = useState('');

  const handleApply = () => {
    onApply({
      start_date: startDate?.toISOString().slice(0, 10),
      end_date:   endDate?.toISOString().slice(0, 10),
      crime_type: crimeType || undefined,
      borough:    borough || undefined
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 2
        }}
      >
        <DatePicker
          label="Date début"
          value={startDate}
          onChange={setStartDate}
          renderInput={params => <TextField {...params} size="small" />}
        />
        <DatePicker
          label="Date fin"
          value={endDate}
          onChange={setEndDate}
          renderInput={params => <TextField {...params} size="small" />}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type de crime</InputLabel>
          <Select
            value={crimeType}
            label="Type de crime"
            onChange={e => setCrimeType(e.target.value)}
          >
            <MenuItem value=""><em>Tous</em></MenuItem>
            {crimeTypes.map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Arrondissement</InputLabel>
          <Select
            value={borough}
            label="Arrondissement"
            onChange={e => setBorough(e.target.value)}
          >
            <MenuItem value=""><em>Tous</em></MenuItem>
            {boroughs.map(b => (
              <MenuItem key={b} value={b}>{b}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleApply}>
          Appliquer
        </Button>
      </Box>
    </LocalizationProvider>
  );
}
