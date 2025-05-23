import React, { useRef } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const bhaudalData = [
  { date: '01-04-2022', jama: 0, rate: 0, name: '', sod: 0, rashi: 46000 },
  { date: '02-04-2022', jama: 12000, rate: 0, name: '', sod: 0, rashi: 58000 },
  // ...add all your rows here as per your image...
];

function BhaudalKhate() {
  const printRef = useRef();

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
            .header { text-align: center; margin-bottom: 10px; }
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
      <div ref={printRef}>
        <div className="header">
          <Typography variant="h6" align="center" gutterBottom>
            राघवेंद्र चिपळकट्टी, मिरज<br />
            भौदल खाते
          </Typography>
          <Typography align="center" sx={{ mb: 2 }}>
            नमुना नंबर ११ (नियम १९(१))<br />
            कालावधी: 01/04/2022 ते 31/03/2023
          </Typography>
        </div>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">दिनांक</TableCell>
                <TableCell align="center">जमा</TableCell>
                <TableCell align="center">रेट</TableCell>
                <TableCell align="center">नांव</TableCell>
                <TableCell align="center">सोड</TableCell>
                <TableCell align="center">शिल्लक</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bhaudalData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell align="center">{row.date}</TableCell>
                  <TableCell align="center">{row.jama}</TableCell>
                  <TableCell align="center">{row.rate}</TableCell>
                  <TableCell align="center">{row.name}</TableCell>
                  <TableCell align="center">{row.sod}</TableCell>
                  <TableCell align="center">{row.rashi}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Box>
  );
}

export default BhaudalKhate;