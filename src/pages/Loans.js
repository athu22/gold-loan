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
import { getAllShops, getTableData, getShopSettings, updateClosingBalance, getClosingBalance, saveClosingBalance, getAllCustomerTableRows } from '../firebase/services';
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
  const [initialShopSettings, setInitialShopSettings] = useState({
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
          setInitialShopSettings(response.data);
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
          address: data.address || '',
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
    const [year, monthNum] = month.split('-').map(Number);
    let openingBalance = 0;

    if (monthNum === 4) {
      openingBalance = Number(initialShopSettings.balanceAmount) || 0;
    } else {
      let prevYear = year;
      let prevMonth = monthNum - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }
      const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
      
      const prevMonthRes = await getTableData(shopName, prevMonthStr);
      if (prevMonthRes.success && prevMonthRes.closingAmount) {
        openingBalance = Number(prevMonthRes.closingAmount);
      } else {
        openingBalance = Number(initialShopSettings.balanceAmount) || 0;
      }
    }

    const allRowsRes = await getAllCustomerTableRows(shopName);
    let allRows = Array.isArray(allRowsRes.data) ? allRowsRes.data : [];

    const [selYear, selMonth] = month.split('-').map(Number);
    const filteredRows = allRows.filter(row => {
      if (!row) return false;
      if (row.sodDate) {
        const d = new Date(row.sodDate);
        if (d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth) {
          return true;
        }
      }
      if (row.date) {
        const d = new Date(row.date);
        if (d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth) {
          return true;
        }
      }
      return false;
    });

    setSettings(prev => ({ ...prev, balanceAmount: openingBalance }));
    setTableData(filteredRows);

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

  const selectedShopDetails = shops.find(s => s.name === selectedShop);
  const shopAddress = selectedShopDetails ? selectedShopDetails.address : '';

  // Marathi sentence to show
  const marathiSentence = 'महाराष्ट्र सावकारी (नियमाना) अधिनियम २०१४ नमुना नं-६ व नं-७ नियम १८ पहा.';

  const selectedMonthDisplay = (() => {
  const [year, month] = selectedMonth.split('-');
  // Marathi months
  const marathiMonths = [
    'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
    'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
  ];
  return `${marathiMonths[parseInt(month, 10) - 1]} ${year}`;
})();
  

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>कॅश बुक - ${selectedShop}</title>
        <style>
          @page {
            size: A3 landscape;
            margin: 8mm;
          }
          body {
            font-family: 'Noto Sans Devanagari', 'Courier New', Courier, monospace;
            font-size: 9.5px;
            padding: 0;
            color: #000;
          }
          .print-header {
            position: relative;
            margin-bottom: 10px;
            min-height: 60px; /* Increased for new line */
          }
          .section-headers {
            display: flex;
            width: 100%;
            font-weight: bold;
            text-align: center;
          }
          .section-headers > div {
            padding: 4px;
            font-size: 14px;
          }
          .jama-header {
            flex: 5;
          }
          .kharch-header {
            flex: 4;
          }
          #loans-table-print-wrapper table {
             margin-top: -1px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #000;
            padding: 2px 2px;
            text-align: center;
            font-size: 9.5px;
            word-break: break-word;
            vertical-align: middle;
            overflow: hidden;
          }
          th {
            background: #f5f5f5;
            font-weight: bold;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          .shop-name {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .main-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 2px;
          }
          .marathi-sentence {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 10px;
            font-weight: normal;
            border: 1px solid #000;
            padding: 5px;
          }
          .amount-cell { font-weight: bold; }
          .vayaj-row td { border-bottom: 2px double #000 !important; }
          .purant-sod-row td {
            border-bottom: 2px solid #000 !important;
            font-weight: bold;
            background: #f8f9fa;
          }
          th:nth-child(1), td:nth-child(1) { width: 7%; min-width: 55px; }
          th:nth-child(4), td:nth-child(4) { width: 8%; min-width: 60px; }
          th:nth-child(5), td:nth-child(5) { width: 7%; min-width: 55px; }
          th:nth-child(6), td:nth-child(6) { width: 7%; min-width: 55px; }
          th:nth-child(9), td:nth-child(9) { width: 8%; min-width: 60px; }
          .vayaj-row .MuiTableCell-root { border-bottom: 2px double #000 !important; }
          .purant-sod-row td {
            border-bottom: 2px solid #000 !important;
            font-weight: bold;
            background: #f8f9fa;
          }
          th:nth-child(5), td:nth-child(5) { border-right: 3px double #000 !important; }
          th:nth-child(6), td:nth-child(6) { border-left: none !important; }
          th:nth-child(2), td:nth-child(2) { width: 18%; min-width: 120px; }
          th:nth-child(3), td:nth-child(3) { width: 10%; min-width: 70px; }
          th:nth-child(7), td:nth-child(7) { width: 18%; min-width: 120px; }
          th:nth-child(8), td:nth-child(8) { width: 10%; min-width: 70px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table { page-break-after: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div style="width:100%">
            <div class="shop-name">${selectedShop},${shopAddress}</div>
                      <div style="text-align:center;font-size:13px;font-weight:bold;">महिना: ${selectedMonthDisplay}</div>
            <div class="main-title">रोज किर्द  कैश बुक</div>
          </div>
          <div class="marathi-sentence">${marathiSentence}</div>
        </div>
        <div class="section-headers">
          <div class="jama-header">जमा</div>
          <div class="kharch-header">खर्च</div>
        </div>
        <div id="loans-table-print-wrapper">${printContent.outerHTML}</div>
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

// Improved Marathi number to words (0-99 full mapping)
function numberToMarathiWords(num) {
  if (!num || isNaN(num)) return '';
  const marathiNumbers = [
    'शून्य','एक','दोन','तीन','चार','पाच','सहा','सात','आठ','नऊ','दहा',
    'अकरा','बारा','तेरा','चौदा','पंधरा','सोळा','सतरा','अठरा','एकोणीस','वीस',
    'एकवीस','बावीस','तेवीस','चोवीस','पंचवीस','सव्वीस','सत्तावीस','अठावीस','एकोणतीस','तीस',
    'एकतीस','बत्तीस','तेहतीस','चौतीस','पस्तीस','छत्तीस','सदतीस','अडतीस','एकोणचाळीस','चाळीस',
    'एक्केचाळीस','बेचाळीस','त्रेचाळीस','चव्वेचाळीस','पंचेचाळीस','सेहेचाळीस','सत्तेचाळीस','अठेचाळीस','एकोणपन्नास','पन्नास',
    'एक्कावन्न','बावन्न','त्रेपन्न','चोपन्न','पंचावन्न','छप्पन्न','सत्तावन्न','अठ्ठावन्न','एकोणसाठ','साठ',
    'एकसष्ठ','बासष्ठ','त्रेसष्ठ','चौसष्ठ','पासष्ठ','सहासष्ठ','सदुसष्ठ','अडुसष्ठ','एकोणसत्तर','सत्तर',
    'एक्काहत्तर','बाहत्तर','त्र्याहत्तर','चौर्‍याहत्तर','पंच्याहत्तर','शहात्तर','सत्त्याहत्तर','अठ्ठ्याहत्तर','एकोणऐंशी','ऐंशी',
    'एक्क्याऐंशी','ब्याऐंशी','त्र्याऐंशी','चौर्‍याऐंशी','पंच्याऐंशी','शहाऐंशी','सत्त्याऐंशी','अठ्ठ्याऐंशी','एकोणनव्वद','नव्वद',
    'एक्क्याण्णव','ब्याण्णव','त्र्याण्णव','चौर्‍याण्णव','पंच्याण्णव','शहाण्णव','सत्त्याण्णव','अठ्ठ्याण्णव','नव्व्याण्णव','शंभर'
  ];
  let words = '';
  let decimal = '';
  if (num.toString().includes('.')) {
    const parts = num.toString().split('.');
    num = parseInt(parts[0]);
    decimal = parts[1];
  }
  if (num <= 100) {
    words = marathiNumbers[num];
  } else {
    // For numbers > 100, use the old logic for hundreds/thousands/lakhs/crores
    const hundreds = ['', 'शंभर', 'दोनशे', 'तीनशे', 'चारशे', 'पाचशे', 'सहाशे', 'सातशे', 'आठशे', 'नऊशे'];
    const thousands = ['', 'हजार', 'लाख', 'कोटी'];
    let n = num;
    if (n >= 10000000) {
      words += numberToMarathiWords(Math.floor(n / 10000000)) + ' कोटी ';
      n %= 10000000;
    }
    if (n >= 100000) {
      words += numberToMarathiWords(Math.floor(n / 100000)) + ' लाख ';
      n %= 100000;
    }
    if (n >= 1000) {
      words += numberToMarathiWords(Math.floor(n / 1000)) + ' हजार ';
      n %= 1000;
    }
    if (n >= 100) {
      words += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n > 0) {
      words += numberToMarathiWords(n);
    }
  }
  if (decimal) {
    words += ' दशांश ' + decimal;
  }
  return words.trim();
}

// Add this function at the top with other utility functions
function marathiToNumber(marathiStr) {
  if (typeof marathiStr !== 'string' || !marathiStr) return 0; // Add type check
  const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
  const englishDigits = ['0','1','2','3','4','5','6','7','8','9'];

  let convertedStr = '';
  for (let i = 0; i < marathiStr.length; i++) {
    const char = marathiStr[i];
    const index = marathiDigits.indexOf(char);
    if (index !== -1) {
      convertedStr += englishDigits[index];
    } else {
      convertedStr += char; // Keep non-Marathi digits/chars as is (e.g., decimal point)
    }
  }
  return parseFloat(convertedStr);
}

const groupedRows = React.useMemo(() => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const dateSet = new Set();
  let currentRunningBalance = Number(settings.balanceAmount) || 0; // This will track the balance carried over day-to-day.

  // Add first day of the month (if not already present from actual data)
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

  const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));

  const allDailyRows = sortedDates.map((date, dateIndex) => {
    const openingJamaBalanceForToday = currentRunningBalance;

    const jamaTransactions = filteredTableData.filter(row => row.sodDate === date && row.name !== 'पुरांत');
    const sodTransactions = filteredTableData.filter(row => row.date === date && row.name !== 'पुरांत');

    let currentDayJamaSum = 0;
    jamaTransactions.forEach(entry => {
      currentDayJamaSum += (marathiToNumber(entry.goldRate) + marathiToNumber(entry.vayaj || 0));
    });

    let currentDaySodSum = 0;
    sodTransactions.forEach(entry => {
      currentDaySodSum += marathiToNumber(entry.goldRate);
    });

    const actualClosingSodBalance = openingJamaBalanceForToday + currentDayJamaSum - currentDaySodSum;

    const dailyRowsForThisDate = [];

    // Add the 'पुरांत बाकी जमा' entry first for display
    dailyRowsForThisDate.push({
      type: 'purant_jama',
      date: date,
      jama: { name: 'पुरांत', goldRate: openingJamaBalanceForToday, sodDate: date },
      sod: null
    });

    // Combine jama and sod transactions for the current date into transaction rows
    const maxTransactions = Math.max(jamaTransactions.length, sodTransactions.length);
    for (let i = 0; i < maxTransactions; i++) {
      const jamaEntry = jamaTransactions[i] || null;
      const sodEntry = sodTransactions[i] || null;
      
      dailyRowsForThisDate.push({
        type: 'transaction',
        date: date, // The date for this set of transactions
        jama: jamaEntry,
        sod: sodEntry
      });

      // If there's a vayaj for this jama entry, add a separate vayaj row immediately after its transaction
      if (jamaEntry && jamaEntry.vayaj) {
        dailyRowsForThisDate.push({
          type: 'vayaj',
          date: date,
          jama: { vayaj: jamaEntry.vayaj, sodDate: date },
          sod: null
        });
      }
    }

    // Add the 'पुरांत बाकी नावे' entry last for display, but only if there were actual sod entries (not just purant)
    // This also ensures it shows the correct closing balance.
    if (sodTransactions.length > 0) {
      dailyRowsForThisDate.push({
        type: 'purant_sod',
        date: date,
        jama: null,
        sod: { name: 'पुरांत', goldRate: actualClosingSodBalance, date: date }
      });
      dailyRowsForThisDate.push({
        type: 'purant_sod_amount',
        date: date,
        openingBalance: openingJamaBalanceForToday
      });
    }

    // Update currentRunningBalance for the next day's iteration
    currentRunningBalance = actualClosingSodBalance;

    return dailyRowsForThisDate;
  });

  const flatRows = allDailyRows.flat();

  // Find the last date in the month
  const lastDate = sortedDates[sortedDates.length - 1];

  // Get last day's opening balance
  let lastDayOpening = 0;
  for (const row of flatRows) {
    if (row.type === 'purant_jama' && row.date === lastDate) {
      lastDayOpening = row.jama.goldRate;
      break;
    }
  }

  // Sum goldRate and vayaj for the last day only
  let totalGold = 0;
  let totalVayaj = 0;
  filteredTableData.forEach(row => {
    if (
      (row.sodDate && new Date(row.sodDate).toISOString().slice(0, 10) === lastDate) ||
      (row.date && new Date(row.date).toISOString().slice(0, 10) === lastDate)
    ) {
      totalGold += marathiToNumber(row.goldRate);
      totalVayaj += marathiToNumber(row.vayaj || 0);
    }
  });

  const monthClosingBalance = lastDayOpening + totalGold + totalVayaj;

  flatRows.push({
    type: 'month_end_summary',
    amount: monthClosingBalance
  });

  return flatRows;
}, [filteredTableData, selectedMonth, settings.balanceAmount]);

useEffect(() => {
const summaryRow = groupedRows.find(row => row.type === 'month_end_summary');
if (summaryRow && selectedShop && selectedMonth) {
  saveClosingBalance(selectedShop, selectedMonth, summaryRow.amount);
}
}, [groupedRows, selectedShop, selectedMonth]);

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
            // Main vertical line styling: apply a thick right border to 5th column cells
            // and ensure no left border on 6th column to prevent interference.
            // These rules apply to both header (th) and body (td) cells.
            '& th:nth-of-type(5), & td:nth-of-type(5)': {
              borderRight: '5px solid #000 !important',
              borderLeft: '1px solid rgba(224, 224, 224, 1)',
            },
            '& th:nth-of-type(6), & td:nth-of-type(6)': {
              borderLeft: 'none !important',
              borderRight: '1px solid rgba(224, 224, 224, 1)',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              fontSize: '1rem',
            },
            '& .vayaj-row .MuiTableCell-root': {
              borderBottom: '3px double #000 !important',
            },
          }}
        >
          <Table id="loans-table" sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                {headings.map((heading, idx) => (
                  <TableCell 
                    key={idx} 
                    align="center" 
                    sx={{
                      fontWeight: 'bold',
                      // Removed inline border styles here, they are now handled globally in TableContainer
                    }}
                  >{heading}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headings.length} align="center">डेटा उपलब्ध नाही</TableCell>
                </TableRow>
              ) : (
                groupedRows.map((row, idx) => {
                  const isFirstRowOfDay = idx === 0 || row.date !== groupedRows[idx - 1].date;
                  const isLastRowOfDay = idx === groupedRows.length - 1 || row.date !== groupedRows[idx + 1].date;

                  if (row.type === 'purant_jama') {
                    return (
                      <TableRow key={idx} sx={{ 
                        backgroundColor: '#f8f9fa',
                        '& td': {
                          fontWeight: 'bold',
                          borderBottom: '3px double #000'
                        }
                      }}>
                        <TableCell align="center">{formatMarathiDate(row.date)}</TableCell>
                        <TableCell align="center">श्री पुरंत बाकी जमा</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.jama.goldRate)}</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                      </TableRow>
                    );
                  } else if (row.type === 'transaction') {
                    const jamaEntry = row.jama;
                    const sodEntry = row.sod;

                    return (
                      <TableRow key={idx}>
                        {/* जमा (Jama) section */}
                        <TableCell align="center">{jamaEntry ? formatMarathiDate(jamaEntry.sodDate) : ''}</TableCell>
                        <TableCell align="center">
                          {jamaEntry ? (
                            <>
                              श्री {jamaEntry.name} यांचे {numberToMarathiWords(marathiToNumber(jamaEntry.goldRate) + marathiToNumber(jamaEntry.vayaj || 0))} 
                              {jamaEntry.item ? ` जमा त्या पोटी ठेवलेले  ${jamaEntry.item}` : ''}
                              {jamaEntry.sodDate ? ` सोडवले ` : ''}
                              {jamaEntry.pavtiNo ? ` सोडपावती क्र. ${jamaEntry.pavtiNo}` : ''}
                              {jamaEntry.checkNo ? `(चेक क्र. ${jamaEntry.checkNo})` : ''}
                            </>
                          ) : ''}
                        </TableCell>
                        <TableCell align="center">{jamaEntry ? jamaEntry.accountNo : ''}</TableCell>
                        <TableCell align="center" className="amount-cell">{jamaEntry ? formatMarathiCurrency(jamaEntry.goldRate) : ''}</TableCell>
                        <TableCell align="center"></TableCell>
                        {/* नावेचा (Sod) section */}
                        <TableCell align="center">{sodEntry ? formatMarathiDate(sodEntry.date) : ''}</TableCell>
                        <TableCell align="center">
                          {sodEntry ? (
                            <>
                              श्री {sodEntry.name} यांचे नावे {numberToMarathiWords(marathiToNumber(sodEntry.goldRate))} रुपये 
                              {sodEntry.item ? ` मात्र त्यापोटी सोने ${sodEntry.item} ठेवले.` : ''}
                              {sodEntry.moparu ? ` ठेव पावती क्र. ${sodEntry.moparu}` : ''}
                              {sodEntry.checkNo ? ` (चेक क्र. ${sodEntry.checkNo})` : ''}
                            </>
                          ) : ''}
                        </TableCell>
                        <TableCell align="center">{sodEntry ? sodEntry.accountNo : ''}</TableCell>
                        <TableCell align="center" className="amount-cell">{sodEntry ? formatMarathiCurrency(sodEntry.goldRate) : ''}</TableCell>
                      </TableRow>
                    );
                  } else if (row.type === 'vayaj') {
                    return (
                      <TableRow 
                        key={idx} 
                        className="vayaj-row"
                        sx={{
                          '& .MuiTableCell-root': {
                            borderBottom: '3px double #000 !important'
                          }
                        }}
                      >
                        <TableCell align="center">{row.jama.sodDate ? formatMarathiDate(row.jama.sodDate) : ''}</TableCell>
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
                    );
                  } else if (row.type === 'purant_sod') {
                    return (
                      <TableRow 
                        key={idx}
                        className="purant-sod-row2"
                        sx={{ 
                          backgroundColor: '#f8f9fa',
                          
                        }}
                      >
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center">{formatMarathiDate(row.sod.date)}</TableCell>
                        <TableCell align="center">श्री पुरंत बाकी नावे</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.sod.goldRate)}</TableCell>
                      </TableRow>
                    );
                  } else if (row.type === 'purant_sod_amount') {
                    return (
                      <TableRow key={idx} className="purant-sod-row" sx={{ backgroundColor: '#f8f9fa', '& td': { fontWeight: 'bold', borderBottom: '3px solid #000 !important' } }}>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.openingBalance)}</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.openingBalance)}</TableCell>
                      </TableRow>
                    );
                  } else if (row.type === 'month_end_summary') {
                    return (
                      <TableRow key={idx} className="purant-sod-row" sx={{ backgroundColor: '#e0e0e0', '& td': { fontWeight: 'bold', borderBottom: '3px solid #000 !important' } }}>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center" className="amount-cell">{formatMarathiCurrency(row.amount)}</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center"></TableCell>
                      </TableRow>
                    );
                  }
                  return null; // Should not happen with defined types
                })
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