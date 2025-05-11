import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const Navbar = ({ translations }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { text: translations.dashboard, icon: <DashboardIcon />, path: '/' },
    { text: translations.customers, icon: <PeopleIcon />, path: '/customers' },
    { text: translations.loans, icon: <AccountBalanceIcon />, path: '/loans' },
    { text: translations.reports, icon: <AssessmentIcon />, path: '/reports' },
    { text: translations.settings, icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenu}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          सोने कर्ज व्यवस्थापन
        </Typography>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {menuItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              component={RouterLink}
              to={item.path}
              startIcon={item.icon}
            >
              {item.text}
            </Button>
          ))}
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {menuItems.map((item) => (
            <MenuItem
              key={item.text}
              component={RouterLink}
              to={item.path}
              onClick={handleClose}
            >
              {item.icon}
              <Typography sx={{ ml: 1 }}>{item.text}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 