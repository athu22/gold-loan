import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  alpha,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Badge as BadgeIcon,
  Save as SaveIcon,
  ContentCopy as ContentCopyIcon,
  ContentPaste as ContentPasteIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { addCustomer,  updateCustomer, deleteCustomer,  getAllShops, saveTableData, getTableData, getShopSettings } from '../firebase/services';
import { translations, toMarathiName } from '../utils/translations';
import MarathiTransliterator from '../components/MarathiTransliterator';

const blinkStyle = {
  animation: 'blinker 1s linear infinite',
};

const blinkKeyframes = `
@keyframes blinker {
  50% { opacity: 0; }
}
`;

function Customers() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    aadharNumber: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [settings, setSettings] = useState({
    interestRate: 2.5, // Default interest rate
  });

  function toMarathiNumber(num) {
    return String(num).replace(/\d/g, d => '०१२३४५६७८९'[d]);
  }

  function toMarathiDate(dateStr) {
    if (!dateStr) return '';
    // Expecting dateStr in 'yyyy-mm-dd'
    const [yyyy, mm, dd] = dateStr.split('-');
    const formatted = [dd, mm, yyyy].join('/');
    return formatted.replace(/\d/g, d => '०१२३४५६७८९'[d]);
  }

  function fromMarathiDate(dateStr) {
    if (!dateStr) return '';
    // Check if it's already in the standard yyyy-mm-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Otherwise, assume Marathi dd/mm/yyyy and convert
    const englishDigitsStr = String(dateStr).replace(/[०१२३४५६७८९]/g, d => '०१२३४५६७८९'.indexOf(d));
    const parts = englishDigitsStr.split('/');
    if (parts.length !== 3) return ''; // Return empty if format is not dd/mm/yyyy
    
    let [dd, mm, yyyy] = parts;
    
    // Ensure parts are valid numbers before padding
    if (isNaN(parseInt(dd)) || isNaN(parseInt(mm)) || isNaN(parseInt(yyyy))) return '';

    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Table headings as per the image
  const headings = [
    'अनु. क्र.',
    'खाते क्र.',
    'पावती क्र.',
    'दिनांक',
    'नावं',
    'वस्तू',
    'रुपये',
    'सोड दि',
    'दिवस',
    'सो पा क्र ',
    'व्याज',
    'पत्ता',
    'सही',
  ];

  // Initial state for a row
  const emptyRow = {
    accountNo: '',
    pavtiNo: '',
    date: '',
    name: '',
    item: '',
    goldRate: '',
    sodDate: '',
    divas: '',
    moparu: '',
    vayaj: '',
    address: '',
    signature: '',
    checkNo: '',
  };

  const [rows, setRows] = useState([{ ...emptyRow }]);

  // Add per-row loading state
  const [rowLoading, setRowLoading] = useState({});

  // Add state for check number dialog
  const [checkDialog, setCheckDialog] = useState({ open: false, rowIdx: null });
  const [checkNoInput, setCheckNoInput] = useState('');

  // Add state for row preview dialog
  const [previewDialog, setPreviewDialog] = useState({ open: false, rowIdx: null, data: null });
  const [previewData, setPreviewData] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);

  const columns = [
    { 
      field: 'name', 
      headerName: translations.customers.name, 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography>{toMarathiName(params.row.name)}</Typography>
        </Box>
      )
    },
    { 
      field: 'phone', 
      headerName: translations.customers.phone, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PhoneIcon sx={{ mr: 1, color: theme.palette.info.main }} />
          <Typography>{toMarathiName(params.row.phone)}</Typography>
        </Box>
      )
    },
    { 
      field: 'address', 
      headerName: translations.customers.address, 
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
          <Typography>{toMarathiName(params.row.address)}</Typography>
        </Box>
      )
    },
    { 
      field: 'aadharNumber', 
      headerName: translations.customers.aadharNumber, 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BadgeIcon sx={{ mr: 1, color: theme.palette.success.main }} />
          <Typography>{toMarathiName(params.row.aadharNumber)}</Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'क्रिया',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Tooltip title={translations.common.edit}>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{ 
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={translations.common.delete}>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{ 
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchShops();
    
    // Removed subscribeToCustomers real-time listener as it is not available
    // return () => { if (unsubscribe) { unsubscribe(); } };
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchTableData(selectedShop, selectedMonth);
    } else {
      setRows([{ ...emptyRow }]);
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

  const fetchTableData = async (shopName, month = selectedMonth) => {
    setLoading(true);
    try {
      const response = await getTableData(shopName, month); // Pass month
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        setRows(response.data);
      } else {
        setRows([{ ...emptyRow }]);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'डेटा मिळवताना त्रुटी आली', severity: 'error' });
      setRows([{ ...emptyRow }]);
    } finally {
      setLoading(false);
    }
  };

  const handleShopChange = async (event) => {
    const shopName = event.target.value;
    setSelectedShop(shopName);
    localStorage.setItem('currentShop', shopName);
    if (shopName) {
      await fetchTableData(shopName);
    } else {
      setRows([{ ...emptyRow }]);
    }
  };

  const handleClickOpen = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      aadharNumber: '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? toMarathiName(value) : value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let response;
      
      if (formData.id) {
        // Update existing customer
        response = await updateCustomer(selectedShop, formData.id, formData);
      } else {
        // Add new customer
        response = await addCustomer(selectedShop, formData);
      }

      if (response.success) {
        setSnackbar({
          open: true,
          message: formData.id ? translations.customers.updateSuccess : translations.customers.addSuccess,
          severity: 'success',
        });
        handleClose();
        fetchTableData(selectedShop); // Refresh the customer list
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(translations.common.confirmDelete)) {
      try {
        setLoading(true);
        const response = await deleteCustomer(selectedShop, id);
        if (response.success) {
          setSnackbar({
            open: true,
            message: translations.customers.deleteSuccess,
            severity: 'success',
          });
          fetchTableData(selectedShop); // Refresh the customer list
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        setSnackbar({
          open: true,
          message: translations.common.error,
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePrint = () => {
    const headings = [
      'अ क्र', 'खाते क्र', 'पावती क्र', 'दिनांक', 'नावं', 'वस्तू', 'रुपये', 'सोड दि', 'दिवस', 'सो पा क्र', 'व्याज', 'पत्ता', 'की पा', 'ख पा', 'सही'
    ];

    const marathiMonths = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
    let monthDisplay = '';
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthDisplay = `महिना: ${marathiMonths[monthIdx]} ${toMarathiNumber(year)}`;
      }
    }
    const printContent = `
      <div style="padding: 0;">
        <h2 class="print-title" style="text-align: center; margin: 0 0 10px 0;">${toMarathiName(selectedShop)}</h2>
         <div style="text-align: center; font-size: 20px; margin-bottom: 10px;">${monthDisplay}</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr>
              ${headings.map(h => h === 'सही'
                ? `<th style="border: 1px solid #000; padding: 4px; text-align: center; width: 120px; min-width: 120px;">${h}</th>`
                : `<th style="border: 1px solid #000; padding: 4px; text-align: center;">${h}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, idx) => `
              <tr>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toMarathiNumber(idx + 1)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.accountNo || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.pavtiNo || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toMarathiDate(row.date)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.name || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.item || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${row.goldRate || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toMarathiDate(row.sodDate)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">  ${toMarathiNumber(row.divas || '')}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${row.moparu || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${row.vayaj || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${row.address || ''}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center; width: 120px; min-width: 120px;"></td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="6" style="font-weight:bold; background:#f5f5f5; text-align:center;">एकूण</td>
              <td style="font-weight:bold; background:#f5f5f5; text-align:right;">${toMarathiNumber(rows.reduce((sum, row) => sum + marathiToNumber(row.goldRate), 0))}</td>
              <td></td>
              <td></td>
              <td></td>
              <td style="font-weight:bold; background:#f5f5f5; text-align:right;">${toMarathiNumber(rows.reduce((sum, row) => sum + marathiToNumber(row.vayaj), 0))}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <style>
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-title {
            margin-top: 0 !important;
            margin-bottom: 0.5em !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            font-size: 10px !important;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; break-inside: avoid; }
        }
      </style>
    `;

    const printWindow = window.open('', 'printWindow');
    printWindow.document.write(`
      <html>
        <head>
        <title>Customers - ${selectedShop}</title>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleCopy = () => {
    setSnackbar({ open: true, message: 'कृपया कॉपी करण्यासाठी पंक्ती निवडा', severity: 'info' });
  };

  const handleCopyRow = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row || (!row.date && !row.sodDate)) {
      setSnackbar({ open: true, message: 'कॉपी करण्यासाठी वैध पंक्ती नाही', severity: 'warning' });
      return;
    }

    const rowData = [
      row.accountNo || '',
      row.pavtiNo || '',
      toMarathiDate(row.date || ''),
      row.name || '',
      row.item || '',
      row.goldRate || '',
      toMarathiDate(row.sodDate || ''),
      toMarathiNumber(row.divas || ''),
      row.moparu || '',
      row.vayaj || '',
      row.address || '',
      row.signature || '',
    ].join('\t');

    navigator.clipboard.writeText(rowData).then(() => {
      setSnackbar({ open: true, message: `पंक्ती ${rowIndex + 1} यशस्वीरित्या कॉपी झाली!`, severity: 'success' });
    }).catch(err => {
      console.error('Failed to copy row: ', err);
      setSnackbar({ open: true, message: 'पंक्ती कॉपी करताना त्रुटी आली', severity: 'error' });
    });
  };

  const handlePreviewRow = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row) {
      setSnackbar({ open: true, message: 'प्रीव्ह्यू करण्यासाठी वैध पंक्ती नाही', severity: 'warning' });
      return;
    }

    const previewRowData = {
      accountNo: row.accountNo || '',
      pavtiNo: row.pavtiNo || '',
      date: toDDMMYYYY(row.date || ''),
      name: row.name || '',
      item: row.item || '',
      goldRate: row.goldRate || '',
      sodDate: toDDMMYYYY(row.sodDate || ''),
      divas: row.divas || '',
      moparu: row.moparu || '',
      vayaj: row.vayaj || '',
      address: row.address || '',
      signature: row.signature || '',
    };

    setPreviewData(previewRowData);
    setPreviewDialog({ open: true, rowIdx: rowIndex, data: previewRowData });
  };

  const handlePaste = async () => {
    setSnackbar({ open: true, message: 'कृपया पेस्ट करण्यासाठी पंक्ती निवडा', severity: 'info' });
  };

  const handlePasteRow = async (rowIndex) => {
    if (!selectedShop) {
      setSnackbar({ open: true, message: 'कृपया आधी दुकान निवडा', severity: 'warning' });
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setSnackbar({ open: true, message: 'क्लिपबोर्डमध्ये पेस्ट करण्यासाठी डेटा नाही', severity: 'warning' });
        return;
      }

      // Detect separator: tab or comma
      const sep = text.includes('\t') ? '\t' : ',';
      const columns = text.trim().split(sep);
      
      if (columns.length === 0) {
        setSnackbar({ open: true, message: 'क्लिपबोर्डमध्ये पेस्ट करण्यासाठी डेटा नाही', severity: 'warning' });
        return;
      }

      // Define the exact order you want
      const fieldOrder = [
        'accountNo',    // 1. खाते क्र.
        'pavtiNo',      // 2. पावती क्र.
        'date',         // 3. दिनांक
        'name',         // 4. नावं
        'item',         // 5. वस्तू
        'goldRate',     // 6. रुपये
        'sodDate',      // 7. सोड दि
        'divas',        // 8. दिवस
        'moparu',       // 9. सो पा क्र
        'vayaj',        // 10. व्याज
        'address',      // 11. पत्ता
        'signature'     // 12. सही (optional)
      ];

      // Create row data from pasted columns in the specified order
      const row = { ...emptyRow };
      fieldOrder.forEach((field, index) => {
        if (columns[index]) {
          let val = columns[index].trim().replace(/"/g, '');
          
          // Convert dates to dd-mm-yyyy format
          if (field === 'date' || field === 'sodDate') {
            // If it's in yyyy-mm-dd format, convert to dd-mm-yyyy
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              const [yyyy, mm, dd] = val.split('-');
              val = `${dd}-${mm}-${yyyy}`;
            }
            // If it's in Marathi format, convert to dd-mm-yyyy
            else if (/[०१२३४५६७८९]/.test(val)) {
              val = toDDMMYYYY(fromMarathiDate(val));
            }
          }
          
          row[field] = val;
        }
      });

      // Update the specific row
      const updatedRows = [...rows];
      updatedRows[rowIndex] = row;
      setRows(updatedRows);
      
      setSnackbar({ open: true, message: `पंक्ती ${rowIndex + 1} मध्ये डेटा यशस्वीरित्या पेस्ट झाला!`, severity: 'success' });

    } catch (err) {
      console.error('Failed to paste row:', err);
      if (err.name === 'NotAllowedError') {
        setSnackbar({ open: true, message: 'क्लिपबोर्डवरून पेस्ट करण्याची परवानगी नाकारली', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'पंक्ती पेस्ट करताना त्रुटी आली', severity: 'error' });
      }
    }
  };

  const handlePreviewPaste = async (rowIndex) => {
    if (!selectedShop) {
      setSnackbar({ open: true, message: 'कृपया आधी दुकान निवडा', severity: 'warning' });
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setSnackbar({ open: true, message: 'क्लिपबोर्डमध्ये पेस्ट करण्यासाठी डेटा नाही', severity: 'warning' });
        return;
      }

      // Detect separator: tab or comma
      const sep = text.includes('\t') ? '\t' : ',';
      const columns = text.trim().split(sep);
      
      if (columns.length === 0) {
        setSnackbar({ open: true, message: 'क्लिपबोर्डमध्ये पेस्ट करण्यासाठी डेटा नाही', severity: 'warning' });
        return;
      }

      // Define the exact order you want
      const fieldOrder = [
        'accountNo',    // 1. खाते क्र.
        'pavtiNo',      // 2. पावती क्र.
        'date',         // 3. दिनांक
        'name',         // 4. नावं
        'item',         // 5. वस्तू
        'goldRate',     // 6. रुपये
        'sodDate',      // 7. सोड दि
        'divas',        // 8. दिवस
        'moparu',       // 9. सो पा क्र
        'vayaj',        // 10. व्याज
        'address',      // 11. पत्ता
        'signature'     // 12. सही (optional)
      ];

      // Create preview data from pasted columns in the specified order
      const previewRowData = {};
      fieldOrder.forEach((field, index) => {
        if (columns[index]) {
          let val = columns[index].trim().replace(/"/g, '');
          
          // Convert dates to dd-mm-yyyy format
          if (field === 'date' || field === 'sodDate') {
            // If it's in yyyy-mm-dd format, convert to dd-mm-yyyy
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              const [yyyy, mm, dd] = val.split('-');
              val = `${dd}-${mm}-${yyyy}`;
            }
            // If it's in Marathi format, convert to dd-mm-yyyy
            else if (/[०१२३४५६७८९]/.test(val)) {
              val = toDDMMYYYY(fromMarathiDate(val));
            }
          }
          
          previewRowData[field] = val;
        } else {
          previewRowData[field] = '';
        }
      });

      setPreviewData(previewRowData);
      setPreviewDialog({ open: true, rowIdx: rowIndex, data: previewRowData });

    } catch (err) {
      console.error('Failed to preview paste:', err);
      if (err.name === 'NotAllowedError') {
        setSnackbar({ open: true, message: 'क्लिपबोर्डवरून पेस्ट करण्याची परवानगी नाकारली', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'प्रीव्ह्यू पेस्ट करताना त्रुटी आली', severity: 'error' });
      }
    }
  };

  const handlePreviewDataChange = (field, value) => {
    setPreviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyPreview = () => {
    const updatedRows = [...rows];
    
    // Convert dates from dd-mm-yyyy to yyyy-mm-dd for storage
    const processedData = { ...previewData };
    if (processedData.date) {
      processedData.date = fromDDMMYYYY(processedData.date);
    }
    if (processedData.sodDate) {
      processedData.sodDate = fromDDMMYYYY(processedData.sodDate);
    }
    
    updatedRows[previewDialog.rowIdx] = { ...emptyRow, ...processedData };
    setRows(updatedRows);
    setPreviewDialog({ open: false, rowIdx: null, data: null });
    setPreviewData({});
    setSnackbar({ open: true, message: `पंक्ती ${previewDialog.rowIdx + 1} मध्ये डेटा यशस्वीरित्या लागू झाला!`, severity: 'success' });
  };

  const handleClosePreview = () => {
    setPreviewDialog({ open: false, rowIdx: null, data: null });
    setPreviewData({});
    setDraggedItem(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e, field) => {
    setDraggedItem(field);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetField) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetField) {
      const draggedValue = previewData[draggedItem];
      const targetValue = previewData[targetField];
      
      setPreviewData(prev => ({
        ...prev,
        [draggedItem]: targetValue,
        [targetField]: draggedValue
      }));
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Draggable field component
  const DraggableField = ({ field, label, value, onChange, type = "text", multiline = false, rows = 1 }) => {
    const isDragging = draggedItem === field;
    
    return (
      <Box
        draggable
        onDragStart={(e) => handleDragStart(e, field)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, field)}
        onDragEnd={handleDragEnd}
        sx={{
          p: 2,
          border: '2px dashed',
          borderColor: isDragging ? theme.palette.primary.main : 'transparent',
          backgroundColor: isDragging ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          borderRadius: 1,
          cursor: 'grab',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
          '&:active': {
            cursor: 'grabbing',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DragIndicatorIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
          <Typography variant="subtitle2" color="textSecondary">
            {label}
          </Typography>
        </Box>
        <TextField
          fullWidth
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          variant="outlined"
          size="small"
          type={type}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          InputLabelProps={type === "date" ? { shrink: true } : undefined}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
            }
          }}
        />
      </Box>
    );
  };

  // Helper to convert Marathi numerals to regular numbers
  function marathiToNumber(str) {
    if (!str) return 0;
    const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
    return parseFloat(String(str).split('').map(d => marathiDigits.includes(d) ? marathiDigits.indexOf(d) : d).join(''));
  }

  const calculateInterest = (amount, days) => {
    // Convert to numbers, handling both regular and Marathi numerals
    const principal = typeof amount === 'string' ? marathiToNumber(amount) : parseFloat(String(amount).replace(/[^\d.]/g, ''));
    const daysNum = parseInt(String(days).replace(/[^\d]/g, ''));
    const interestRate = parseFloat(settings.interestRate) || 2.5;

    if (isNaN(principal) || isNaN(daysNum) || isNaN(interestRate)) {
      return '०';
    }

    // Calculate interest: (Principal * Rate * Days) / (100 * 365)
    let interest = (principal * interestRate * daysNum) / (100 * 365);

    // Custom rounding: >= 0.5 round up, < 0.5 round down
    const decimal = interest - Math.floor(interest);
    if (decimal >= 0.5) {
      interest = Math.ceil(interest);
    } else {
      interest = Math.floor(interest);
    }

    // Convert to Marathi numerals
    return toMarathiNumber(interest);
  };

  // Helper to get previous months in 'YYYY-MM' format
  function getPreviousMonths(currentMonth, count = 12) {
    const months = [];
    let [year, month] = currentMonth.split('-').map(Number);
    for (let i = 1; i <= count; i++) {
      month -= 1;
      if (month === 0) {
        month = 12;
        year -= 1;
      }
      months.push(`${year}-${String(month).padStart(2, '0')}`);
    }
    return months;
  }

  // Search previous months for accountNo
  const findAccountInPreviousMonths = async (accountNo) => {
    if (!selectedShop || !accountNo) return null;
    const months = getPreviousMonths(selectedMonth, 12);
    for (const month of months) {
      try {
        const response = await getTableData(selectedShop, month);
        if (response.success && Array.isArray(response.data)) {
          const found = response.data.find(row => row.accountNo === accountNo);
          if (found) {
            return { name: found.name, address: found.address };
          }
        }
      } catch (e) {
        // Ignore errors for missing months
      }
    }
    return null;
  };

  // Remove accountNo lookup from handleCellChange
  const handleCellChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;

    // Calculate days if either date changes
    if (field === 'date' || field === 'sodDate') {
      const loanDate = updatedRows[index].date;
      const returnDate = updatedRows[index].sodDate;

      if (loanDate && returnDate) {
        const start = new Date(loanDate);
        const end = new Date(returnDate);
        
        // Calculate difference in days
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log('Date Calculation:', {
          कर्ज_दिनांक: loanDate,
          सोड_दिनांक: returnDate,
          दिवस: diffDays
        });
        
        // Update the days field
        updatedRows[index].divas = diffDays.toString();
        
        // Calculate interest automatically when days are updated
        if (updatedRows[index].goldRate) {
          console.log('Calculating interest after date change:', {
            मुदल: updatedRows[index].goldRate,
            दिवस: diffDays
          });
          const interest = calculateInterest(updatedRows[index].goldRate, diffDays);
          updatedRows[index].vayaj = interest;
        }
      }
    }

    // Calculate interest when amount changes
    if (field === 'goldRate') {
      const days = updatedRows[index].divas || '0';
      console.log('Calculating interest after amount change:', {
        मुदल: value,
        दिवस: days
      });
      const interest = calculateInterest(value, days);
      updatedRows[index].vayaj = interest;
      // Check if amount > 20000 (English or Marathi numerals)
      const goldRateNum = parseFloat(value) > 0 ? parseFloat(value) : marathiToNumber(value);
      if (goldRateNum > 20000) {
        setCheckDialog({ open: true, rowIdx: index });
        setCheckNoInput(updatedRows[index].checkNo || '');
      }
    }

    // Calculate interest when days change
    if (field === 'divas') {
      const amount = updatedRows[index].goldRate || '0';
      console.log('Calculating interest after days change:', {
        मुदल: amount,
        दिवस: value
      });
      const interest = calculateInterest(amount, value);
      updatedRows[index].vayaj = interest;
    }

    setRows(updatedRows);
  };

  // New handler for accountNo lookup on Enter
  const handleAccountNoLookup = async (index, value) => {
    setRowLoading(prev => ({ ...prev, [index]: true }));
    const updatedRows = [...rows];
    const prevData = await findAccountInPreviousMonths(value);
    if (prevData) {
      updatedRows[index].name = prevData.name;
      updatedRows[index].address = prevData.address;
      setSnackbar({ open: true, message: 'मागील महिन्यातील माहिती मिळाली.', severity: 'info' });
    } else {
      updatedRows[index].name = '';
      updatedRows[index].address = '';
      setSnackbar({ open: true, message: 'नवीन खाते क्र.', severity: 'info' });
    }
    setRows(updatedRows);
    setRowLoading(prev => ({ ...prev, [index]: false }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      if (selectedShop) {
        try {
          const response = await getShopSettings(selectedShop);
          if (response.success && response.data) {
            setSettings(response.data);
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }
      }
    };

    fetchSettings();
  }, [selectedShop]);

  // Add new row
  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  // Delete row
  const handleDeleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows.length ? updatedRows : [{ ...emptyRow }]);
  };

  // Save all rows to backend
  const handleSave = async () => {
    if (!selectedShop) {
      setSnackbar({ open: true, message: 'कृपया दुकान निवडा', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      // Filter out undefined/null/empty rows
      const validRows = rows.filter(
        row => row && (row.date || row.sodDate) // Only rows with at least one date
      );

      // Add validation for both Marathi and English numerals
      const invalidRow = rows.find(
        row => {
          const goldRateNum = parseFloat(row.goldRate) > 0 ? parseFloat(row.goldRate) : marathiToNumber(row.goldRate);
          return goldRateNum > 20000 && !row.checkNo;
        }
      );
      if (invalidRow) {
        setSnackbar({ open: true, message: '₹20,000 पेक्षा जास्त रक्कम असल्यास Check No आवश्यक आहे.', severity: 'error' });
        setLoading(false);
        return;
      }

      // Save all rows for the selected month
      const response = await saveTableData(selectedShop, selectedMonth, validRows);
      if (!response.success) {
        throw new Error(response.error || 'सेव्ह करताना त्रुटी आली');
      }

      setSnackbar({ open: true, message: 'डेटा सेव्ह झाला!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handler for submitting check number
  const handleCheckNoSubmit = () => {
    if (checkDialog.rowIdx !== null) {
      const updatedRows = [...rows];
      updatedRows[checkDialog.rowIdx].checkNo = checkNoInput;
      setRows(updatedRows);
    }
    setCheckDialog({ open: false, rowIdx: null });
    setCheckNoInput('');
  };

  // Handler for closing check dialog without saving
  const handleCheckNoCancel = () => {
    setCheckDialog({ open: false, rowIdx: null });
    setCheckNoInput('');
  };

  // Before the return statement, find the max moparu value (as number)
  const maxMoparu = Math.max(
    ...rows.map(row => {
      const val = row && row.moparu ? marathiToNumber(row.moparu) : 0;
      return isNaN(val) ? 0 : val;
    })
  );

  function toDDMMYYYY(dateStr) {
    if (!dateStr) return '';
    // If already in dd-mm-yyyy, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    // If in yyyy-mm-dd, convert
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      return `${dd}-${mm}-${yyyy}`;
    }
    return dateStr;
  }

  function fromDDMMYYYY(dateStr) {
    if (!dateStr) return '';
    // If already in yyyy-mm-dd, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // If in dd-mm-yyyy, convert
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split('-');
      return `${yyyy}-${mm}-${dd}`;
    }
    return dateStr;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Inject keyframes for blinking */}
      <style>{blinkKeyframes}</style>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        p: 2,
        borderRadius: 2,
      }}>

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
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            {translations.customers.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {selectedShop ? `${toMarathiName(selectedShop)} - ग्राहक व्यवस्थापन` : 'कृपया दुकान निवडा'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{translations.common.selectShop}</InputLabel>
            <Select
              value={selectedShop}
              onChange={handleShopChange}
              label={translations.common.selectShop}
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="">{translations.common.selectShop}</MenuItem>
              {shops.map((shop) => (
                <MenuItem key={shop.id} value={shop.name}>
                  {toMarathiName(shop.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
            disabled={loading || !selectedShop}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {translations.customers.addCustomer}
          </Button>
        </Box>
      </Box>

      {/* Search and Actions Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="ग्राहक शोधा..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="प्रिंट करा">
          <span>
            <IconButton 
              onClick={handlePrint}
              disabled={!selectedShop || rows.length === 0}
              sx={{ color: theme.palette.primary.main, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
            >
              <PrintIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="पंक्ती कॉपी/पेस्ट करण्यासाठी पंक्ती निवडा">
          <span>
            <IconButton
              onClick={handleCopy}
              disabled={!selectedShop}
              sx={{ color: theme.palette.info.main, '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) } }}
            >
              <ContentCopyIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="पंक्ती कॉपी/पेस्ट करण्यासाठी पंक्ती निवडा">
          <span>
            <IconButton
              onClick={handlePaste}
              disabled={!selectedShop}
              sx={{ color: theme.palette.info.main, '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) } }}
            >
              <ContentPasteIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="रिफ्रेश करा">
          <span>
            <IconButton 
              onClick={() => fetchTableData(selectedShop)}
              disabled={!selectedShop}
              sx={{ 
                color: theme.palette.info.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Customers Grid */}
      <Card elevation={3}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : !selectedShop ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <Typography variant="h6" color="textSecondary">
                {translations.common.pleaseSelectShop}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', width: '100%', background: 'white' }}>
              <Table className="ledger-table" sx={{ minWidth: 1800 }}>
                <TableHead>
                  <TableRow>
                    {headings.map((heading, idx) => (
                      <TableCell key={idx} align="center" sx={{ fontWeight: 'bold' }}>{heading}</TableCell>
                    ))}
                    <TableCell align="center">क्रिया</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => {
                    if (!row) return null; // Skip undefined/null rows
                    // const goldRateNum = parseFloat(row.goldRate) > 0 ? parseFloat(row.goldRate) : marathiToNumber(row.goldRate);
                    return (
                      <TableRow key={idx}>
                        <TableCell align="center">{toMarathiNumber(idx + 1)}</TableCell>
                        <TableCell align="center">
                          <TextField
                            value={row.accountNo || ''}
                            onChange={e => {
                              const updatedRows = [...rows];
                              updatedRows[idx].accountNo = e.target.value;
                              setRows(updatedRows);
                            }}
                            onKeyDown={async e => {
                              if (e.key === 'Enter') {
                                await handleAccountNoLookup(idx, e.target.value);
                              }
                            }}
                            variant="standard"
                            InputProps={{
                              endAdornment: rowLoading[idx] ? <CircularProgress size={16} /> : null,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            value={row.pavtiNo}
                            onChange={e => handleCellChange(idx, 'pavtiNo', e.target.value)}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="date"
                            value={row.date}
                            onChange={e => handleCellChange(idx, 'date', e.target.value)}
                            variant="standard"
                          />
                          <div style={{ fontSize: '0.85em', color: '#888' }}>
                            {toMarathiDate(row.date)}
                          </div>
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                          <TextField
                            value={row.name}
                            onChange={e => handleCellChange(idx, 'name', e.target.value)}
                            variant="standard"
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">श्री</InputAdornment>,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                          <TextField
                            value={row.item}
                            onChange={e => handleCellChange(idx, 'item', e.target.value)}
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            value={row.goldRate}
                            onChange={e => handleCellChange(idx, 'goldRate', e.target.value)}
                            variant="standard"
                          />
                        </TableCell>
                        {/* Remove Check No cell */}
                        <TableCell align="center">
                          <TextField
                            type="date"
                            value={row.sodDate}
                            onChange={e => handleCellChange(idx, 'sodDate', e.target.value)}
                            variant="standard"
                          />
                          <div style={{ fontSize: '0.85em', color: '#888' }}>
                            {toMarathiDate(row.sodDate)}
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            value={row.divas}
                            onChange={e => handleCellChange(idx, 'divas', e.target.value)}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            value={row.moparu}
                            onChange={e => handleCellChange(idx, 'moparu', e.target.value)}
                            variant="standard"
                            // Add blinking style if this is the max
                            InputProps={{
                              style: marathiToNumber(row.moparu) === maxMoparu && maxMoparu > 0 ? blinkStyle : undefined,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            value={row.vayaj}
                            onChange={e => handleCellChange(idx, 'vayaj', e.target.value)}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                          <TextField
                            value={row.address}
                            onChange={e => handleCellChange(idx, 'address', e.target.value)}
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 180, maxWidth: 300 }}>
                          <TextField
                            value={row.signature}
                            onChange={e => handleCellChange(idx, 'signature', e.target.value)}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="पंक्ती प्रीव्ह्यू करा">
                              <IconButton 
                                size="small"
                                onClick={() => handlePreviewRow(idx)}
                                sx={{ 
                                  color: theme.palette.info.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                                  }
                                }}
                              >
                                <SearchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="पंक्ती कॉपी करा">
                              <IconButton 
                                size="small"
                                onClick={() => handleCopyRow(idx)}
                                sx={{ 
                                  color: theme.palette.success.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                                  }
                                }}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="प्रीव्ह्यू सह पेस्ट करा">
                              <IconButton 
                                size="small"
                                onClick={() => handlePreviewPaste(idx)}
                                sx={{ 
                                  color: theme.palette.warning.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                  }
                                }}
                              >
                                <ContentPasteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="पंक्ती हटवा">
                              <IconButton 
                                size="small"
                                color="error" 
                                onClick={() => handleDeleteRow(idx)}
                                sx={{ 
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PersonIcon />
          {formData.id ? translations.common.edit : translations.customers.addCustomer}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MarathiTransliterator
                label={translations.customers.name}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={translations.customers.phone}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={translations.customers.address}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={translations.customers.aadharNumber}
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.1),
              }
            }}
          >
            {translations.common.cancel}
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {translations.common.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check No Dialog */}
      <Dialog open={checkDialog.open} onClose={handleCheckNoCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Check No आवश्यक आहे</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Check No"
            type="text"
            fullWidth
            value={checkNoInput}
            onChange={e => setCheckNoInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCheckNoCancel}>रद्द करा</Button>
          <Button onClick={handleCheckNoSubmit} variant="contained">जतन करा</Button>
        </DialogActions>
      </Dialog>

      {/* Row Preview Dialog */}
      <Dialog open={previewDialog.open} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.info.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SearchIcon />
          पंक्ती प्रीव्ह्यू आणि संपादन
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textAlign: 'center' }}>
            डेटा फील्ड्स ड्रॅग करून पुनर्व्यवस्थित करा आणि संपादित करा
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="accountNo"
                label="खाते क्र."
                value={previewData.accountNo || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="pavtiNo"
                label="पावती क्र."
                value={previewData.pavtiNo || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="date"
                label="दिनांक"
                value={toDDMMYYYY(previewData.date) || ''}
                onChange={(field, value) => handlePreviewDataChange(field, value)}
                type="text"
                placeholder="dd-mm-yyyy"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="name"
                label="नाव"
                value={previewData.name || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="item"
                label="वस्तू"
                value={previewData.item || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="goldRate"
                label="रुपये"
                value={previewData.goldRate || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="sodDate"
                label="सोड दि"
                value={toDDMMYYYY(previewData.sodDate) || ''}
                onChange={(field, value) => handlePreviewDataChange(field, value)}
                type="text"
                placeholder="dd-mm-yyyy"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="divas"
                label="दिवस"
                value={previewData.divas || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="moparu"
                label="सो पा क्र"
                value={previewData.moparu || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DraggableField
                field="vayaj"
                label="व्याज"
                value={previewData.vayaj || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <DraggableField
                field="address"
                label="पत्ता"
                value={previewData.address || ''}
                onChange={handlePreviewDataChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <DraggableField
                field="signature"
                label="सही"
                value={previewData.signature || ''}
                onChange={handlePreviewDataChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClosePreview}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.1),
              }
            }}
          >
            रद्द करा
          </Button>
          <Button 
            onClick={handleApplyPreview} 
            variant="contained"
            sx={{
              backgroundColor: theme.palette.success.main,
              '&:hover': {
                backgroundColor: theme.palette.success.dark,
              },
            }}
          >
            लागू करा
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRow} disabled={!selectedShop}>नवीन पंक्ति जोडा</Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!selectedShop || loading}>सेव्ह करा</Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Customers; 