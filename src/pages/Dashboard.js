import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { getCustomers, getLoans, getAllShops } from '../firebase/services';
import { translations, formatMarathiCurrency, formatMarathiDate, toMarathiText } from '../utils/translations';

function Dashboard() {
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
      const [customersResponse, loansResponse] = await Promise.all([
        getCustomers(shopName),
        getLoans(shopName)
      ]);

      if (customersResponse.success && loansResponse.success) {
        const customers = customersResponse.data || {};
        const loans = loansResponse.data || {};
        
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
            customerName: toMarathiText(customers[loan.customerId]?.name || 'Unknown Customer')
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setDashboardData({
          totalCustomers,
          activeLoans,
          totalLoanAmount,
          overdueLoans,
          recentActivities,
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
      color: '#1976d2',
    },
    {
      title: translations.dashboard.activeLoans,
      value: dashboardData.activeLoans,
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: translations.dashboard.todayRepayment,
      value: formatMarathiCurrency(0),
      icon: <PaymentIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: translations.dashboard.overdueLoans,
      value: dashboardData.overdueLoans,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ];

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          {translations.dashboard.title}
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{translations.common.selectShop}</InputLabel>
          <Select
            value={selectedShop}
            onChange={handleShopChange}
            label={translations.common.selectShop}
          >
            <MenuItem value="">{translations.common.selectShop}</MenuItem>
            {shops.map((shop) => (
              <MenuItem key={shop.id} value={shop.name}>
                {toMarathiText(shop.name)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!selectedShop ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6" color="textSecondary">
            {translations.common.pleaseSelectShop}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 140,
                    bgcolor: stat.color,
                    color: 'white',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4">
                        {stat.value}
                      </Typography>
                    </Box>
                    {stat.icon}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {translations.dashboard.recentActivities}
                </Typography>
                <List>
                  {dashboardData.recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem>
                        <ListItemText
                          primary={activity.description}
                          secondary={`${activity.customerName} - ${formatMarathiDate(activity.date)}`}
                        />
                      </ListItem>
                      {index < dashboardData.recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {translations.dashboard.overdueLoans}
                </Typography>
                <List>
                  {dashboardData.overdueLoans > 0 ? (
                    <ListItem>
                      <ListItemText
                        primary={`${dashboardData.overdueLoans} ${translations.dashboard.overdueLoans}`}
                        secondary={translations.dashboard.takeAction}
                      />
                    </ListItem>
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary={translations.dashboard.noOverdueLoans}
                        secondary={translations.dashboard.allLoansActive}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
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