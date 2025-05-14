import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAllShops, getTableData } from '../firebase/services';
import { toMarathiName, formatMarathiCurrency, formatMarathiDate } from '../utils/translations';

function Loans() {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Table headings as per your image
  const headings = [
    'तारीख', 'जमा तपशील', 'खाते पान', 'रक्कम', '', '', 'तारीख', 'नावेचा तपशील', 'खाते पान', 'रक्कम', '', '',
  ];

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchTableData(selectedShop);
    } else {
      setTableData([]);
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
      if (response.success && response.data) {
        // Convert to array and sort by date if needed
        const dataArray = Object.entries(response.data).map(([id, data]) => ({ id, ...data }));
        setTableData(dataArray);
      } else {
        setTableData([]);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'डेटा मिळवताना त्रुटी आली', severity: 'error' });
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handlePrint = () => {
    const printContent = document.getElementById('loans-table');
    const originalContents = document.body.innerHTML;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>कॅश बुक - ${selectedShop}</title>
          <style>
            @page {
              size: landscape;
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f0f0f0;
            }
            .shop-name {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .column-labels {
              display: flex;
              margin-bottom: 10px;
            }
            .jama-section, .kharch-section {
              width: 50%;
              text-align: center;
              font-size: 16px;
              font-weight: bold;
            }
            .jama-section {
              padding-right: 25%;
            }
            .kharch-section {
              padding-left: 25%;
            }
          </style>
        </head>
        <body>
          <div class="shop-name">${selectedShop}</div>
          <div class="column-labels">
            <div class="jama-section">जमा</div>
            <div class="kharch-section">खर्च</div>
          </div>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleRefresh = () => {
    if (selectedShop) {
      fetchTableData(selectedShop);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">कॅश बुक</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={!selectedShop || loading}
          >
            रिफ्रेश
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!selectedShop || loading || tableData.length === 0}
          >
            प्रिंट
          </Button>
        </Stack>
      </Stack>
      <FormControl sx={{ minWidth: 250, mb: 3 }}>
        <InputLabel>दुकान निवडा</InputLabel>
        <Select
          value={selectedShop}
          label="दुकान निवडा"
          onChange={e => setSelectedShop(e.target.value)}
        >
          <MenuItem value="">दुकान निवडा</MenuItem>
          {shops.map(shop => (
            <MenuItem key={shop.id} value={shop.name}>{shop.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', width: '100%' }}>
          <Table id="loans-table" sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                {headings.map((heading, idx) => (
                  <TableCell key={idx} align="center" sx={{ fontWeight: 'bold' }}>{heading}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headings.length} align="center">डेटा उपलब्ध नाही</TableCell>
                </TableRow>
              ) : (
                tableData.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell align="center">{row.date ? formatMarathiDate(row.date) : ''}</TableCell>
                    <TableCell align="center">{row.customerName || ''}</TableCell>
                    <TableCell align="center">{row.accountNumber || ''}</TableCell>
                    <TableCell align="center">{row.goldRate ? formatMarathiCurrency(row.goldRate) : ''}</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center">{row.expenseDate ? formatMarathiDate(row.expenseDate) : ''}</TableCell>
                    <TableCell align="center">{row.expenseDetails || ''}</TableCell>
                    <TableCell align="center">{row.expenseAccountNumber || ''}</TableCell>
                    <TableCell align="center">{row.expenseAmount ? formatMarathiCurrency(row.expenseAmount) : ''}</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Loans; 