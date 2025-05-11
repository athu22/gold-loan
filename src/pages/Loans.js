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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { addLoan, getLoans, getCustomers, getAllShops, updateLoan } from '../firebase/services';
import { translations, toMarathiText, formatMarathiCurrency, formatMarathiDate } from '../utils/translations';

function Loans() {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    goldWeight: '',
    goldPurity: '24K',
    loanAmount: '',
    interestRate: '2.5',
    duration: '3',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'customerName', 
      headerName: translations.loans.customerName, 
      width: 200,
      valueGetter: (params) => toMarathiText(params.row.customerName)
    },
    { 
      field: 'goldWeight', 
      headerName: translations.loans.goldWeight, 
      width: 150,
      valueGetter: (params) => toMarathiText(params.row.goldWeight)
    },
    { 
      field: 'goldPurity', 
      headerName: translations.loans.goldPurity, 
      width: 120,
      valueGetter: (params) => toMarathiText(params.row.goldPurity)
    },
    { 
      field: 'loanAmount', 
      headerName: translations.loans.loanAmount, 
      width: 150,
      valueGetter: (params) => formatMarathiCurrency(params.row.loanAmount)
    },
    { 
      field: 'interestRate', 
      headerName: translations.loans.interestRate, 
      width: 120,
      valueGetter: (params) => toMarathiText(params.row.interestRate)
    },
    { 
      field: 'startDate', 
      headerName: translations.loans.startDate, 
      width: 150,
      valueGetter: (params) => formatMarathiDate(params.row.startDate)
    },
    { 
      field: 'endDate', 
      headerName: translations.loans.endDate, 
      width: 150,
      valueGetter: (params) => formatMarathiDate(params.row.endDate)
    },
    { 
      field: 'status', 
      headerName: translations.loans.status, 
      width: 120,
      valueGetter: (params) => toMarathiText(params.row.status)
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
          fetchData(savedShop);
        } else {
          setLoading(false);
        }
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

  const handleShopChange = async (event) => {
    const shopName = event.target.value;
    setSelectedShop(shopName);
    localStorage.setItem('currentShop', shopName);
    if (shopName) {
      await fetchData(shopName);
    } else {
      setCustomers([]);
      setLoans([]);
    }
  };

  const fetchData = async (shopName) => {
    try {
      setLoading(true);
      const [customersResponse, loansResponse] = await Promise.all([
        getCustomers(shopName),
        getLoans(shopName)
      ]);

      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      }

      if (loansResponse.success) {
        const loansArray = Object.entries(loansResponse.data || {}).map(([id, data]) => ({
          id,
          ...data,
          customerName: data.customerName || customers.find(c => c.id === data.customerId)?.name || 'Unknown Customer'
        }));
        setLoans(loansArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClickOpen = () => {
    setFormData({
      customerId: '',
      customerName: '',
      goldWeight: '',
      goldPurity: '24K',
      loanAmount: '',
      interestRate: '2.5',
      duration: '3',
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

  const handleCustomerSelect = (event) => {
    const customerId = event.target.value;
    const selectedCustomer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customerId,
      customerName: selectedCustomer?.name || ''
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await addLoan(selectedShop, formData);
      if (response.success) {
        setSnackbar({
          open: true,
          message: translations.loans.addSuccess,
          severity: 'success',
        });
        handleClose();
        fetchData(selectedShop);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error saving loan:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loan) => {
    setFormData(loan);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(translations.common.confirmDelete)) {
      try {
        setLoading(true);
        const response = await updateLoan(selectedShop, id, { status: 'closed' });
        if (response.success) {
          setSnackbar({
            open: true,
            message: translations.loans.deleteSuccess,
            severity: 'success',
          });
          fetchData(selectedShop);
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error deleting loan:', error);
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
        <Typography variant="h4">{translations.loans.title}</Typography>
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
            {translations.loans.addLoan}
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
            rows={loans}
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
          {formData.id ? translations.common.edit : translations.loans.addLoan}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{translations.loans.customerName}</InputLabel>
                <Select
                  value={formData.customerId}
                  onChange={handleCustomerSelect}
                  label={translations.loans.customerName}
                  required
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {toMarathiText(customer.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={translations.loans.goldWeight}
                name="goldWeight"
                value={formData.goldWeight}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{translations.loans.goldPurity}</InputLabel>
                <Select
                  value={formData.goldPurity}
                  onChange={handleInputChange}
                  name="goldPurity"
                  label={translations.loans.goldPurity}
                  required
                >
                  <MenuItem value="24K">24K</MenuItem>
                  <MenuItem value="22K">22K</MenuItem>
                  <MenuItem value="18K">18K</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={translations.loans.loanAmount}
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={translations.loans.interestRate}
                name="interestRate"
                value={formData.interestRate}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={translations.loans.duration}
                name="duration"
                value={formData.duration}
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

export default Loans; 