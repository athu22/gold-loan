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
  TextField,
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

  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month in YYYY-MM format
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Table headings as per your image
  const headings = [
    'तारीख', 'जमा तपशील', 'खाते पान', 'रक्कम', 'व्याज', '', 'तारीख', 'नावेचा तपशील', 'खाते पान', 'रक्कम', '', '',
  ];

  useEffect(() => {
    fetchShops();
  }, []);

useEffect(() => {
  if (selectedShop && selectedMonth) {
    fetchTableData(selectedShop, selectedMonth);
  } else {
    setTableData([]);
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
const fetchTableData = async (shopName, month) => {
  setLoading(true);
  try {
    // Parse selected month
    const [year, monthNum] = month.split('-').map(Number);

    // Calculate previous month (handle January)
    let prevYear = year;
    let prevMonth = monthNum - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    // Fetch current and previous month data
    const [currRes, prevRes] = await Promise.all([
      getTableData(shopName, month),
      getTableData(shopName, prevMonthStr),
    ]);

    // Combine rows: all from current, plus from previous where sodDate is in selected month
    let combined = Array.isArray(currRes.data) ? currRes.data : [];
    if (Array.isArray(prevRes.data)) {
      const [selYear, selMonth] = month.split('-').map(Number);
      const prevMonthSodRows = prevRes.data.filter(row => {
        if (!row || !row.sodDate) return false;
        const d = new Date(row.sodDate);
        return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
      });
      combined = [...combined, ...prevMonthSodRows];
    }

    setTableData(combined);
  } catch (error) {
    console.error('Error fetching table data:', error);
    setSnackbar({ open: true, message: 'डेटा मिळवताना त्रुटी आली', severity: 'error' });
    setTableData([]);
  } finally {
    setLoading(false);
  }
};
const filteredTableData = React.useMemo(() => {
  const [year, month] = selectedMonth.split('-').map(Number);

  return tableData.filter(row => {
    if (!row) return false;

    // Include if date is in selected month
    if (row.date) {
      const d = new Date(row.date);
      if (d.getFullYear() === year && (d.getMonth() + 1) === month) {
        return true;
      }
    }
    // Include if sodDate is in selected month
    if (row.sodDate) {
      const d = new Date(row.sodDate);
      if (d.getFullYear() === year && (d.getMonth() + 1) === month) {
        return true;
      }
    }
    return false;
  });
}, [tableData, selectedMonth]);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

const handlePrint = () => {
  const printContent = document.getElementById('loans-table');
  const originalContents = document.body.innerHTML;

  // Marathi sentence to show
  const marathiSentence = 'महाराष्ट्र सावकारी (नियमाना) अधिनियम २०१४ नमुना ६ नियम १८ पहा.';

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>कॅश बुक - ${selectedShop}</title>
        <style>
          @page {
            size: landscape;
            margin: 15mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 16px;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 12px;
            text-align: center;
            font-size: 15px;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .shop-name {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 0px;
            text-transform: uppercase;
          }
          .marathi-sentence {
            text-align: left;
            font-size: 16px;
            font-weight: normal;
            margin-bottom: 10px;
            margin-top: 0px;
          }
          .column-labels {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .jama-section, .kharch-section {
            width: 50%;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
          }
          .jama-section {
            padding-right: 25%;
          }
          .kharch-section {
            padding-left: 25%;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
              
          }
        </style>
      </head>
      <body>
        <div class="shop-name">${selectedShop}</div>
        <div class="marathi-sentence">${marathiSentence}</div>
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

  printWindow.onload = function() {
    printWindow.print();
    printWindow.close();
  };
};



const groupedRows = React.useMemo(() => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const dateSet = new Set();

  // Collect all unique dates from both date and sodDate fields in the selected month
  filteredTableData.forEach(row => {
    if (row.date) {
      const d = new Date(row.date);
      if (d.getFullYear() === year && (d.getMonth() + 1) === month) {
        dateSet.add(row.date);
      }
    }
    if (row.sodDate) {
      const d = new Date(row.sodDate);
      if (d.getFullYear() === year && (d.getMonth() + 1) === month) {
        dateSet.add(row.sodDate);
      }
    }
  });

  // For each unique date, find the matching jama and sod rows
  return Array.from(dateSet)
    .sort((a, b) => new Date(a) - new Date(b))
    .map(date => {
      const jama = filteredTableData.find(row => row.sodDate === date) || null;
      const sod = filteredTableData.find(row => row.date === date) || null;
      return { date, jama, sod };
    });
}, [filteredTableData, selectedMonth]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">कॅश बुक</Typography>
        <Stack direction="row" spacing={2}>
          {/* <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={!selectedShop || loading}
          >
            रिफ्रेश
          </Button> */}
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
  {groupedRows.length === 0 ? (
    <TableRow>
      <TableCell colSpan={headings.length} align="center">डेटा उपलब्ध नाही</TableCell>
    </TableRow>
  ) : (
    groupedRows.map((row, idx) => (
      <React.Fragment key={idx}>
        <TableRow>
          {/* जमा (Jama) section - uses sodDate */}
          <TableCell align="center">{row.jama ? formatMarathiDate(row.jama.sodDate) : ''}</TableCell>
          <TableCell align="center">{row.jama ? `श्री ${row.jama.name} बाकी जमा` : ''}</TableCell>
          <TableCell align="center">{row.jama ? row.jama.accountNo : ''}</TableCell>
          <TableCell align="center">{row.jama ? formatMarathiCurrency(row.jama.goldRate) : ''}</TableCell>
          <TableCell align="center"></TableCell>
          <TableCell align="center"></TableCell>
          {/* नावेचा (Sod) section - uses date */}
          <TableCell align="center">{row.sod ? formatMarathiDate(row.sod.date) : ''}</TableCell>
          <TableCell align="center">{row.sod ? `श्री ${row.sod.name} बाकी नावे` : ''}</TableCell>
          <TableCell align="center">{row.sod ? row.sod.accountNo : ''}</TableCell>
          <TableCell align="center">{row.sod ? formatMarathiCurrency(row.sod.goldRate) : ''}</TableCell>
          <TableCell align="center"></TableCell>
          <TableCell align="center"></TableCell>
        </TableRow>
        {/* व्याज row for जमा तपशील */}
        {row.jama && row.jama.vayaj ? (
          <TableRow>
            <TableCell align="center">{row.jama ? formatMarathiDate(row.jama.sodDate) : ''}</TableCell>
            <TableCell align="center">श्री व्याज खाते जमा</TableCell>
            <TableCell align="center"></TableCell>
            <TableCell align="center"></TableCell>
            <TableCell align="center">{formatMarathiCurrency(row.jama.vayaj)}</TableCell>
            <TableCell align="center"></TableCell>
            {/* Empty cells for नावेचा तपशील side */}
            <TableCell align="center"></TableCell>
            <TableCell align="center"></TableCell>
            <TableCell align="center"></TableCell>
            <TableCell align="center"></TableCell>
            <TableCell align="center"></TableCell>
            <TableCell align="center"></TableCell>
          </TableRow>
        ) : null}
      </React.Fragment>
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