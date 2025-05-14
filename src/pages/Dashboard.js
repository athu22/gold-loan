import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
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
  Button,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { getCustomers, getLoans, getAllShops, getRepayments, getShopSettings } from '../firebase/services';
import { translations, formatMarathiCurrency, formatMarathiDate, toMarathiName } from '../utils/translations';

function Dashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    activeLoans: 0,
    totalLoanAmount: 0,
    overdueLoans: 0,
    recentActivities: [],
  });
  const [reportData, setReportData] = useState({
    customerLoans: [],
    shopSummary: {
      totalGoldWeight: 0,
      totalLoaned: 0,
      totalInterest: 0,
      totalCollected: 0,
      totalDue: 0,
    }
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error',
  });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await getAllShops();
      if (response.success) {
        const shopsArray = Object.entries(response.data || {}).map(([id, data]) => ({
          id,
          name: data.shopName,
        }));
        setShops(shopsArray);
        
        // If there's a saved shop, select it
        const savedShop = localStorage.getItem('currentShop');
        if (savedShop && shopsArray.some(shop => shop.name === savedShop)) {
          setSelectedShop(savedShop);
          fetchDashboardData(savedShop);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
      setLoading(false);
    }
  };

  const handleShopChange = async (event) => {
    const shopName = event.target.value;
    setSelectedShop(shopName);
    localStorage.setItem('currentShop', shopName);
    if (shopName) {
      await fetchDashboardData(shopName);
    } else {
      setDashboardData({
        totalCustomers: 0,
        activeLoans: 0,
        totalLoanAmount: 0,
        overdueLoans: 0,
        recentActivities: [],
      });
    }
  };

  const fetchDashboardData = async (shopName) => {
    try {
      setLoading(true);
      const [customersResponse, loansResponse, settingsResponse] = await Promise.all([
        getCustomers(shopName),
        getLoans(shopName),
        getShopSettings(shopName)
      ]);

      if (customersResponse.success && loansResponse.success && settingsResponse.success) {
        const customers = customersResponse.data || {};
        const loans = loansResponse.data || {};
        const settings = settingsResponse.data || { interestRate: 2.5 };
        
        // Calculate metrics
        const totalCustomers = Object.keys(customers).length;
        const activeLoans = Object.values(loans).filter(loan => loan.status === 'active').length;
        const totalLoanAmount = Object.values(loans)
          .filter(loan => loan.status === 'active')
          .reduce((sum, loan) => sum + (parseFloat(loan.loanAmount) || 0), 0);
        
        // Calculate overdue loans
        const today = new Date();
        const overdueLoans = Object.values(loans).filter(loan => {
          if (loan.status !== 'active') return false;
          const endDate = new Date(loan.endDate);
          return endDate < today;
        }).length;

        // Prepare recent activities
        const recentActivities = Object.entries(loans)
          .map(([id, loan]) => ({
            id,
            type: 'loan',
            date: loan.startDate,
            description: `नवीन कर्ज: ${formatMarathiCurrency(loan.loanAmount)}`,
            customerName: toMarathiName(customers[loan.customerId]?.name || 'Unknown Customer')
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        // Prepare report data
        const loansArray = await Promise.all(
          Object.entries(loans).map(async ([id, loan]) => {
            const repaymentsResponse = await getRepayments(shopName, id);
            const repayments = repaymentsResponse.success ? 
              Object.entries(repaymentsResponse.data || {}).map(([id, data]) => ({ id, ...data })) : [];
            
            const totalPaid = repayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
            const principal = parseFloat(loan.loanAmount || 0);
            const interestRate = parseFloat(settings.interestRate || 0) / 100;
            const startDate = new Date(loan.startDate);
            const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                             (today.getMonth() - startDate.getMonth());
            const interest = principal * interestRate * (monthsDiff / 12);
            const remainingBalance = principal + interest - totalPaid;

            return {
              id,
              ...loan,
              customerName: loan.customerName || customers[loan.customerId]?.name || 'Unknown Customer',
              phone: customers[loan.customerId]?.phone || '-',
              repayments,
              totalPaid,
              interest,
              remainingBalance
            };
          })
        );

        // Calculate shop summary
        const shopSummary = {
          totalGoldWeight: loansArray.reduce((sum, loan) => sum + (parseFloat(loan.goldWeight) || 0), 0),
          totalLoaned: loansArray.reduce((sum, loan) => sum + (parseFloat(loan.loanAmount) || 0), 0),
          totalInterest: loansArray.reduce((sum, loan) => sum + (loan.interest || 0), 0),
          totalCollected: loansArray.reduce((sum, loan) => sum + (loan.totalPaid || 0), 0),
          totalDue: loansArray.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0),
        };

        setDashboardData({
          totalCustomers,
          activeLoans,
          totalLoanAmount,
          overdueLoans,
          recentActivities,
        });

        setReportData({
          customerLoans: loansArray,
          shopSummary
        });
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setSnackbar({
        open: true,
        message: translations.common.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: translations.dashboard.totalCustomers,
      value: dashboardData.totalCustomers,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: translations.dashboard.activeLoans,
      value: dashboardData.activeLoans,
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
      trend: '+5%',
      trendUp: true,
    },
    {
      title: translations.dashboard.todayRepayment,
      value: formatMarathiCurrency(0),
      icon: <PaymentIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
      trend: '-2%',
      trendUp: false,
    },
    {
      title: translations.dashboard.overdueLoans,
      value: dashboardData.overdueLoans,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.error.main,
      trend: '-8%',
      trendUp: true,
    },
  ];

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px;">${toMarathiName(selectedShop)} - ग्राहक अहवाल</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; border: 1px solid #ddd;">नाव</th>
              <th style="padding: 8px; border: 1px solid #ddd;">फोन</th>
              <th style="padding: 8px; border: 1px solid #ddd;">कर्ज रक्कम</th>
              <th style="padding: 8px; border: 1px solid #ddd;">एकूण परतफेड</th>
              <th style="padding: 8px; border: 1px solid #ddd;">बाकी रक्कम</th>
              <th style="padding: 8px; border: 1px solid #ddd;">एकूण व्याज</th>
              <th style="padding: 8px; border: 1px solid #ddd;">सोने वजन (ग्राम)</th>
              <th style="padding: 8px; border: 1px solid #ddd;">सोने शुद्धता</th>
              <th style="padding: 8px; border: 1px solid #ddd;">स्थिती</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.customerLoans.map(loan => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${toMarathiName(loan.customerName)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${toMarathiName(loan.phone)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formatMarathiCurrency(loan.loanAmount)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formatMarathiCurrency(loan.totalPaid)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formatMarathiCurrency(loan.remainingBalance)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formatMarathiCurrency(loan.interest)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${loan.goldWeight || '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${loan.goldPurity || '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${loan.status === 'closed' ? 'बंद' : 'चालू'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right;">
          <p>प्रिंट तारीख: ${formatMarathiDate(new Date().toISOString())}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${toMarathiName(selectedShop)} - ग्राहक अहवाल</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; }
              th { background-color: #f5f5f5; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            {translations.dashboard.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {selectedShop ? `${toMarathiName(selectedShop)} - डॅशबोर्ड` : 'कृपया दुकान निवडा'}
          </Typography>
        </Box>
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
      </Box>

      {!selectedShop ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
        }}>
          <Typography variant="h6" color="textSecondary">
            {translations.common.pleaseSelectShop}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  elevation={3}
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {stat.value}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon 
                            sx={{ 
                              color: stat.trendUp ? theme.palette.success.main : theme.palette.error.main,
                              transform: stat.trendUp ? 'none' : 'rotate(180deg)',
                              mr: 1 
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: stat.trendUp ? theme.palette.success.main : theme.palette.error.main 
                            }}
                          >
                            {stat.trend}
                          </Typography>
                        </Box>
                      </Box>
                      <Box 
                        sx={{ 
                          backgroundColor: alpha(stat.color, 0.1),
                          p: 1,
                          borderRadius: 2,
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Recent Activities and Overdue Loans */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={8}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {translations.dashboard.recentActivities}
                    </Typography>
                    <Button 
                      endIcon={<ArrowForwardIcon />}
                      color="primary"
                    >
                      सर्व पहा
                    </Button>
                  </Box>
                  <List>
                    {dashboardData.recentActivities.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem 
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              borderRadius: 1,
                            },
                          }}
                        >
                          <ListItemIcon>
                            <PaymentIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.description}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Typography variant="body2" color="textSecondary">
                                  {activity.customerName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mx: 1 }}>
                                  •
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {formatMarathiDate(activity.date)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < dashboardData.recentActivities.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {translations.dashboard.overdueLoans}
                  </Typography>
                  <List>
                    {dashboardData.overdueLoans > 0 ? (
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6" color="error">
                              {dashboardData.overdueLoans} {translations.dashboard.overdueLoans}
                            </Typography>
                          }
                          secondary={translations.dashboard.takeAction}
                        />
                      </ListItem>
                    ) : (
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={translations.dashboard.noOverdueLoans}
                          secondary={translations.dashboard.allLoansActive}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Customer Report Section */}
          <Box sx={{ mt: 4 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ग्राहक अहवाल
                  </Typography>
                  <Button 
                    startIcon={<PrintIcon />}
                    variant="outlined"
                    onClick={handlePrint}
                  >
                    प्रिंट करा
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>नाव</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>फोन</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>कर्ज रक्कम</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>एकूण परतफेड</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>बाकी रक्कम</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>एकूण व्याज</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>सोने वजन (ग्राम)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>सोने शुद्धता</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>स्थिती</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.customerLoans.map((loan) => (
                        <TableRow 
                          key={loan.id}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <TableCell>{toMarathiName(loan.customerName)}</TableCell>
                          <TableCell>{toMarathiName(loan.phone)}</TableCell>
                          <TableCell>{formatMarathiCurrency(loan.loanAmount)}</TableCell>
                          <TableCell>{formatMarathiCurrency(loan.totalPaid)}</TableCell>
                          <TableCell>{formatMarathiCurrency(loan.remainingBalance)}</TableCell>
                          <TableCell>{formatMarathiCurrency(loan.interest)}</TableCell>
                          <TableCell>{loan.goldWeight || '-'}</TableCell>
                          <TableCell>{loan.goldPurity || '-'}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                backgroundColor: loan.status === 'closed' 
                                  ? alpha(theme.palette.error.main, 0.1)
                                  : alpha(theme.palette.success.main, 0.1),
                                color: loan.status === 'closed'
                                  ? theme.palette.error.main
                                  : theme.palette.success.main,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'inline-block',
                              }}
                            >
                              {loan.status === 'closed' ? 'बंद' : 'चालू'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Shop Report Section */}
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              दुकान अहवाल
            </Typography>
            <Grid container spacing={3}>
              {[
                {
                  title: 'एकूण सोने वजन',
                  value: `${reportData.shopSummary.totalGoldWeight.toFixed(2)} ग्राम`,
                  icon: <AttachMoneyIcon />,
                  color: theme.palette.primary.main,
                },
                {
                  title: 'एकूण कर्ज रक्कम',
                  value: formatMarathiCurrency(reportData.shopSummary.totalLoaned),
                  icon: <AccountBalanceIcon />,
                  color: theme.palette.success.main,
                },
                {
                  title: 'एकूण व्याज',
                  value: formatMarathiCurrency(reportData.shopSummary.totalInterest),
                  icon: <TrendingUpIcon />,
                  color: theme.palette.warning.main,
                },
                {
                  title: 'एकूण वसूल',
                  value: formatMarathiCurrency(reportData.shopSummary.totalCollected),
                  icon: <PaymentIcon />,
                  color: theme.palette.info.main,
                },
                {
                  title: 'एकूण बाकी',
                  value: formatMarathiCurrency(reportData.shopSummary.totalDue),
                  icon: <ScheduleIcon />,
                  color: theme.palette.error.main,
                },
              ].map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    elevation={3}
                    sx={{
                      height: '100%',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box 
                          sx={{ 
                            backgroundColor: alpha(item.color, 0.1),
                            p: 1,
                            borderRadius: 2,
                            mr: 2,
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Typography variant="h6" color="textSecondary">
                          {item.title}
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {item.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
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

export default Dashboard; 