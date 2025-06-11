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
import { addCustomer,  updateCustomer, deleteCustomer,  getAllShops, saveTableData, getTableData, getShopSettings } from '../firebase/services';
import { translations, toMarathiName } from '../utils/translations';
import MarathiTransliterator from '../components/MarathiTransliterator';

function Customers() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
  const [settings, setSettings] = useState({
    interestRate: 2.5, // Default interest rate
  });

  function toMarathiNumber(num) {
    return String(num).replace(/\d/g, d => '०१२३४५६७८९'[d]);
  }

  function toMarathiDate(dateStr) {
    if (!dateStr) return '';
    // Expecting dateStr in 'yyyy-mm-dd'
    const [yyyy, mm, dd] = dateStr.split('-');
    const formatted = [dd, mm, yyyy].join('/');
    return formatted.replace(/\d/g, d => '०१२३४५६७८९'[d]);
  }

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
      fetchTableData(selectedShop, selectedMonth);
    } else {
      setRows([{ ...emptyRow }]);
    }
  }, [selectedShop, selectedMonth]);

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

  const fetchTableData = async (shopName, month = selectedMonth) => {
    setLoading(true);
    try {
      const response = await getTableData(shopName, month); // Pass month
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
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toMarathiNumber(idx + 1)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.accountNo || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.pavtiNo || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toMarathiDate(row.date)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.name || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.item || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${row.goldRate || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toMarathiDate(row.sodDate)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">  ${toMarathiNumber(row.divas || '')}</td>
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

  const calculateInterest = (amount, days) => {
    // Convert to numbers, removing any non-numeric characters
    const principal = parseFloat(String(amount).replace(/[^\d.]/g, ''));
    const daysNum = parseInt(String(days).replace(/[^\d]/g, ''));
    const interestRate = parseFloat(settings.interestRate) || 2.5;

    if (isNaN(principal) || isNaN(daysNum) || isNaN(interestRate)) {
      return '०';
    }

    // Calculate interest: (Principal * Rate * Days) / (100 * 365)
    const interest = (principal * interestRate * daysNum) / (100 * 365);
    
    // Format the interest to 2 decimal places and convert to Marathi numerals
    return toMarathiNumber(interest.toFixed(2));
  };

  const handleCellChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;

    // Calculate days if either date changes
    if (field === 'date' || field === 'sodDate') {
      const loanDate = updatedRows[index].date;
      const returnDate = updatedRows[index].sodDate;

      if (loanDate && returnDate) {
        const start = new Date(loanDate);
        const end = new Date(returnDate);
        
        // Calculate difference in days
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Update the days field
        updatedRows[index].divas = diffDays.toString();
        
        // Recalculate interest when days change
        if (updatedRows[index].goldRate) {
          const interest = calculateInterest(updatedRows[index].goldRate, diffDays);
          updatedRows[index].vayaj = interest;
        }
      }
    }

    // Calculate interest when amount changes
    if (field === 'goldRate') {
      const days = updatedRows[index].divas || '0';
      const interest = calculateInterest(value, days);
      updatedRows[index].vayaj = interest;
    }

    // Calculate interest when days change
    if (field === 'divas') {
      const amount = updatedRows[index].goldRate || '0';
      const interest = calculateInterest(amount, value);
      updatedRows[index].vayaj = interest;
    }

    // When date is entered, ensure it's treated as a jama entry
    if (field === 'date' && value) {
      updatedRows[index].isJama = true;
    }

    // When sodDate is entered, ensure it's treated as a sod entry
    if (field === 'sodDate' && value) {
      updatedRows[index].isSod = true;
    }

    setRows(updatedRows);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      if (selectedShop) {
        try {
          const response = await getShopSettings(selectedShop);
          if (response.success && response.data) {
            setSettings(response.data);
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }
      }
    };

    fetchSettings();
  }, [selectedShop]);

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
      // Filter out undefined/null/empty rows
      const validRows = rows.filter(
        row => row && (row.date || row.sodDate) // Only rows with at least one date
      );

      // Save all rows for the selected month
      const response = await saveTableData(selectedShop, selectedMonth, validRows);
      if (!response.success) {
        throw new Error(response.error || 'सेव्ह करताना त्रुटी आली');
      }

      setSnackbar({ open: true, message: 'डेटा सेव्ह झाला!', severity: 'success' });
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

        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="महिना निवडा"
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            size="small"
            sx={{ width: 200 }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
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
          <span>
            <IconButton 
              onClick={handlePrint}
              disabled={!selectedShop || rows.length === 0}
              sx={{ color: theme.palette.primary.main, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
            >
              <PrintIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="रिफ्रेश करा">
          <span>
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
          </span>
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
                  {rows.map((row, idx) => {
                    if (!row) return null; // Skip undefined/null rows
                    return (
                      <TableRow key={idx}>
                        <TableCell align="center">{toMarathiNumber(idx + 1)}</TableCell>
                        <TableCell align="center">
                          <TextField
                            value={row.accountNo || ''}
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
                          <div style={{ fontSize: '0.85em', color: '#888' }}>
                            {toMarathiDate(row.date)}
                          </div>
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                          <TextField
                            value={row.name}
                            onChange={e => handleCellChange(idx, 'name', e.target.value)}
                            variant="standard"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">श्री</InputAdornment>,
                            }}
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
                          <div style={{ fontSize: '0.85em', color: '#888' }}>
                            {toMarathiDate(row.sodDate)}
                          </div>
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
                    );
                  })}
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