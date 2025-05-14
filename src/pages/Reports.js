import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { getAllShops, getCustomers, getLoans, getRepayments, getShopSettings } from '../firebase/services';
import { translations, toMarathiName, formatMarathiDate, formatMarathiCurrency, toMarathiNumber } from '../utils/translations';

function Reports() {
  const printRef = useRef();
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState([]);
  const [reportData, setReportData] = useState({
    customerData: {
      customerLoans: [],
    },
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error',
  });
  const [shopSettings, setShopSettings] = useState({
    interestRate: 2.5,
  });

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
          fetchCustomerData(savedShop);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async (shopName) => {
    try {
      setLoading(true);
      const [customersResponse, loansResponse, settingsResponse] = await Promise.all([
        getCustomers(shopName),
        getLoans(shopName),
        getShopSettings(shopName)
      ]);

      if (customersResponse.success && loansResponse.success && settingsResponse.success) {
        const customersArray = Object.entries(customersResponse.data || {}).map(([id, data]) => ({
          id,
          ...data,
        }));

        const loansArray = Object.entries(loansResponse.data || {}).map(([id, data]) => {
          const customer = customersArray.find(c => c.id === data.customerId);
          return {
            id,
            ...data,
            customerName: data.customerName || customer?.name || 'Unknown Customer',
            phone: customer?.phone || '-'
          };
        });

        // Fetch repayments for each loan
        const loansWithRepayments = await Promise.all(
          loansArray.map(async (loan) => {
            const repaymentsResponse = await getRepayments(shopName, loan.id);
            const repayments = repaymentsResponse.success ? 
              Object.entries(repaymentsResponse.data || {}).map(([id, data]) => ({ id, ...data })) : [];
            
            return {
              ...loan,
              repayments,
              totalPaid: calculateTotalPaid(repayments),
              remainingBalance: calculateRemainingBalance(loan, repayments),
              interest: calculateInterest(loan, repayments)
            };
          })
        );

        setShopSettings(settingsResponse.data || { interestRate: 2.5 });
        setReportData({
          customerData: {
            customerLoans: loansWithRepayments
          }
        });
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate total paid amount
  const calculateTotalPaid = (repayments) => {
    return repayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  };

  // Function to calculate remaining balance
  const calculateRemainingBalance = (loan, repayments) => {
    const totalPaid = calculateTotalPaid(repayments);
    const principal = parseFloat(loan.loanAmount || 0);
    const interest = calculateInterest(loan, repayments);
    return principal + interest - totalPaid;
  };

  // Function to calculate interest
  const calculateInterest = (loan, repayments) => {
    const principal = parseFloat(loan.loanAmount || 0);
    const interestRate = parseFloat(shopSettings.interestRate || 0) / 100;
    const startDate = new Date(loan.startDate);
    const endDate = new Date();
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    
    return principal * interestRate * (monthsDiff / 12);
  };

  const handleShopChange = async (event) => {
    const shopName = event.target.value;
    setSelectedShop(shopName);
    localStorage.setItem('currentShop', shopName);
    if (shopName) {
      await fetchCustomerData(shopName);
    } else {
      setReportData({
        customerData: {
          customerLoans: []
        }
      });
    }
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Calculate summary row for customer report
  const customerLoans = reportData.customerData.customerLoans;
  const totalLoanAmount = customerLoans.reduce((sum, c) => sum + (parseFloat(c.loanAmount) || 0), 0);
  const totalPaidAmount = customerLoans.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const totalRemainingAmount = customerLoans.reduce((sum, c) => sum + (c.remainingBalance || 0), 0);
  const totalInterest = customerLoans.reduce((sum, c) => sum + (c.interest || 0), 0);
  const totalCustomers = customerLoans.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Shop Selection */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>{translations.common.selectShop}</InputLabel>
          <Select
            value={selectedShop}
            onChange={handleShopChange}
            label={translations.common.selectShop}
          >
            {shops.map((shop) => (
              <MenuItem key={shop.id} value={shop.name}>
                {shop.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!selectedShop ? (
        <Typography variant="h6" align="center" color="textSecondary">
          {translations.common.pleaseSelectShop}
        </Typography>
      ) : (
        <>
          {/* Customer Report Table (Printable) */}
          <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handlePrint}>प्रिंट करा</Button>
          </Box>
          <Box ref={printRef} sx={{ background: '#fff', p: 2, mb: 4 }}>
            <Typography variant="h6" align="center" gutterBottom>
              {selectedShop} - ग्राहक अहवाल
            </Typography>
            <TableContainer sx={{ border: '1px solid #000', maxWidth: '100%', '@media print': { boxShadow: 'none', border: '1px solid #000' } }}>
              <Table size="small" sx={{ minWidth: 900, border: '1px solid #000', '@media print': { border: '1px solid #000' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ border: '1px solid #000' }}>अ.क्र.</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>नाव</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>फोन</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>कर्ज रक्कम</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>एकूण परतफेड</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>बाकी रक्कम</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>एकूण व्याज</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>व्याज दर (%)</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>कर्ज सुरुवात</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>कर्ज समाप्ती</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>सोने वजन (ग्राम)</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>सोने शुद्धता</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>स्थिती</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerLoans.map((customer, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ border: '1px solid #000' }}>{toMarathiNumber(idx + 1)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{toMarathiName(customer.customerName)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{toMarathiName(customer.phone)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{formatMarathiCurrency(customer.loanAmount)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{formatMarathiCurrency(customer.totalPaid)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{formatMarathiCurrency(customer.remainingBalance)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{formatMarathiCurrency(customer.interest)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{toMarathiNumber(customer.interestRate || shopSettings.interestRate)}%</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{customer.startDate ? formatMarathiDate(customer.startDate) : '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{customer.endDate ? formatMarathiDate(customer.endDate) : '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{customer.goldWeight ? toMarathiNumber(customer.goldWeight) : '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{customer.goldPurity || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }}>{customer.status === 'closed' ? 'बंद' : 'चालू'}</TableCell>
                    </TableRow>
                  ))}
                  {/* Summary Row */}
                  <TableRow>
                    <TableCell sx={{ border: '1px solid #000' }} colSpan={3}><b>एकूण</b></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}><b>{formatMarathiCurrency(totalLoanAmount)}</b></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}><b>{formatMarathiCurrency(totalPaidAmount)}</b></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}><b>{formatMarathiCurrency(totalRemainingAmount)}</b></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}><b>{formatMarathiCurrency(totalInterest)}</b></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }} colSpan={5}><b>एकूण ग्राहक: {toMarathiNumber(totalCustomers)}</b></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Reports;
