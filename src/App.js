import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Marathi translations
const translations = {
  routes: {
    dashboard: 'डॅशबोर्ड',
    customers: 'ग्राहक',
    loans: 'कर्ज',
    reports: 'अहवाल',
    settings: 'सेटिंग्ज'
  }
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#B8860B', // Dark goldenrod
    },
    secondary: {
      main: '#DAA520', // Goldenrod
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans Marathi',
      'Arial',
      'sans-serif'
    ].join(','),
  },
});

// Create router with future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={router.future}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar translations={translations.routes} />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
