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
// import RefreshIcon from '@mui/icons-material/Refresh';
import { getAllShops, getTableData, getShopSettings } from '../firebase/services';
import {  formatMarathiCurrency, formatMarathiDate } from '../utils/translations';

function Loans() {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [settings, setSettings] = useState({
    balanceAmount: 0
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month in YYYY-MM format
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Table headings as per your image
  const headings = [
    'तारीख', 'जमा तपशील', 'खाते पान', 'रक्कम', 'व्याज', 'तारीख', 'नावेचा तपशील', 'खाते पान', 'रक्कम'
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

useEffect(() => {
  if (selectedShop) {
    const fetchSettings = async () => {
      try {
        const response = await getShopSettings(selectedShop);
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
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

    console.log('Current Month Data:', currRes.data);
    console.log('Previous Month Data:', prevRes.data);

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

    console.log('Combined Data:', combined);
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
          .day-separator {
            border-bottom: 2px solid #000;
          }
          .amount-cell {
            font-weight: bold;
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

// Add this function to convert numbers to Marathi words
function numberToMarathiWords(num) {
  if (!num || isNaN(num)) return '';
  
  const ones = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
    'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस', 'वीस'];
  const tens = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];
  const hundreds = ['', 'शंभर', 'दोनशे', 'तीनशे', 'चारशे', 'पाचशे', 'सहाशे', 'सातशे', 'आठशे', 'नऊशे'];
  const thousands = ['', 'हजार', 'लाख', 'कोटी'];

  if (num === 0) return 'शून्य';

  let words = '';
  let decimal = '';

  // Handle decimal part
  if (num.toString().includes('.')) {
    const parts = num.toString().split('.');
    num = parseInt(parts[0]);
    decimal = parts[1];
  }

  // Convert to words
  if (num >= 10000000) {
    words += numberToMarathiWords(Math.floor(num / 10000000)) + ' कोटी ';
    num %= 10000000;
  }
  if (num >= 100000) {
    words += numberToMarathiWords(Math.floor(num / 100000)) + ' लाख ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += numberToMarathiWords(Math.floor(num / 1000)) + ' हजार ';
    num %= 1000;
  }
  if (num >= 100) {
    words += hundreds[Math.floor(num / 100)] + ' ';
    num %= 100;
  }
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num > 0) {
    words += ones[num] + ' ';
  }

  // Add decimal part if exists
  if (decimal) {
    words += 'दशांश ' + decimal;
  }

  return words.trim();
}

// Add this function at the top with other utility functions
function marathiToNumber(marathiStr) {
  if (!marathiStr) return 0;
  const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
  return parseInt(marathiStr.split('').map(d => marathiDigits.indexOf(d)).join(''));
}

const groupedRows = React.useMemo(() => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const dateSet = new Set();
  let runningBalance = Number(settings.balanceAmount) || 0;
  let sodRunningBalance = Number(settings.balanceAmount) || 0; // Separate balance for नावेचा तपशील

  // Add first day of the month
  const firstDayOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  dateSet.add(firstDayOfMonth);

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
      // Special case for first day of month
      if (date === firstDayOfMonth) {
        return {
          date,
          jama: { sodDate: date, name: 'पुरांत', accountNo: '', goldRate: runningBalance },
          sod: { date: date, name: 'पुरांत', accountNo: '', goldRate: sodRunningBalance }
        };
      }
      const jama = filteredTableData.find(row => row.sodDate === date) || null;
      const sod = filteredTableData.find(row => row.date === date) || null;

      // Update running balance for जमा entries
      if (jama && jama.name !== 'पुरांत') {
        const goldRate = marathiToNumber(jama.goldRate);
        const vayaj = marathiToNumber(jama.vayaj);
        runningBalance += (goldRate + vayaj);
        sodRunningBalance += (goldRate + vayaj);
      }

      // Update running balance for नावे entries
      if (sod && sod.name !== 'पुरांत') {
        const goldRate = marathiToNumber(sod.goldRate);
        sodRunningBalance -= goldRate;
      }

      return { 
        date, 
        jama, 
        sod,
        runningBalance,
        sodRunningBalance // Add separate running balance for नावेचा तपशील
      };
    });
}, [filteredTableData, selectedMonth, settings.balanceAmount]);

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
        <TableContainer 
          component={Paper} 
          sx={{ 
            overflowX: 'auto', 
            width: '100%',
            boxShadow: 3,
            '& .MuiTableCell-root': {
              border: '1px solid rgba(224, 224, 224, 1)',
              padding: '12px 8px',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              fontSize: '1rem',
            }
          }}
        >
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
                      <TableCell align="center">
                        {row.jama ? (
                          row.jama.name === 'पुरांत' ? (
                            'श्री पुरंत बाकी जमा'
                          ) : (
                            <>
                              {(() => {
                                // Convert Marathi numerals to regular numbers
                                const goldRate = marathiToNumber(row.jama.goldRate);
                                const vayaj = marathiToNumber(row.jama.vayaj);
                                const total = goldRate + vayaj;
                                
                                console.log('जमा तपशील:', {
                                  नाव: row.jama.name,
                                  रक्कम: goldRate,
                                  व्याज: vayaj,
                                  एकूण: total,
                                  rawGoldRate: row.jama.goldRate,
                                  rawVayaj: row.jama.vayaj
                                });
                                
                                return (
                                  <>
                                    श्री {row.jama.name} यांचे {numberToMarathiWords(total)} 
                                    {row.jama.item ? ` जमा त्या पोटी ठेवलेले  ${row.jama.item}` : ''}
                              {row.jama.sodDate ? ` सोडवली` : ''}
                                  </>
                                );
                              })()}
                            </>
                          )
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">{row.jama ? row.jama.accountNo : ''}</TableCell>
                      <TableCell align="center" className="amount-cell">{row.jama ? formatMarathiCurrency(row.jama.goldRate) : ''}</TableCell>
                      <TableCell align="center"></TableCell>
                      {/* नावेचा (Sod) section - uses date */}
                      <TableCell align="center">{row.sod ? formatMarathiDate(row.sod.date) : ''}</TableCell>
                      <TableCell align="center">
                        {row.sod ? (
                          row.sod.name === 'पुरांत' ? (
                            'श्री पुरंत बाकी नावे'
                          ) : (
                            <>
                              {(() => {
                                // Convert Marathi numerals to regular numbers
                                const goldRate = marathiToNumber(row.sod.goldRate);
                                
                                console.log('नावे तपशील:', {
                                  नाव: row.sod.name,
                                  रक्कम: goldRate,
                                  rawGoldRate: row.sod.goldRate
                                });
                                
                                return (
                                  <>
                                    श्री {row.sod.name} यांचे {numberToMarathiWords(goldRate)} रुपये 
                              {row.sod.item ? ` मात्र ${row.sod.item} ठेवले.` : ''}
                                  </>
                                );
                              })()}
                            </>
                          )
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">{row.sod ? row.sod.accountNo : ''}</TableCell>
                      <TableCell align="center" className="amount-cell">{row.sod ? formatMarathiCurrency(row.sod.goldRate) : ''}</TableCell>
                    </TableRow>
                    {/* व्याज row for जमा तपशील */}
                    {row.jama && row.jama.vayaj ? (
                      <TableRow>
                        <TableCell align="center">{row.jama ? formatMarathiDate(row.jama.sodDate) : ''}</TableCell>
                        <TableCell align="center">श्री व्याज खाते जमा</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.jama.vayaj)}</TableCell>
                        {/* Empty cells for नावेचा तपशील side */}
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                      </TableRow>
                    ) : null}
                    {/* Add day separator if not the last row */}
                    {idx < groupedRows.length - 1 && (
                      <>
                        <TableRow sx={{ 
                          backgroundColor: '#f8f9fa',
                          '& td': {
                            fontWeight: 'bold',
                            borderBottom: '2px solid #000'
                          }
                        }}>
                          <TableCell align="center">{formatMarathiDate(row.date)}</TableCell>
                          <TableCell align="center">श्री पुरंत बाकी जमा</TableCell>
                          <TableCell align="center"></TableCell>
                          <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.runningBalance)}</TableCell>
                          <TableCell align="center"></TableCell>
                          <TableCell align="center">{formatMarathiDate(row.date)}</TableCell>
                          <TableCell align="center">श्री पुरंत बाकी नावे</TableCell>
                          <TableCell align="center"></TableCell>
                          <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.sodRunningBalance)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={9} sx={{ borderBottom: '2px solid #000', padding: 0 }}></TableCell>
                        </TableRow>
                      </>
                    )}
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