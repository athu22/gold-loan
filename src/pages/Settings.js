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
  Tooltip,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Store as StoreIcon,
  AccountCircle as AccountIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as MoneyIcon,
  Notifications as NotificationsIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
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
  shopName: '',
  ownerName: '',
  address: '',
  phone: '',
  email: '',
  gstNumber: '',
  licenseNumber: '',
  openingTime: '09:00',
  closingTime: '18:00',
  amount: '', // <-- Add this line
});

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [shopSelected, setShopSelected] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchShops();
  }, []);

useEffect(() => {
  // Only load settings if the shop name matches an existing shop
  const selectedShop = shops.find(shop => shop.name === settings.shopName);
  if (selectedShop) {
    const loadShopSettings = async () => {
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
        // ...
      } finally {
        setLoading(false);
      }
    };
    loadShopSettings();
  }
  // eslint-disable-next-line
}, [settings.shopName, shops]);

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

const handleSettingChange = (e) => {
  const { name, value, checked, type } = e.target;
  setSettings(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
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
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <StoreIcon fontSize="large" color="primary" />
        सेटिंग्ज
      </Typography>

      {showAlert && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {alertMessage}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Shop Details Section */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><StoreIcon /></Avatar>}
              title="दुकान माहिती"
              subheader="आपल्या दुकानाची मूलभूत माहिती येथे अपडेट करा"
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
<Autocomplete
  freeSolo
  options={shops.map(shop => shop.name)}
  value={settings.shopName}
  onChange={async (event, newValue) => {
    const selectedShop = shops.find(shop => shop.name === newValue);
    if (selectedShop) {
      setLoading(true);
      try {
        const response = await getShopSettings(selectedShop.name);
        if (response.success && response.data) {
          setSettings({
            ...response.data,
            shopName: selectedShop.name,
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'दुकान सेटिंग्ज मिळवताना त्रुटी आली',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    } else {
      setSettings(prev => ({
        ...prev,
        shopName: newValue || ''
      }));
    }
  }}
  onInputChange={(event, newInputValue) => {
    if (!newInputValue) {
      // Clear all fields if input is cleared
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
        amount: '',
      });
    } else {
      setSettings(prev => ({
        ...prev,
        shopName: newInputValue
      }));
    }
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      fullWidth
      label="दुकानाचे नाव"
      name="shopName"
      required
      placeholder="नवीन दुकानाचे नाव टाका किंवा विद्यमान दुकान निवडा"
      InputProps={{
        ...params.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <StoreIcon color="action" />
          </InputAdornment>
        ),
      }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ReceiptIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ReceiptIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="उघडण्याची वेळ"
                    name="openingTime"
                    type="time"
                    value={settings.openingTime}
                    onChange={handleSettingChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 300,
                    }}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScheduleIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="बंद होण्याची वेळ"
                    name="closingTime"
                    type="time"
                    value={settings.closingTime}
                    onChange={handleSettingChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 300,
                    }}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScheduleIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'success.main' }}><MoneyIcon /></Avatar>}
              title="कर्ज सेटिंग्ज"
              subheader="सोने आणि कर्ज संबंधित सेटिंग्ज"
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="सोन्याचा दर (प्रति ग्राम)"
                    name="goldRate"
                    type="number"
                    value={settings.goldRate}
                    onChange={handleSettingChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    label="बंडवल"
    name="amount"
    type="number"
    value={settings.amount}
    onChange={handleSettingChange}
    required
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <MoneyIcon color="action" />
        </InputAdornment>
      ),
    }}
  />
</Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="व्याज दर (%)"
                    name="interestRate"
                    type="number"
                    value={settings.interestRate}
                    onChange={handleSettingChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="कमाल कर्ज टक्केवारी"
                    name="maxLoanPercentage"
                    type="number"
                    value={settings.maxLoanPercentage}
                    onChange={handleSettingChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'info.main' }}><NotificationsIcon /></Avatar>}
              title="सिस्टम सेटिंग्ज"
              subheader="सिस्टम आणि सूचना सेटिंग्ज"
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications}
                        onChange={handleSettingChange}
                        name="enableNotifications"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        सूचना सक्षम करा
                        <Tooltip title="सिस्टम सूचना आणि अलर्ट्स सक्षम करा">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
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
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        स्वयं रिमाइंडर सक्षम करा
                        <Tooltip title="कर्ज परतफेड आणि इतर महत्वाच्या तारखांसाठी स्वयं रिमाइंडर">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="बॅकअप वारंवारता"
                    name="backupFrequency"
                    value={settings.backupFrequency}
                    onChange={handleSettingChange}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="daily">दररोज</option>
                    <option value="weekly">साप्ताहिक</option>
                    <option value="monthly">मासिक</option>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><BackupIcon /></Avatar>}
              title="मेंटेनन्स"
              subheader="सिस्टम मेंटेनन्स आणि बॅकअप"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    onClick={() => handleDialogOpen('backup')}
                    startIcon={<BackupIcon />}
                  >
                    बॅकअप तयार करा
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    onClick={() => handleDialogOpen('restore')}
                    startIcon={<RestoreIcon />}
                  >
                    बॅकअप पुनर्संचयित करा
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => handleDialogOpen('reset')}
                    startIcon={<RefreshIcon />}
                  >
                    सिस्टम रीसेट करा
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => handleDialogOpen('clear')}
                    startIcon={<DeleteIcon />}
                  >
                    सर्व डेटा हटवा
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined"
          onClick={() => window.history.back()}
        >
          मागे जा
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSaveSettings}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'सेव्ह करत आहे...' : 'सेव्ह करा'}
        </Button>
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {dialogType === 'backup' && <BackupIcon color="primary" />}
          {dialogType === 'restore' && <RestoreIcon color="primary" />}
          {dialogType === 'reset' && <RefreshIcon color="error" />}
          {dialogType === 'clear' && <DeleteIcon color="error" />}
          {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {dialogType}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            color={dialogType === 'backup' || dialogType === 'restore' ? 'primary' : 'error'} 
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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