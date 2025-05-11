import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { addCustomer, getCustomers, updateCustomer, deleteCustomer, getShopSettings, getAllShops } from '../firebase/services';
import { translations, toMarathiText, formatMarathiDate } from '../utils/translations';

function Customers() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    aadharNumber: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'name', 
      headerName: translations.customers.name, 
      width: 200,
      valueGetter: (params) => toMarathiText(params.row.name)
    },
    { 
      field: 'phone', 
      headerName: translations.customers.phone, 
      width: 150,
      valueGetter: (params) => toMarathiText(params.row.phone)
    },
    { 
      field: 'address', 
      headerName: translations.customers.address, 
      width: 300,
      valueGetter: (params) => toMarathiText(params.row.address)
    },
    { 
      field: 'aadharNumber', 
      headerName: translations.customers.aadharNumber, 
      width: 150,
      valueGetter: (params) => toMarathiText(params.row.aadharNumber)
    },
    {
      field: 'actions',
      headerName: 'क्रिया',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => handleEdit(params.row)}
            sx={{ mr: 1 }}
          >
            {translations.common.edit}
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            {translations.common.delete}
          </Button>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await getAllShops();
      if (response.success) {
        const shopsArray = Object.entries(response.data || {}).map(([id, data]) => ({
          id,
          name: data.shopName,
        }));
        setShops(shopsArray);
        
        // If there's a saved shop, select it
        const savedShop = localStorage.getItem('currentShop');
        if (savedShop && shopsArray.some(shop => shop.name === savedShop)) {
          setSelectedShop(savedShop);
          fetchCustomers(savedShop);
        } else {
          setLoading(false);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
      setLoading(false);
    }
  };

  const fetchCustomers = async (shopName) => {
    try {
      setLoading(true);
      const response = await getCustomers(shopName);
      if (response.success) {
        const customersArray = Object.entries(response.data || {}).map(([id, data]) => ({
          id,
          ...data,
        }));
        setCustomers(customersArray);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShopChange = async (event) => {
    const shopName = event.target.value;
    setSelectedShop(shopName);
    localStorage.setItem('currentShop', shopName);
    if (shopName) {
      await fetchCustomers(shopName);
    } else {
      setCustomers([]);
    }
  };

  const handleClickOpen = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      aadharNumber: '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let response;
      
      if (formData.id) {
        // Update existing customer
        response = await updateCustomer(selectedShop, formData.id, formData);
      } else {
        // Add new customer
        response = await addCustomer(selectedShop, formData);
      }

      if (response.success) {
        setSnackbar({
          open: true,
          message: formData.id ? translations.customers.updateSuccess : translations.customers.addSuccess,
          severity: 'success',
        });
        handleClose();
        fetchCustomers(selectedShop); // Refresh the customer list
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(translations.common.confirmDelete)) {
      try {
        setLoading(true);
        const response = await deleteCustomer(selectedShop, id);
        if (response.success) {
          setSnackbar({
            open: true,
            message: translations.customers.deleteSuccess,
            severity: 'success',
          });
          fetchCustomers(selectedShop); // Refresh the customer list
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        setSnackbar({
          open: true,
          message: translations.common.error,
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{translations.customers.title}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{translations.common.selectShop}</InputLabel>
            <Select
              value={selectedShop}
              onChange={handleShopChange}
              label={translations.common.selectShop}
            >
              <MenuItem value="">{translations.common.selectShop}</MenuItem>
              {shops.map((shop) => (
                <MenuItem key={shop.id} value={shop.name}>
                  {toMarathiText(shop.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
            disabled={loading || !selectedShop}
          >
            {translations.customers.addCustomer}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : !selectedShop ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="h6" color="textSecondary">
              {translations.common.pleaseSelectShop}
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={customers}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            checkboxSelection
            disableSelectionOnClick
          />
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {formData.id ? translations.common.edit : translations.customers.addCustomer}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={translations.customers.name}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={translations.customers.phone}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={translations.customers.address}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={translations.customers.aadharNumber}
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{translations.common.cancel}</Button>
          <Button onClick={handleSubmit} variant="contained">
            {translations.common.save}
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

export default Customers; 