import React, { useEffect, useState , useRef} from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';
import { getAllShops, getTableData } from '../firebase/services';
import PrintIcon from '@mui/icons-material/Print';

function Reports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});

  const printRef = useRef();
useEffect(() => {
  async function fetchData() {
    setLoading(true);
    const shopsRes = await getAllShops();
    if (!shopsRes.success) {
      setLoading(false);
      return;
    }
    const shopsArr = Object.values(shopsRes.data || {});
    setShops(shopsArr);

    // Fetch all shop reports for the selected month
    const allReports = [];
    for (const shop of shopsArr) {
      const tableRes = await getTableData(shop.shopName, selectedMonth); // Pass month here
      allReports.push({
        shop,
        customers: tableRes.success && Array.isArray(tableRes.data) ? tableRes.data : [],
      });
    }
    setReports(allReports);
    setLoading(false);
  }
  fetchData();
}, [selectedMonth]);

  const handleShopChange = (event) => {
    setSelectedShop(event.target.value);
    setSelectedCustomer(''); // Reset customer when shop changes
  };

  const handleCustomerChange = (event) => {
    setSelectedCustomer(event.target.value);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  // Filter reports for selected shop
  const filteredReports = selectedShop
    ? reports.filter(r => r.shop.shopName === selectedShop)
    : [];

  // Get customers for selected shop
  const customersList = filteredReports.length > 0 ? filteredReports[0].customers : [];

  // Filter for selected customer
  const displayedCustomers = selectedCustomer
    ? customersList.filter(c => c.name === selectedCustomer)
    : customersList;



const handlePrint = () => {
  if (!selectedCustomer) return;
  const printContents = `<div class="print-container">${printRef.current.innerHTML}</div>`;
  const printWindow = window.open('', 'printWindow');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body {
            margin: 0;
            font-family: 'Noto Sans Devanagari', 'Arial', sans-serif;
            background: #fff;
            color: #000;
          }
          .print-container {
            width: 1000px;
            margin: 0 auto;
          }
          h5, h6, h2, h3, h4 {
            margin: 0;
            font-family: inherit;
          }
          .MuiTypography-root {
            font-family: inherit !important;
          }
          .MuiPaper-root {
            box-shadow: none !important;
            border: 2px solid #000 !important;
            margin-bottom: 24px !important;
            padding: 16px !important;
          }
          table {
            page-break-inside: avoid;
            border-collapse: collapse;
            width: 100%;
            margin-top: 8px;
            background: #fff;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: center;
            font-size: 14px;
          }
          th {
            background: #f5f5f5;
            font-weight: bold;
          }
          @media print {
            body {
              margin: 0;
              background: #fff;
            }
            .print-container {
              width: 1000px;
              margin: 0 auto;
            }
            .MuiPaper-root {
              box-shadow: none !important;
              border: 2px solid #000 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>${printContents}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};


return (
  <Box sx={{ p: 3, background: '#fff' }}>
    {/* Flex row for shop, customer, and print */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        mb: 3,
        background: '#f8f9fa',
        p: 2,
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {/* Shop Dropdown */}
      <FormControl sx={{ minWidth: 220, flex: '0 1 auto' }} size="small" variant="outlined">
        <InputLabel id="shop-select-label">दुकान निवडा</InputLabel>
        <Select
          labelId="shop-select-label"
          value={selectedShop}
          label="दुकान निवडा"
          onChange={handleShopChange}
        >
          {shops.map((shop, idx) => (
            <MenuItem key={shop.shopName} value={shop.shopName}>
              {shop.shopName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Customer Dropdown */}
      <FormControl
        sx={{
          minWidth: 220,
          flex: '0 1 auto',
          display: selectedShop ? 'flex' : 'none',
        }}
        size="small"
        variant="outlined"
      >
        <InputLabel id="customer-select-label">ग्राहक निवडा</InputLabel>
        <Select
          labelId="customer-select-label"
          value={selectedCustomer}
          label="ग्राहक निवडा"
          onChange={handleCustomerChange}
        >
          {customersList.map((customer, idx) => (
            <MenuItem key={customer.accountNo || idx} value={customer.name}>
              {customer.name}
            </MenuItem>
          ))}
        </Select>

      </FormControl>
      <FormControl sx={{ minWidth: 160, flex: '0 1 auto' }} size="small" variant="outlined">
  <TextField
    label="महिना निवडा"
    type="month"
    value={selectedMonth}
    onChange={e => setSelectedMonth(e.target.value)}
    size="small"
    InputLabelProps={{ shrink: true }}
  />
</FormControl>

      {/* Print Button */}
      <Box
        sx={{
          display: selectedCustomer ? 'flex' : 'none',
          alignItems: 'center',
          ml: 'auto',
          gap: 1.5,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          रिपोर्ट प्रिंट करा
        </Typography>
        <PrintIcon
          onClick={handlePrint}
          sx={{
            cursor: 'pointer',
            color: '#1976d2',
            fontSize: 28,
            '&:hover': { color: '#115293' },
            transition: 'color 0.2s',
          }}
        />
      </Box>
    </Box>

    

    {filteredReports.length === 0 && (
      <Typography align="center" sx={{ mt: 2 }}>कृपया दुकान निवडा</Typography>
    )}

    <div ref={printRef}>
      {selectedCustomer && filteredReports.map((report, idx) => (
<Box key={report.shop.shopName} sx={{ mb: 4 }}>
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
    <Typography variant="h5" gutterBottom>
      {report.shop.shopName}
    </Typography>
    <Typography gutterBottom>
      मुदत 01/04/2023 ते 31/03/2024
    </Typography>
  </Box>
          {displayedCustomers.map((customer, cidx) => (
            <Paper
              key={cidx}
              variant="outlined"
              sx={{
                mb: 3,
                p: 2,
                border: '2px solid #000',
                background: '#fff',
                boxShadow: 'none'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1">
                  खाते क्र: {customer.accountNo || '-'}
                </Typography>
                <Typography variant="subtitle1">
                  {customer.name || '-'}, {customer.address || '-'}
                </Typography>
                <Typography variant="subtitle1">
                  {report.shop.shopName}
                </Typography>
              </Box>
              <TableContainer>
                <Table
                  size="small"
                  sx={{
                    border: '1px solid #000',
                    borderCollapse: 'collapse',
                    background: '#fff'
                  }}
                >
<TableHead>
  <TableRow>
    <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #000', minWidth: 80, fontWeight: 'bold', background: '#f5f5f5' }}>तारीख</TableCell>
    <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #000', fontWeight: 'bold', background: '#f5f5f5' }}>कर्ज घेतलेली अगर नावे लिहिलेली मुदलाची रक्कम</TableCell>
    <TableCell colSpan={3} align="center" sx={{ border: '1px solid #000', fontWeight: 'bold', background: '#f5f5f5' }}>परत केलेली चिठ्ठी जमा केलेली रक्कम</TableCell>
    <TableCell colSpan={2} align="center" sx={{ border: '1px solid #000', fontWeight: 'bold', background: '#f5f5f5' }}>दरम्यान व्यवहारांतून येणे असलेली रक्कम</TableCell>
    <TableCell colSpan={3} align="center" sx={{ border: '1px solid #000', fontWeight: 'bold', background: '#f5f5f5' }}>व्याजाचा हिशोबाचा तपशील</TableCell>
    <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #000', minWidth: 60, fontWeight: 'bold', background: '#f5f5f5' }}>कीट पान</TableCell>
    <TableCell rowSpan={2} align="center" sx={{ border: '1px solid #000', minWidth: 60, fontWeight: 'bold', background: '#f5f5f5' }}>पा नंबर</TableCell>
  </TableRow>
  <TableRow>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>मुदल</TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>व्याज</TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>एकूण रक्कम</TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>मुदल</TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>व्याज</TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>येणे</TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>महिने</TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fafafa' }}>मी व्याज</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  <TableRow>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
      {customer.date || '-'}
    </TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
      {customer.goldRate || '-'}
    </TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
      {customer.returnInterest || '-'}
    </TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
      {customer.returnTotal || '-'}
    </TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
      {customer.duringPrincipal || '-'}
    </TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
      {customer.duringInterest || '-'}
    </TableCell>
    <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
      {customer.due || '-'}
    </TableCell>
  <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
    {customer.months || '-'}
  </TableCell>
  {/* Remove this cell:
  <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
    {customer.monthlyInterest || '-'}
  </TableCell>
  */}
  <TableCell colSpan={2} align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
    {customer.item || '-'}
  </TableCell>
  <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
    {customer.kitPage || '-'}
  </TableCell>
  <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
    {customer.paNumber || '-'}
  </TableCell>
  </TableRow>
 {customer.sodDate && (
    <TableRow>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
        {customer.sodDate || '-'}
      </TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>-</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>{customer.goldRate || '-'}</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>{customer.vayaj || '-'}</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>
        {(() => {
          // Convert Devanagari to English digits
          const toEnglishDigits = str =>
            String(str).replace(/[०-९]/g, d => '0123456789'['०१२३४५६७८९'.indexOf(d)]);
          // Convert English digits to Devanagari
          const toMarathiDigits = num =>
            String(num).replace(/[0-9]/g, d => '०१२३४५६७८९'[d]);

          const principal = Number(toEnglishDigits(customer.goldRate));
          const interest = Number(toEnglishDigits(customer.vayaj));
          if (!isNaN(principal) && !isNaN(interest) && customer.goldRate && customer.vayaj) {
            const sum = principal + interest;
            return toMarathiDigits(sum);
          }
          return '-';
        })()}
      </TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>-</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>-</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>-</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>-</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>-</TableCell>
      <TableCell align="center" sx={{ border: '1px solid #000', background: '#fff', fontSize: 14 }}>-</TableCell>
    </TableRow>
  )}
  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Box>
      ))}
      <Typography align="center" sx={{ mt: 2 }}>Page 1 of 1</Typography>
    </div>
  </Box>
);

}

export default Reports;