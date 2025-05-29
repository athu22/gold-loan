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
        body { font-family: 'Noto Sans Devanagari', 'Devanagari', Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 14px; }
        th { background: #f0f0f0; }
        h2, h4 { margin: 0; }
        .header { text-align: center; margin-bottom: 2px; }
        .header .shop-name {
          font-size: 30px !important;
          font-weight: bold !important;
          margin-bottom: 2px;
        }
      </style>
    </head>
    <body>
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
        sx={{ mb: 2 }}
      >
        Print
      </Button>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <select value={selectedShop} onChange={e => setSelectedShop(e.target.value)}>
          <option value="">दुकान निवडा</option>
          {shops.map(shop => (
            <option key={shop.id} value={shop.name}>{shop.name}</option>
          ))}
        </select>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        />
      </Box>
      <div ref={printRef}>
<div className="header">
  <Typography
    variant="h2"
    align="center"
    gutterBottom
    className="shop-name"
    sx={{ fontWeight: 'bold', fontSize: { xs: 20, sm: 48, md: 20 } }}
  >
    {shopDisplayName}
  </Typography>
  <Typography variant="h6" align="center" gutterBottom
  sx={{ fontWeight: 'bold', fontSize: { xs: 20, sm: 48, md: 20 } }}>
    भौदल खाते
  </Typography>
  {/* Add this line for नमुना नंबर १३ */}
  <Typography align="center" sx={{ mb: 0.5, fontWeight: 500 }}>
    नमुना नंबर १३ (नियम १९ पहा)
  </Typography>
  <Typography align="center" sx={{ mb: 1 }}>
    सन: {toMarathiNumber(period)}
  </Typography>
</div>
        <TableContainer component={Paper} elevation={0}>
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
      // Dates are in YYYY-MM-DD format
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

return flatRows.map((row, idx) => {
  let displayAmount = Number(row.goldRate) || 0;
  let deposit = '';
  let depositTotal = '';
  let withdrawal = '';
  let withdrawalTotal = '';

  if (row.type === 'deposit') {
    deposit = row.goldRate || '०';
    totalDeposit += displayAmount;
    depositTotal = toMarathiNumber(totalDeposit);
    runningBalance += displayAmount;
    withdrawal = '०';
    withdrawalTotal = toMarathiNumber(totalWithdrawal);
  } else if (row.type === 'withdrawal') {
    withdrawal = row.goldRate || '०';
    totalWithdrawal += displayAmount;
    withdrawalTotal = toMarathiNumber(totalWithdrawal);
    deposit = '०';
    depositTotal = toMarathiNumber(totalDeposit);
  }

  return (
    <TableRow key={idx}>
      <TableCell align="center">{toMarathiDate(row.date)}</TableCell>
      <TableCell align="center">{deposit}</TableCell>
      <TableCell align="center">{depositTotal}</TableCell>
      <TableCell align="center">{withdrawal}</TableCell>
      <TableCell align="center">{withdrawalTotal}</TableCell>
      <TableCell align="center">{toMarathiNumber(runningBalance)}</TableCell>
    </TableRow>
  );
});
  })()}
</TableBody>
          </Table>
        </TableContainer>
      </div>
    </Box>
  );
}

export default BhaudalKhate;