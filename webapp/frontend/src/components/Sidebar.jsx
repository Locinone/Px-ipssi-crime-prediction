import React, { useState, useMemo, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton,
  TextField, Autocomplete,
  Divider, FormControlLabel, Switch,
  Checkbox, FormGroup
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { searchAddress } from '../services/geocodeSearch';

export default function Sidebar({
  open, variant, anchor, onClose,
  filters, setFilters,
  showChart, setShowChart
}) {
  /* -------------------------------- helpers ------------------------------- */
  const handleChange = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  /* ------------------------- crime types + counts ------------------------- */
  const { data: crimeInfo = [] } = useQuery({
    queryKey: ['crimeTypes'],
    queryFn: () =>
      axios.get('http://localhost:5000/api/crime-types').then(r => r.data)
  });

  /* coche tout au premier chargement */
  useEffect(() => {
    if (crimeInfo.length && filters.crimeTypes.length === 0) {
      handleChange('crimeTypes', crimeInfo.map(ci => ci.type));
    }
  }, [crimeInfo]);

  /* ----------------------- autocomplétion adresse ------------------------- */
  const [addrInput, setAddrInput] = useState('');
  const debouncer = useMemo(() => debounce(setAddrInput, 300), []);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['addr', addrInput],
    queryFn: () => searchAddress(addrInput),
    enabled: addrInput.length >= 3
  });

  /* -------------------------------- render -------------------------------- */
  return (
    <Drawer
      variant={variant}
      anchor={anchor}
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box' } }}
    >
      <Box p={2} display="flex" flexDirection="column" height="100%">
        {/* header */}
        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="h6" flexGrow={1}>Filtres</Typography>
          <IconButton onClick={onClose}><ChevronRightIcon /></IconButton>
        </Box>
        <Divider />

        {/* adresse */}
        <Autocomplete
          freeSolo fullWidth size="small"
          options={suggestions}
          getOptionLabel={o => o.label || ''}
          filterOptions={x => x}
          loading={isFetching}
          noOptionsText="Aucune adresse"
          onInputChange={(_, v) => debouncer(v)}
          onChange={(_, v) => {
            handleChange('address', v ? v.label : '');
            if (v) handleChange('searchCenter', [v.lat, v.lon]);
          }}
          renderInput={p => (
            <TextField {...p} label="Adresse" sx={{ mt: 2, mb: 2 }} />
          )}
        />

        {/* dates */}
        <TextField
          label="Du" type="date" size="small" fullWidth
          InputLabelProps={{ shrink: true }} sx={{ mb: 1 }}
          value={filters.startDate || ''}
          onChange={e => handleChange('startDate', e.target.value)}
        />
        <TextField
          label="Au" type="date" size="small" fullWidth
          InputLabelProps={{ shrink: true }} sx={{ mb: 2 }}
          value={filters.endDate || ''}
          onChange={e => handleChange('endDate', e.target.value)}
        />

        {/* crimes checkboxes */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Types de crime</Typography>
        <FormGroup sx={{ mb: 2, maxHeight: 220, overflow: 'auto' }}>
          {crimeInfo.map(ci => (
            <FormControlLabel
              key={ci.type}
              control={
                <Checkbox
                  size="small"
                  checked={filters.crimeTypes.includes(ci.type)}
                  onChange={e => {
                    const cur = filters.crimeTypes;
                    handleChange(
                      'crimeTypes',
                      e.target.checked
                        ? [...cur, ci.type]
                        : cur.filter(t => t !== ci.type)
                    );
                  }}
                />
              }
              label={`${ci.type} (${ci.count})`}
            />
          ))}
        </FormGroup>

        {/* toggle chart */}
        <FormControlLabel
          control={
            <Switch
              checked={showChart}
              onChange={e => setShowChart(e.target.checked)}
            />
          }
          label="Courbe"
          sx={{ mb: 1 }}
        />

        {/* compare previous year */}
        <FormControlLabel
          control={
            <Switch
              checked={filters.comparePrev || false}
              onChange={e => handleChange('comparePrev', e.target.checked)}
            />
          }
          label="Comparer année précédente"
        />
      </Box>
    </Drawer>
  );
}
