import React, { useRef } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { getAllShops, getTableData } from '../firebase/services';



function getLoanYearAndPeriod(selectedMonth) {
  // selectedMonth is "YYYY-MM"
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // If month >= 6 (June), loan year starts this year, else previous year
  const startYear = month >= 6 ? year : year - 1;
  const endYear = startYear + 1;

  return {
    loanYear: `${startYear}-${String(endYear).slice(-2)}`,
    period: `01/06/${startYear} ते 30/04/${endYear}`,
    startYear,
    endYear,
  };
}

function BhaudalKhate() {
  const printRef = useRef();
  const [shops, setShops] = React.useState([]);
const [selectedShop, setSelectedShop] = React.useState('');
const [selectedMonth, setSelectedMonth] = React.useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});
const [rows, setRows] = React.useState([]);
const [loading, setLoading] = React.useState(false);
 const shopDisplayName = shops.find(shop => shop.name === selectedShop)?.name || '';
  const { loanYear, period } = getLoanYearAndPeriod(selectedMonth);
const initialAmount = shops.find(shop => shop.name === selectedShop)?.amount || 0;


React.useEffect(() => {
  // Fetch all shops
  getAllShops().then(res => {
    if (res.success) {
      const shopsArray = Object.entries(res.data || {}).map(([id, data]) => ({
        id,
        name: data.shopName,
        amount: Number(data.amount) || 0, // <-- Add this line to include amount
      }));
      setShops(shopsArray);
    }
  });
}, []);

function toMarathiDate(dateStr) {
  if (!dateStr) return '';
  const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
  const [y, m, d] = dateStr.split('-');
  const date = `${d}/${m}/${y}`;
  return date.replace(/\d/g, d => marathiDigits[d]);
}
function toMarathiNumber(str) {
  if (!str) return '';
  const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
  return String(str).replace(/\d/g, d => marathiDigits[d]);
}

// Add this new function to convert Marathi numerals to regular numbers
function marathiToNumber(marathiStr) {
  if (marathiStr === null || marathiStr === undefined) return 0;
  const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
  // Convert to string, in case it's a number
  const str = String(marathiStr);
  // If it's already a regular number string, just return the number
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  // Otherwise, convert Marathi digits to number
  return parseInt(
    str
      .split('')
      .map(d => marathiDigits.indexOf(d) !== -1 ? marathiDigits.indexOf(d) : d)
      .join('')
  ) || 0;
}

React.useEffect(() => {
  if (selectedShop && selectedMonth) {
    setLoading(true);
    getTableData(selectedShop, selectedMonth).then(res => {
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
      } else {
        setRows([]);
      }
      setLoading(false);
    });
  } else {
    setRows([]);
  }
}, [selectedShop, selectedMonth]);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '', 'height=900,width=1200');
    win.document.write(`
      <html>
        <head>
          <title>भडवल खाते</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body { 
              font-family: 'Noto Sans Devanagari', 'Devanagari', Arial, sans-serif;
              padding: 8px;
              background-color: white;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .shop-name {
              font-size: 22px !important;
              font-weight: bold !important;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
            }
            .subtitle {
              font-size: 12px;
              margin: 5px 0;
            }
            table { 
              border-collapse: collapse; 
              width: 100%;
              margin-top: 10px;
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 4px 2px;
              text-align: center;
              font-size: 11px;
            }
            th { 
              background: #f0f0f0;
              font-weight: bold;
            }
            .total-row td {
              border-top: 2px solid #000;
              font-weight: bold;
              background-color: #f5f5f5;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${shopDisplayName}</div>
            <div class="title">भांडवल खाते</div>
            <div class="subtitle">नमुना नंबर १३ (नियम १८ पहा)</div>
            <div class="subtitle">सन: ${toMarathiNumber(period)}</div>
          </div>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<PrintIcon />}
        onClick={handlePrint}
        sx={{ 
          mb: 2,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0'
          }
        }}
      >
        प्रिंट
      </Button>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <select 
          value={selectedShop} 
          onChange={e => setSelectedShop(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
            minWidth: '200px'
          }}
        >
          <option value="">दुकान निवडा</option>
          {shops.map(shop => (
            <option key={shop.id} value={shop.name}>{shop.name}</option>
          ))}
        </select>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px'
          }}
        />
      </Box>
      <div ref={printRef}>
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{
            '& .MuiTableCell-root': {
              border: '1px solid rgba(0, 0, 0, 0.12)',
              padding: '12px 8px',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              fontSize: '1rem',
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">दिनांक</TableCell>
                <TableCell align="center">जमा</TableCell>
                <TableCell align="center">रो प</TableCell>
                <TableCell align="center">नावे</TableCell>
                <TableCell align="center">रो प</TableCell>
                <TableCell align="center">शिल्लक</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const openingBalanceDate = `${selectedMonth}-01`;
                let runningBalance = Number(initialAmount);
                let totalDeposit = 0;
                let totalWithdrawal = 0;

                const tableRows = [];

                // 1. Add opening balance row. This is not a transaction, but the starting point.
                // It shows 0 for deposit/withdrawal, and the initial amount as the starting balance.
                tableRows.push(
                  <TableRow key="opening-balance">
                    <TableCell align="center">{toMarathiDate(openingBalanceDate)}</TableCell>
                    <TableCell align="center">{toMarathiNumber('0')}</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center">{toMarathiNumber('0')}</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center">{toMarathiNumber(runningBalance)}</TableCell>
                  </TableRow>
                );

                // Flatten and sort transactions from Firebase
                const flatRows = [];
                rows.forEach(row => {
                  if (row.sodDate) { // Deposit (money in)
                    flatRows.push({
                      type: 'deposit',
                      date: row.sodDate,
                      goldRate: row.goldRate,
                    });
                  }
                  if (row.date) { // Withdrawal (money out)
                    flatRows.push({
                      type: 'withdrawal',
                      date: row.date,
                      goldRate: row.goldRate,
                    });
                  }
                });
                
                flatRows.sort((a, b) => {
                  if (!a.date) return 1;
                  if (!b.date) return -1;
                  return a.date.localeCompare(b.date);
                });

                // Group transactions by month
                const transactionsByMonth = {};
                flatRows.forEach(row => {
                  const monthKey = row.date ? row.date.slice(0, 7) : row.sodDate ? row.sodDate.slice(0, 7) : '';
                  if (!transactionsByMonth[monthKey]) transactionsByMonth[monthKey] = [];
                  transactionsByMonth[monthKey].push(row);
                });

                let runningBalanceByMonth = runningBalance;
                let lastMonthKey = null;
                Object.entries(transactionsByMonth).forEach(([monthKey, monthRows], monthIdx) => {
                  let monthDeposit = 0;
                  let monthWithdrawal = 0;
                  monthRows.forEach((row, idx) => {
                    let displayAmount = marathiToNumber(row.goldRate) || 0;
                    let deposit = '';
                    let withdrawal = '';

                    if (row.type === 'deposit') {
                      deposit = row.goldRate || '०';
                      monthDeposit += displayAmount;
                      runningBalanceByMonth -= displayAmount;
                      withdrawal = '०';
                    } else if (row.type === 'withdrawal') {
                      withdrawal = row.goldRate || '०';
                      monthWithdrawal += displayAmount;
                      runningBalanceByMonth += displayAmount;
                      deposit = '०';
                    }

                    tableRows.push(
                      <TableRow key={`${monthKey}-${row.date || row.sodDate}-${idx}`}>
                        <TableCell align="center">{toMarathiDate(row.date || row.sodDate)}</TableCell>
                        <TableCell align="center">{deposit}</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center">{withdrawal}</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center">{toMarathiNumber(runningBalanceByMonth)}</TableCell>
                      </TableRow>
                    );
                  });
                  // Add bold line and total row after each month
                  tableRows.push(
                    <TableRow key={`boldline-${monthKey}`}> 
                      <TableCell colSpan={6} style={{ borderTop: '3px solid #000', padding: 0 }}></TableCell>
                    </TableRow>
                  );
                  tableRows.push(
                    <TableRow key={`total-${monthKey}`} sx={{ '& td': { fontWeight: 'bold', backgroundColor: '#f5f5f5' } }}>
                      <TableCell align="center"><b>एकूण ({monthKey})</b></TableCell>
                      <TableCell align="center"><b>{toMarathiNumber(monthDeposit)}</b></TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center"><b>{toMarathiNumber(monthWithdrawal)}</b></TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center"><b>{toMarathiNumber(runningBalanceByMonth)}</b></TableCell>
                    </TableRow>
                  );
                  tableRows.push(
                    <TableRow key={`boldline-after-total-${monthKey}`}> 
                      <TableCell colSpan={6} style={{ borderTop: '3px solid #000', padding: 0 }}></TableCell>
                    </TableRow>
                  );
                });
                return tableRows;
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Box>
  );
}

export default BhaudalKhate;