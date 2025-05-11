import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { saveShopSettings, getShopSettings, getAllShops } from '../firebase/services';

function Settings() {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [settings, setSettings] = useState({
    goldRate: 6000,
    interestRate: 2.5,
    maxLoanPercentage: 70,
    enableNotifications: true,
    enableAutoReminders: true,
    backupFrequency: 'daily',
    // Shop details
    shopName: '',
    ownerName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    licenseNumber: '',
    openingTime: '09:00',
    closingTime: '18:00',
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    const loadShopSettings = async () => {
      if (settings.shopName) {
        try {
          setLoading(true);
          const response = await getShopSettings(settings.shopName);
          if (response.success && response.data) {
            setSettings(prev => ({
              ...prev,
              ...response.data
            }));
          }
        } catch (error) {
          console.error('Error loading shop settings:', error);
          setSnackbar({
            open: true,
            message: 'दुकान सेटिंग्ज मिळवताना त्रुटी आली',
            severity: 'error',
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadShopSettings();
  }, [settings.shopName]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await getAllShops();
      if (response.success) {
        const shopsArray = Object.entries(response.data || {}).map(([id, data]) => ({
          id,
          name: data.shopName,
          ...data
        }));
        setShops(shopsArray);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setSnackbar({
        open: true,
        message: 'दुकाने मिळवताना त्रुटी आली',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'shopName') {
      if (!value) {
        // Clear all fields when shop name is cleared
        setSettings({
          goldRate: 6000,
          interestRate: 2.5,
          maxLoanPercentage: 70,
          enableNotifications: true,
          enableAutoReminders: true,
          backupFrequency: 'daily',
          shopName: '',
          ownerName: '',
          address: '',
          phone: '',
          email: '',
          gstNumber: '',
          licenseNumber: '',
          openingTime: '09:00',
          closingTime: '18:00',
        });
      } else {
        // Find the selected shop
        const selectedShop = shops.find(shop => shop.name === value);
        if (selectedShop) {
          // Update all settings with the selected shop's data
          setSettings(prev => ({
            ...prev,
            shopName: selectedShop.name,
            ownerName: selectedShop.ownerName || '',
            address: selectedShop.address || '',
            phone: selectedShop.phone || '',
            email: selectedShop.email || '',
            gstNumber: selectedShop.gstNumber || '',
            licenseNumber: selectedShop.licenseNumber || '',
            openingTime: selectedShop.openingTime || '09:00',
            closingTime: selectedShop.closingTime || '18:00',
            goldRate: selectedShop.goldRate || 6000,
            interestRate: selectedShop.interestRate || 2.5,
            maxLoanPercentage: selectedShop.maxLoanPercentage || 70,
            enableNotifications: selectedShop.enableNotifications ?? true,
            enableAutoReminders: selectedShop.enableAutoReminders ?? true,
            backupFrequency: selectedShop.backupFrequency || 'daily',
          }));
        } else {
          // If it's a new shop name, just update the shop name and keep other fields
          setSettings(prev => ({
            ...prev,
            shopName: value
          }));
        }
      }
    } else {
      // For other fields, update normally
      setSettings(prev => ({
        ...prev,
        [name]: e.target.type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // Ensure shop name is provided
      if (!settings.shopName) {
        setSnackbar({
          open: true,
          message: 'कृपया दुकानाचे नाव प्रविष्ट करा',
          severity: 'error',
        });
        return;
      }

      const result = await saveShopSettings(settings);
      if (result.success) {
        // Refresh the shops list after saving
        await fetchShops();
        setSnackbar({
          open: true,
          message: 'सेटिंग्ज यशस्वीरित्या सेव्ह केल्या',
          severity: 'success',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'सेटिंग्ज सेव्ह करताना त्रुटी आली',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleConfirmAction = () => {
    // Here you would typically make an API call to perform the action
    console.log(`Performing ${dialogType} action...`);
    setOpenDialog(false);
    setShowAlert(true);
    setAlertMessage(`${dialogType} completed successfully!`);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        सेटिंग्ज
      </Typography>

      {showAlert && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {alertMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Shop Details Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Shop Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={shops.map(shop => shop.name)}
                  value={settings.shopName}
                  onChange={(event, newValue) => {
                    handleSettingChange({
                      target: {
                        name: 'shopName',
                        value: newValue || ''
                      }
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    handleSettingChange({
                      target: {
                        name: 'shopName',
                        value: newValue || ''
                      }
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="दुकानाचे नाव"
                      name="shopName"
                      required
                      placeholder="नवीन दुकानाचे नाव टाका किंवा विद्यमान दुकान निवडा"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="मालकाचे नाव"
                  name="ownerName"
                  value={settings.ownerName}
                  onChange={handleSettingChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="पत्ता"
                  name="address"
                  value={settings.address}
                  onChange={handleSettingChange}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="फोन नंबर"
                  name="phone"
                  value={settings.phone}
                  onChange={handleSettingChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ईमेल"
                  name="email"
                  type="email"
                  value={settings.email}
                  onChange={handleSettingChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="जीएसटी नंबर"
                  name="gstNumber"
                  value={settings.gstNumber}
                  onChange={handleSettingChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="लायसन्स नंबर"
                  name="licenseNumber"
                  value={settings.licenseNumber}
                  onChange={handleSettingChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="कामाचे तास"
                  name="openingTime"
                  type="time"
                  value={settings.openingTime}
                  onChange={handleSettingChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="कामाचे तास"
                  name="closingTime"
                  type="time"
                  value={settings.closingTime}
                  onChange={handleSettingChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                  required
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Loan Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Gold Rate (per gram)"
                  name="goldRate"
                  type="number"
                  value={settings.goldRate}
                  onChange={handleSettingChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Interest Rate (%)"
                  name="interestRate"
                  type="number"
                  value={settings.interestRate}
                  onChange={handleSettingChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Maximum Loan Percentage"
                  name="maxLoanPercentage"
                  type="number"
                  value={settings.maxLoanPercentage}
                  onChange={handleSettingChange}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableNotifications}
                      onChange={handleSettingChange}
                      name="enableNotifications"
                    />
                  }
                  label="Enable Notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableAutoReminders}
                      onChange={handleSettingChange}
                      name="enableAutoReminders"
                    />
                  }
                  label="Enable Auto Reminders"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Backup Frequency"
                  name="backupFrequency"
                  value={settings.backupFrequency}
                  onChange={handleSettingChange}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Maintenance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => handleDialogOpen('backup')}
                >
                  Create Backup
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => handleDialogOpen('restore')}
                >
                  Restore Backup
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={() => handleDialogOpen('reset')}
                >
                  Reset System
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={() => handleDialogOpen('clear')}
                >
                  Clear All Data
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSaveSettings}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'सेव्ह करा'}
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {dialogType}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings; 