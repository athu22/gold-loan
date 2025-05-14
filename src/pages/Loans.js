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
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  useTheme,
  alpha,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { addLoan, getLoans, getCustomers, getAllShops, updateLoan, addRepayment, getRepayments, getShopSettings } from '../firebase/services';
import { translations, toMarathiName, formatMarathiCurrency, formatMarathiDate } from '../utils/translations';

function Loans() {
  const theme = useTheme();
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
    goldValue: '',
    startMonth: '',
    startDate: '',
    endDate: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [repaymentOpen, setRepaymentOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [repaymentForm, setRepaymentForm] = useState({
    amount: '',
    date: '',
    notes: '',
  });
  const [shopSettings, setShopSettings] = useState({
    interestRate: 2.5,
    goldRate: 6000,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Add gold price constants
  const GOLD_PRICES = {
    '24K': 6500, // Price per gram for 24K gold
    '22K': 5958, // Price per gram for 22K gold
    '18K': 4875, // Price per gram for 18K gold
  };

  // Function to calculate gold value
  const calculateGoldValue = (weight, purity) => {
    if (!weight || !purity) return '';
    const pricePerGram = GOLD_PRICES[purity];
    return (weight * pricePerGram).toFixed(2);
  };

  // Function to get current month in Marathi
  const getCurrentMonth = () => {
    const months = [
      'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
      'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
    ];
    return months[new Date().getMonth()];
  };

  // Function to format date to YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Function to calculate end date based on start date and duration
  const calculateEndDate = (startDate, duration) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(duration));
    return formatDate(date);
  };

  const columns = [
    { 
      field: 'customerName', 
      headerName: translations.loans.customerName, 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography>{toMarathiName(params.row.customerName)}</Typography>
        </Box>
      )
    },
    { 
      field: 'goldWeight', 
      headerName: translations.loans.goldWeight, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AttachMoneyIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
          <Typography>{toMarathiName(params.row.goldWeight)} ग्राम</Typography>
        </Box>
      )
    },
    { 
      field: 'goldPurity', 
      headerName: translations.loans.goldPurity, 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={toMarathiName(params.row.goldPurity)}
          size="small"
          sx={{ 
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.dark,
          }}
        />
      )
    },
    { 
      field: 'loanAmount', 
      headerName: translations.loans.loanAmount, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalanceIcon sx={{ mr: 1, color: theme.palette.success.main }} />
          <Typography>{formatMarathiCurrency(params.row.loanAmount)}</Typography>
        </Box>
      )
    },
    { 
      field: 'interestRate', 
      headerName: translations.loans.interestRate, 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={`${toMarathiName(params.row.interestRate)}%`}
          size="small"
          sx={{ 
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            color: theme.palette.info.dark,
          }}
        />
      )
    },
    { 
      field: 'totalPaid',
      headerName: 'एकूण परतफेड',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PaymentIcon sx={{ mr: 1, color: theme.palette.success.main }} />
          <Typography>{formatMarathiCurrency(params.row.totalPaid || 0)}</Typography>
        </Box>
      )
    },
    { 
      field: 'remainingDue',
      headerName: 'बाकी रक्कम',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ mr: 1, color: theme.palette.error.main }} />
          <Typography>{formatMarathiCurrency(params.row.remainingDue || 0)}</Typography>
        </Box>
      )
    },
    { 
      field: 'interest',
      headerName: 'एकूण व्याज',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon sx={{ mr: 1, color: theme.palette.info.main }} />
          <Typography>{formatMarathiCurrency(params.row.interest || 0)}</Typography>
        </Box>
      )
    },
    { 
      field: 'goldReturned',
      headerName: 'सोने परत',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.row.goldReturned ? 'होय' : 'नाही'}
          size="small"
          color={params.row.goldReturned ? 'success' : 'error'}
          sx={{ 
            backgroundColor: params.row.goldReturned 
              ? alpha(theme.palette.success.main, 0.1)
              : alpha(theme.palette.error.main, 0.1),
          }}
        />
      )
    },
    { 
      field: 'startDate', 
      headerName: translations.loans.startDate, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography>{formatMarathiDate(params.row.startDate)}</Typography>
        </Box>
      )
    },
    { 
      field: 'endDate', 
      headerName: translations.loans.endDate, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography>{formatMarathiDate(params.row.endDate)}</Typography>
        </Box>
      )
    },
    { 
      field: 'status', 
      headerName: translations.loans.status, 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={toMarathiName(params.row.status)}
          size="small"
          color={params.row.status === 'active' ? 'success' : 'error'}
          sx={{ 
            backgroundColor: params.row.status === 'active'
              ? alpha(theme.palette.success.main, 0.1)
              : alpha(theme.palette.error.main, 0.1),
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'क्रिया',
      width: 250,
      renderCell: (params) => (
        <Box>
          <Tooltip title="परतफेड जोडा">
            <span>
              <IconButton
                size="small"
                onClick={() => handleAddRepayment(params.row)}
                disabled={params.row.status === 'closed' || params.row.goldReturned}
                sx={{ 
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <PaymentIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="सोने परत द्या">
            <span>
              <IconButton
                size="small"
                onClick={() => handleReturnGold(params.row)}
                disabled={params.row.status === 'closed' || params.row.goldReturned}
                sx={{ 
                  color: theme.palette.success.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  }
                }}
              >
                <CheckCircleIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={translations.common.edit}>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{ 
                color: theme.palette.info.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
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
      const [customersResponse, loansResponse, settingsResponse] = await Promise.all([
        getCustomers(shopName),
        getLoans(shopName),
        getShopSettings(shopName)
      ]);

      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      }

      let loansArray = [];
      if (loansResponse.success) {
        const rawLoans = Object.entries(loansResponse.data || {}).map(([id, data]) => ({
          id,
          ...data,
          customerName: data.customerName || customers.find(c => c.id === data.customerId)?.name || 'Unknown Customer'
        }));
        // For each loan, fetch repayments and calculate totals
        loansArray = await Promise.all(rawLoans.map(async (loan) => {
          const repaymentsResponse = await getRepayments(shopName, loan.id);
          const repayments = repaymentsResponse.success ? Object.entries(repaymentsResponse.data || {}).map(([id, data]) => ({ id, ...data })) : [];
          const totalPaid = repayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
          const principal = parseFloat(loan.loanAmount || 0);
          const interestRate = parseFloat(settingsResponse.data?.interestRate || shopSettings.interestRate || 0) / 100;
          const startDate = new Date(loan.startDate);
          const endDate = new Date();
          const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
          const interest = principal * interestRate * (monthsDiff / 12);
          const remainingDue = principal + interest - totalPaid;
          return {
            ...loan,
            totalPaid,
            remainingDue,
            interest,
            goldReturned: loan.goldReturned || false,
          };
        }));
        setLoans(loansArray);
      }

      if (settingsResponse.success && settingsResponse.data) {
        setShopSettings(settingsResponse.data);
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
    const today = formatDate(new Date());
    setFormData({
      customerId: '',
      customerName: '',
      goldWeight: '',
      goldPurity: '24K',
      loanAmount: '',
      interestRate: '2.5',
      duration: '3',
      goldValue: '',
      startMonth: getCurrentMonth(),
      startDate: today,
      endDate: calculateEndDate(today, '3'),
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Calculate gold value when weight or purity changes
      if (name === 'goldWeight' || name === 'goldPurity') {
        newData.goldValue = calculateGoldValue(
          name === 'goldWeight' ? value : prev.goldWeight,
          name === 'goldPurity' ? value : prev.goldPurity
        );
      }

      // Calculate end date when start date or duration changes
      if (name === 'startDate' || name === 'duration') {
        const startDate = name === 'startDate' ? value : prev.startDate;
        const duration = name === 'duration' ? value : prev.duration;
        if (startDate && duration) {
          newData.endDate = calculateEndDate(startDate, duration);
        }
      }
      
      return newData;
    });
  };

  const handleCustomerSelect = (event) => {
    const customerId = event.target.value;
    const selectedCustomer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customerId,
      customerName: selectedCustomer ? toMarathiName(selectedCustomer.name) : ''
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

  const handleAddRepayment = async (loan) => {
    setSelectedLoan(loan);
    const repaymentsResponse = await getRepayments(selectedShop, loan.id);
    if (repaymentsResponse.success) {
      const repaymentsArray = Object.entries(repaymentsResponse.data || {}).map(([id, data]) => ({
        id,
        ...data
      }));
      setRepayments(repaymentsArray);
    }
    setRepaymentForm({
      amount: '',
      date: formatDate(new Date()),
      notes: '',
    });
    setRepaymentOpen(true);
  };

  const handleReturnGold = async (loan) => {
    if (window.confirm('सोने परत देण्याची खात्री आहे?')) {
      try {
        setLoading(true);
        const response = await updateLoan(selectedShop, loan.id, { 
          status: 'closed',
          goldReturned: true,
          goldReturnDate: new Date().toISOString()
        });
        if (response.success) {
          setSnackbar({
            open: true,
            message: 'सोने यशस्वीरित्या परत दिले',
            severity: 'success',
          });
          fetchData(selectedShop);
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error returning gold:', error);
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

  const handleRepaymentSubmit = async () => {
    try {
      setLoading(true);
      const response = await addRepayment(selectedShop, selectedLoan.id, repaymentForm);
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'परतफेड यशस्वीरित्या जोडली',
          severity: 'success',
        });
        setRepaymentOpen(false);
        // Refresh repayments and loans
        await fetchData(selectedShop);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error adding repayment:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px;">${toMarathiName(selectedShop)} - कर्ज यादी</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; border: 1px solid #ddd;">ग्राहक</th>
              <th style="padding: 8px; border: 1px solid #ddd;">सोने वजन</th>
              <th style="padding: 8px; border: 1px solid #ddd;">सोने शुद्धता</th>
              <th style="padding: 8px; border: 1px solid #ddd;">कर्ज रक्कम</th>
              <th style="padding: 8px; border: 1px solid #ddd;">व्याज दर</th>
              <th style="padding: 8px; border: 1px solid #ddd;">एकूण परतफेड</th>
              <th style="padding: 8px; border: 1px solid #ddd;">बाकी रक्कम</th>
              <th style="padding: 8px; border: 1px solid #ddd;">स्थिती</th>
            </tr>
          </thead>
          <tbody>
            ${loans.map(loan => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${toMarathiName(loan.customerName)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${toMarathiName(loan.goldWeight)} ग्राम</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${toMarathiName(loan.goldPurity)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formatMarathiCurrency(loan.loanAmount)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${toMarathiName(loan.interestRate)}%</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formatMarathiCurrency(loan.totalPaid || 0)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formatMarathiCurrency(loan.remainingDue || 0)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${toMarathiName(loan.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right;">
          <p>प्रिंट तारीख: ${formatMarathiDate(new Date().toISOString())}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${toMarathiName(selectedShop)} - कर्ज यादी</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; }
              th { background-color: #f5f5f5; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
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
            {translations.loans.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {selectedShop ? `${toMarathiName(selectedShop)} - कर्ज व्यवस्थापन` : 'कृपया दुकान निवडा'}
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
            {translations.loans.addLoan}
          </Button>
        </Box>
      </Box>

      {/* Search and Actions Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="कर्ज शोधा..."
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
            disabled={!selectedShop || loans.length === 0}
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
            onClick={() => fetchData(selectedShop)}
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

      {/* Loans Grid */}
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
            <DataGrid
              rows={loans}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              checkboxSelection
              disableSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Loan Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AccountBalanceIcon />
          {formData.id ? translations.common.edit : translations.loans.addLoan}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{translations.loans.customerName}</InputLabel>
                <Select
                  value={formData.customerId}
                  onChange={handleCustomerSelect}
                  label={translations.loans.customerName}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  }
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {toMarathiName(customer.name)}
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
                type="number"
                inputProps={{ step: "0.01" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">ग्राम</InputAdornment>
                }}
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
                  startAdornment={
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  }
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
                label="सोन्याची किंमत"
                value={formData.goldValue ? `₹${formData.goldValue}` : ''}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="सुरुवातीचा महिना"
                value={formData.startMonth}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="सुरुवातीची तारीख"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="मुदत"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon />
                    </InputAdornment>
                  ),
                  inputProps: { min: 1, max: 12 },
                  endAdornment: <InputAdornment position="end">महिने</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="समाप्ती तारीख"
                value={formData.endDate}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={translations.loans.loanAmount}
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceIcon />
                    </InputAdornment>
                  ),
                }}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TrendingUpIcon />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
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

      {/* Repayment Dialog */}
      <Dialog 
        open={repaymentOpen} 
        onClose={() => setRepaymentOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PaymentIcon />
          परतफेड जोडा
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedLoan && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ mb: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      {toMarathiName(selectedLoan.customerName)}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="textSecondary">
                          कर्ज रक्कम
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatMarathiCurrency(selectedLoan.loanAmount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="textSecondary">
                          एकूण परतफेड
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {formatMarathiCurrency(selectedLoan.totalPaid || 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="textSecondary">
                          बाकी रक्कम
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {formatMarathiCurrency(selectedLoan.remainingDue || 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="textSecondary">
                          एकूण व्याज
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          {formatMarathiCurrency(selectedLoan.interest || 0)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="रक्कम"
                  type="number"
                  value={repaymentForm.amount}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PaymentIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="तारीख"
                  type="date"
                  value={repaymentForm.date}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, date: e.target.value })}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScheduleIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="नोट्स"
                  multiline
                  rows={2}
                  value={repaymentForm.notes}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, notes: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EditIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon color="primary" />
                  मागील परतफेड
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>तारीख</TableCell>
                        <TableCell>रक्कम</TableCell>
                        <TableCell>नोट्स</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {repayments.map((repayment) => (
                        <TableRow 
                          key={repayment.id}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <TableCell>{formatMarathiDate(repayment.date)}</TableCell>
                          <TableCell>{formatMarathiCurrency(repayment.amount)}</TableCell>
                          <TableCell>{repayment.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setRepaymentOpen(false)}
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
            onClick={handleRepaymentSubmit} 
            variant="contained"
            disabled={!repaymentForm.amount || !repaymentForm.date}
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

export default Loans; 