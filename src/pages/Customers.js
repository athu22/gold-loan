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
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  alpha,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Badge as BadgeIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { addCustomer, getCustomers, updateCustomer, deleteCustomer, getShopSettings, getAllShops, saveTableData, getTableData } from '../firebase/services';
import { translations, toMarathiName, formatMarathiCurrency, formatMarathiDate } from '../utils/translations';
import MarathiTransliterator from '../components/MarathiTransliterator';

function Customers() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Table headings as per the image
  const headings = [
    'अनु. क्र.',
    'खाते क्र.',
    'पावती क्र.',
    'दिनांक',
    'नावं',
    'वस्तू',
    'रुपये',
    'सोड दि',
    'दिवस',
    'सो पा क्र ',
    'व्याज',
    'पत्ता',
    'सही',
  ];

  // Initial state for a row
  const emptyRow = {
    accountNo: '',
    pavtiNo: '',
    date: '',
    name: '',
    item: '',
    goldRate: '',
    sodDate: '',
    divas: '',
    moparu: '',
    vayaj: '',
    address: '',
    signature: '',
  };

  const [rows, setRows] = useState([{ ...emptyRow }]);

  const columns = [
    { 
      field: 'name', 
      headerName: translations.customers.name, 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography>{toMarathiName(params.row.name)}</Typography>
        </Box>
      )
    },
    { 
      field: 'phone', 
      headerName: translations.customers.phone, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PhoneIcon sx={{ mr: 1, color: theme.palette.info.main }} />
          <Typography>{toMarathiName(params.row.phone)}</Typography>
        </Box>
      )
    },
    { 
      field: 'address', 
      headerName: translations.customers.address, 
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
          <Typography>{toMarathiName(params.row.address)}</Typography>
        </Box>
      )
    },
    { 
      field: 'aadharNumber', 
      headerName: translations.customers.aadharNumber, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BadgeIcon sx={{ mr: 1, color: theme.palette.success.main }} />
          <Typography>{toMarathiName(params.row.aadharNumber)}</Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'क्रिया',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Tooltip title={translations.common.edit}>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{ 
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={translations.common.delete}>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{ 
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchTableData(selectedShop);
    } else {
      setRows([{ ...emptyRow }]);
    }
  }, [selectedShop]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await getAllShops();
      if (response.success) {
        const shopsArray = Object.entries(response.data || {}).map(([id, data]) => ({
          id,
          name: data.shopName,
        }));
        setShops(shopsArray);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'दुकाने मिळवताना त्रुटी आली', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (shopName) => {
    setLoading(true);
    try {
      const response = await getTableData(shopName);
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        setRows(response.data);
      } else {
        setRows([{ ...emptyRow }]);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'डेटा मिळवताना त्रुटी आली', severity: 'error' });
      setRows([{ ...emptyRow }]);
    } finally {
      setLoading(false);
    }
  };

  const handleShopChange = async (event) => {
    const shopName = event.target.value;
    setSelectedShop(shopName);
    localStorage.setItem('currentShop', shopName);
    if (shopName) {
      await fetchTableData(shopName);
    } else {
      setRows([{ ...emptyRow }]);
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
      [name]: name === 'name' ? toMarathiName(value) : value
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
        fetchTableData(selectedShop); // Refresh the customer list
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
          fetchTableData(selectedShop); // Refresh the customer list
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

  const handlePrint = () => {
    const headings = [
      'अ क्र', 'खाते क्र', 'पावती क्र', 'दिनांक', 'नावं', 'वस्तू', 'रुपये', 'सोड दि', 'दिवस', 'सो पा क्र', 'व्याज', 'पत्ता', 'ठेवी', 'काढ', 'सही'
    ];

    const printContent = `
      <div style="padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px;">${toMarathiName(selectedShop)}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr>
              ${headings.map(h => `<th style="border: 1px solid #000; padding: 4px; text-align: center;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, idx) => `
              <tr>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.accountNo || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.pavtiNo || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.date || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.name || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.item || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${row.goldRate || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.sodDate || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.divas || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.moparu || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${row.vayaj || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.address || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <style>
        @media print {
          body { margin: 0; }
          table { page-break-inside: avoid; }
        }
      </style>
    `;

    const printWindow = window.open('', 'printWindow');
    printWindow.document.write(`
      <html>
        <head>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Handle cell change
  const handleCellChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  // Add new row
  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  // Delete row
  const handleDeleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows.length ? updatedRows : [{ ...emptyRow }]);
  };

  // Save all rows to backend
  const handleSave = async () => {
    if (!selectedShop) {
      setSnackbar({ open: true, message: 'कृपया दुकान निवडा', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      const response = await saveTableData(selectedShop, rows);
      if (response.success) {
        setSnackbar({ open: true, message: 'डेटा सेव्ह झाला!', severity: 'success' });
      } else {
        throw new Error(response.error || 'सेव्ह करताना त्रुटी आली');
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        p: 2,
        borderRadius: 2,
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            {translations.customers.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {selectedShop ? `${toMarathiName(selectedShop)} - ग्राहक व्यवस्थापन` : 'कृपया दुकान निवडा'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{translations.common.selectShop}</InputLabel>
            <Select
              value={selectedShop}
              onChange={handleShopChange}
              label={translations.common.selectShop}
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="">{translations.common.selectShop}</MenuItem>
              {shops.map((shop) => (
                <MenuItem key={shop.id} value={shop.name}>
                  {toMarathiName(shop.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
            disabled={loading || !selectedShop}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {translations.customers.addCustomer}
          </Button>
        </Box>
      </Box>

      {/* Search and Actions Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="ग्राहक शोधा..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="प्रिंट करा">
          <IconButton 
            onClick={handlePrint}
            disabled={!selectedShop || rows.length === 0}
            sx={{ 
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <PrintIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="रिफ्रेश करा">
          <IconButton 
            onClick={() => fetchTableData(selectedShop)}
            disabled={!selectedShop}
            sx={{ 
              color: theme.palette.info.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.info.main, 0.1),
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Customers Grid */}
      <Card elevation={3}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : !selectedShop ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <Typography variant="h6" color="textSecondary">
                {translations.common.pleaseSelectShop}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto', width: '100%' }}>
              <Table sx={{ minWidth: 1800 }}>
                <TableHead>
                  <TableRow>
                    {headings.map((heading, idx) => (
                      <TableCell key={idx} align="center" sx={{ fontWeight: 'bold' }}>{heading}</TableCell>
                    ))}
                    <TableCell align="center">क्रिया</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell align="center">
                        <TextField
                          value={row.accountNo}
                          onChange={e => handleCellChange(idx, 'accountNo', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          value={row.pavtiNo}
                          onChange={e => handleCellChange(idx, 'pavtiNo', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="date"
                          value={row.date}
                          onChange={e => handleCellChange(idx, 'date', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                        <TextField
                          value={row.name}
                          onChange={e => handleCellChange(idx, 'name', e.target.value)}
                          variant="standard"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                        <TextField
                          value={row.item}
                          onChange={e => handleCellChange(idx, 'item', e.target.value)}
                          variant="standard"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          value={row.goldRate}
                          onChange={e => handleCellChange(idx, 'goldRate', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="date"
                          value={row.sodDate}
                          onChange={e => handleCellChange(idx, 'sodDate', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          value={row.divas}
                          onChange={e => handleCellChange(idx, 'divas', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          value={row.moparu}
                          onChange={e => handleCellChange(idx, 'moparu', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          value={row.vayaj}
                          onChange={e => handleCellChange(idx, 'vayaj', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                        <TextField
                          value={row.address}
                          onChange={e => handleCellChange(idx, 'address', e.target.value)}
                          variant="standard"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          value={row.signature}
                          onChange={e => handleCellChange(idx, 'signature', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="error" onClick={() => handleDeleteRow(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PersonIcon />
          {formData.id ? translations.common.edit : translations.customers.addCustomer}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MarathiTransliterator
                label={translations.customers.name}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={translations.customers.phone}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.1),
              }
            }}
          >
            {translations.common.cancel}
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {translations.common.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRow} disabled={!selectedShop}>नवीन पंक्ति जोडा</Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!selectedShop || loading}>सेव्ह करा</Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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