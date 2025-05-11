import React, { useRef, useState } from 'react';
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
} from '@mui/material';

function Reports() {
  const printRef = useRef();

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

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // To reload the app after print
  };

  // Calculate summary row for customer report
  const customerLoans = reportData.customerData.customerLoans;
  const totalLoanAmount = customerLoans.reduce((sum, c) => sum + (parseFloat(c.loanAmount) || 0), 0);
  const totalCustomers = customerLoans.length;

  return (
    <Box>
      {/* ... existing controls ... */}

      {/* Customer Report Table (Printable) */}
      <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={handlePrint}>प्रिंट करा</Button>
      </Box>
      <Box ref={printRef} sx={{ background: '#fff', p: 2, mb: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          ग्राहक अहवाल
        </Typography>
        <TableContainer sx={{ border: '1px solid #000', maxWidth: '100%', '@media print': { boxShadow: 'none', border: '1px solid #000' } }}>
          <Table size="small" sx={{ minWidth: 900, border: '1px solid #000', '@media print': { border: '1px solid #000' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000' }}>अ.क्र.</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>नाव</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>फोन</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>दुकान</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>कर्ज रक्कम</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>व्याज दर (%)</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>कर्ज सुरुवात</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>कर्ज समाप्ती</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>कर्ज कालावधी (महिने)</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>सोने वजन (ग्राम)</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>सोने शुद्धता</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customerLoans.map((customer, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ border: '1px solid #000' }}>{idx + 1}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.name}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.phone}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.shopName}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>₹{customer.loanAmount}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.interestRate || '-'}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.startDate && customer.startDate !== '-' ? new Date(customer.startDate).toLocaleDateString('mr-IN') : '-'}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.endDate && customer.endDate !== '-' ? new Date(customer.endDate).toLocaleDateString('mr-IN') : '-'}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.duration || '-'}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.goldWeight || '-'}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>{customer.goldPurity || '-'}</TableCell>
                </TableRow>
              ))}
              {/* Summary Row */}
              <TableRow>
                <TableCell sx={{ border: '1px solid #000' }} colSpan={4}><b>एकूण</b></TableCell>
                <TableCell sx={{ border: '1px solid #000' }}><b>₹{totalLoanAmount}</b></TableCell>
                <TableCell sx={{ border: '1px solid #000' }} colSpan={6}><b>एकूण ग्राहक: {totalCustomers}</b></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ... rest of the report sections ... */}

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
