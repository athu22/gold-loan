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
  if (!marathiStr) return 0;
  const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
  return parseInt(marathiStr.split('').map(d => marathiDigits.indexOf(d)).join(''));
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
          <title>भौदल खाते</title>
          <style>
            @page {
              size: landscape;
              margin: 15mm;
            }
            body { 
              font-family: 'Noto Sans Devanagari', 'Devanagari', Arial, sans-serif;
              padding: 20px;
              background-color: white;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .shop-name {
              font-size: 32px !important;
              font-weight: bold !important;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .subtitle {
              font-size: 16px;
              margin: 5px 0;
            }
            table { 
              border-collapse: collapse; 
              width: 100%;
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: center; 
              font-size: 14px;
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
              font-size: 12px;
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
            <div class="title">भौदल खाते</div>
            <div class="subtitle">नमुना नंबर १३ (नियम १९ पहा)</div>
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
                let runningBalance = Number(initialAmount);
                let totalDeposit = 0;
                let totalWithdrawal = 0;

                console.log('Initial Balance:', runningBalance);

                // Flatten rows: if both sodDate and date exist, create two rows
                const flatRows = [];
                rows.forEach(row => {
                  if (row.sodDate) {
                    flatRows.push({
                      type: 'deposit',
                      date: row.sodDate,
                      goldRate: row.goldRate,
                    });
                  }
                  if (row.date) {
                    flatRows.push({
                      type: 'withdrawal',
                      date: row.date,
                      goldRate: row.goldRate,
                    });
                  }
                });

                // Sort by date (ascending)
                flatRows.sort((a, b) => {
                  if (!a.date) return 1;
                  if (!b.date) return -1;
                  return a.date.localeCompare(b.date);
                });

                console.log('All Transactions:', flatRows);

                const tableRows = flatRows.map((row, idx) => {
                  // Convert Marathi numerals to regular numbers
                  let displayAmount = marathiToNumber(row.goldRate) || 0;
                  let deposit = '';
                  let withdrawal = '';

                  console.log(`Processing row ${idx}:`, {
                    type: row.type,
                    date: row.date,
                    amount: displayAmount,
                    currentBalance: runningBalance,
                    rawGoldRate: row.goldRate
                  });

                  if (row.type === 'deposit') {
                    deposit = row.goldRate || '०';
                    totalDeposit += displayAmount;
                    // Subtract from running balance for deposits
                    runningBalance -= displayAmount;
                    withdrawal = '०';
                    console.log('After Deposit:', {
                      amount: displayAmount,
                      newBalance: runningBalance,
                      totalDeposit,
                      rawAmount: row.goldRate
                    });
                  } else if (row.type === 'withdrawal') {
                    withdrawal = row.goldRate || '०';
                    totalWithdrawal += displayAmount;
                    // Add to running balance for withdrawals
                    runningBalance += displayAmount;
                    deposit = '०';
                    console.log('After Withdrawal:', {
                      amount: displayAmount,
                      newBalance: runningBalance,
                      totalWithdrawal,
                      rawAmount: row.goldRate
                    });
                  }

                  return (
                    <TableRow key={idx}>
                      <TableCell align="center">{toMarathiDate(row.date)}</TableCell>
                      <TableCell align="center">{deposit}</TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center">{withdrawal}</TableCell>
                      <TableCell align="center"></TableCell>
                      <TableCell align="center">{toMarathiNumber(runningBalance)}</TableCell>
                    </TableRow>
                  );
                });

                // Add total row
                tableRows.push(
                  <TableRow key="total" sx={{ 
                    '& td': { 
                      borderTop: '2px solid black',
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5'
                    }
                  }}>
                    <TableCell align="center">एकूण</TableCell>
                    <TableCell align="center">{toMarathiNumber(totalDeposit)}</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center">{toMarathiNumber(totalWithdrawal)}</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center">{toMarathiNumber(runningBalance)}</TableCell>
                  </TableRow>
                );

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