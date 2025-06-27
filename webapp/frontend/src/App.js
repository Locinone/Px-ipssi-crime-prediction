import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton, Box, Typography, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';

import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import TimeSeriesChart from './components/TimeSeriesChart';
import { fetchIncidents } from './services/api';
import './App.css';

export default function App() {
  /* ---------- layout ---------- */
  const theme     = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [drawerOpen, setDrawerOpen] = useState(isDesktop);

  /* ---------- filtres ---------- */
  const [filters, setFilters] = useState({
    startDate: '', endDate: '',
    crimeTypes: [],
    borough: '',
    searchCenter: null,
    comparePrev: false
  });

  /* ---------- état data -------- */
  const [geojson,     setGeojson]     = useState(null);
  const [prevGeojson, setPrevGeojson] = useState(null);
  const [showChart,   setShowChart]   = useState(true);
  const [viewMode]    = useState('Clusters');   // inchangé

  /* ---------- API courant ------ */
  useEffect(() => {
    const p = {};
    if (filters.startDate)             p.start_date  = filters.startDate;
    if (filters.endDate)               p.end_date    = filters.endDate;
    if (filters.crimeTypes.length)     p.crime_type  = filters.crimeTypes.join(',');
    if (filters.borough)               p.borough     = filters.borough;

    fetchIncidents(p).then(setGeojson);
  }, [filters.startDate, filters.endDate,
      filters.crimeTypes, filters.borough]);

  /* ---------- API -1 an --------- */
  useEffect(() => {
    if (!filters.comparePrev) { setPrevGeojson(null); return; }

    const shift = (iso) =>
      iso ? new Date(new Date(iso).setFullYear(
            new Date(iso).getFullYear() - 1)).toISOString().slice(0,10) : '';

    const p = {};
    if (filters.startDate) p.start_date = shift(filters.startDate);
    if (filters.endDate)   p.end_date   = shift(filters.endDate);
    if (filters.crimeTypes.length) p.crime_type = filters.crimeTypes.join(',');
    if (filters.borough)          p.borough    = filters.borough;

    fetchIncidents(p).then(setPrevGeojson);
  }, [filters.comparePrev,
      filters.startDate, filters.endDate,
      filters.crimeTypes, filters.borough]);

  /* ---------- bbox (optionnel) -- */
  const handleBoundsChanged = useCallback(() => {}, []);

  /* ---------- sidebar auto ----- */
  useEffect(() => { setDrawerOpen(isDesktop); }, [isDesktop]);

  /* ---------- render ----------- */
  return (
    <Box display="flex" height="100vh" width="100vw">
      <Sidebar
        open={drawerOpen}
        variant={isDesktop ? 'persistent' : 'temporary'}
        anchor="right"
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        showChart={showChart}
        setShowChart={setShowChart}
      />

      <Box flex={1} display="flex" flexDirection="column" position="relative">
        {!drawerOpen && (
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h4"
          sx={{
            position: 'absolute', top: 16,
            right: drawerOpen && isDesktop ? 316 : 64,
            zIndex: 1000, bgcolor: 'background.paper',
            p: 1, borderRadius: 1
          }}
        >
          NYC Crime Explorer
        </Typography>

        <Box flex={1}>
          {geojson ? (
            <MapView
              key={`${filters.borough}-${filters.startDate}-${filters.endDate}-${filters.crimeTypes.join('|')}`}
              geojson={geojson}
              mode={viewMode}
              onBoundsChanged={handleBoundsChanged}
              searchCenter={filters.searchCenter}
            />
          ) : (
            <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%' }} />
          )}
        </Box>

        {showChart && geojson && (
          <Box sx={{ height: '25%', bgcolor: 'rgba(255,255,255,0.9)' }}>
            <TimeSeriesChart data={{ current: geojson, previous: prevGeojson }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
