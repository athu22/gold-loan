import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  push, 
  query, 
  orderByChild,
  equalTo 
} from 'firebase/database';
import { database } from './config';

// Marathi translations
const translations = {
  status: {
    active: 'सक्रिय',
    closed: 'बंद',
    pending: 'प्रलंबित'
  },
  errors: {
    saveSettings: 'दुकान सेटिंग्ज सेव्ह करताना त्रुटी',
    getSettings: 'दुकान सेटिंग्ज मिळवताना त्रुटी',
    addCustomer: 'ग्राहक जोडताना त्रुटी',
    updateCustomer: 'ग्राहक अपडेट करताना त्रुटी',
    deleteCustomer: 'ग्राहक हटवताना त्रुटी',
    getCustomers: 'ग्राहक मिळवताना त्रुटी',
    addLoan: 'कर्ज जोडताना त्रुटी',
    updateLoan: 'कर्ज अपडेट करताना त्रुटी',
    getLoans: 'कर्ज मिळवताना त्रुटी',
    addRepayment: 'परतफेड जोडताना त्रुटी',
    getRepayments: 'परतफेड मिळवताना त्रुटी',
    getDailyReport: 'दैनिक अहवाल मिळवताना त्रुटी',
    getMonthlyReport: 'मासिक अहवाल मिळवताना त्रुटी',
    createBackup: 'बॅकअप तयार करताना त्रुटी',
    restoreBackup: 'बॅकअप पुनर्संचयित करताना त्रुटी'
  }
};

// Shop Settings
export const saveShopSettings = async (settings) => {
  try {
    if (!settings.shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = settings.shopName.toLowerCase().replace(/\s+/g, '_');
    const shopRef = ref(database, `shops/${shopKey}`);
    await set(shopRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
};

export const getShopSettings = async (shopName) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const shopRef = ref(database, `shops/${shopKey}`);
    const snapshot = await get(shopRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { success: false, error: error.message };
  }
};

// Customers
export const addCustomer = async (shopName, customerData) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const customersRef = ref(database, `shops/${shopKey}/customers`);
    
    // Get the current customers to determine the next ID
    const snapshot = await get(customersRef);
    let nextId = 1;
    
    if (snapshot.exists()) {
      const customers = snapshot.val();
      // Find the highest existing ID
      const existingIds = Object.keys(customers).map(id => parseInt(id) || 0);
      nextId = Math.max(...existingIds, 0) + 1;
    }

    // Create a new customer with the numeric ID as the key
    const customerRef = ref(database, `shops/${shopKey}/customers/${nextId}`);
    await set(customerRef, {
      ...customerData,
      createdAt: new Date().toISOString()
    });

    return { 
      success: true, 
      id: nextId.toString()
    };
  } catch (error) {
    console.error('Error adding customer:', error);
    return { success: false, error: error.message };
  }
};

export const updateCustomer = async (shopName, customerId, customerData) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    await update(ref(database, `shops/${shopKey}/customers/${customerId}`), {
      ...customerData,
      language: 'mr',
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error(translations.errors.updateCustomer, error);
    return { success: false, error: translations.errors.updateCustomer };
  }
};

export const deleteCustomer = async (shopName, customerId) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    await remove(ref(database, `shops/${shopKey}/customers/${customerId}`));
    return { success: true };
  } catch (error) {
    console.error(translations.errors.deleteCustomer, error);
    return { success: false, error: translations.errors.deleteCustomer };
  }
};

export const getCustomers = async (shopName) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const customersRef = ref(database, `shops/${shopKey}/customers`);
    const snapshot = await get(customersRef);
    if (snapshot.exists()) {
      // Convert the data to include the numeric ID
      const customers = snapshot.val();
      const formattedCustomers = Object.entries(customers).map(([id, data]) => ({
        id,
        ...data
      }));
      return { success: true, data: formattedCustomers };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting customers:', error);
    return { success: false, error: error.message };
  }
};

// Loans
export const addLoan = async (shopName, loanData) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const loansRef = ref(database, `shops/${shopKey}/loans`);
    const newLoanRef = push(loansRef);
    await set(newLoanRef, {
      ...loanData,
      createdAt: new Date().toISOString(),
      id: newLoanRef.key,
      status: 'active'
    });
    return { success: true, id: newLoanRef.key };
  } catch (error) {
    console.error('Error adding loan:', error);
    return { success: false, error: error.message };
  }
};

export const updateLoan = async (shopName, loanId, updates) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const loanRef = ref(database, `shops/${shopKey}/loans/${loanId}`);
    await update(loanRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating loan:', error);
    return { success: false, error: error.message };
  }
};

export const getLoans = async (shopName) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const loansRef = ref(database, `shops/${shopKey}/loans`);
    const snapshot = await get(loansRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: {} };
  } catch (error) {
    console.error('Error getting loans:', error);
    return { success: false, error: error.message };
  }
};

// Repayments
export const addRepayment = async (shopName, loanId, repaymentData) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const repaymentsRef = ref(database, `shops/${shopKey}/loans/${loanId}/repayments`);
    const newRepaymentRef = push(repaymentsRef);
    await set(newRepaymentRef, {
      ...repaymentData,
      createdAt: new Date().toISOString(),
      id: newRepaymentRef.key
    });
    return { success: true, id: newRepaymentRef.key };
  } catch (error) {
    console.error('Error adding repayment:', error);
    return { success: false, error: error.message };
  }
};

export const getRepayments = async (shopName, loanId) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const snapshot = await get(ref(database, `shops/${shopKey}/loans/${loanId}/repayments`));
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error(translations.errors.getRepayments, error);
    return { success: false, error: translations.errors.getRepayments };
  }
};

// Reports
export const getDailyReport = async (date) => {
  try {
    const snapshot = await get(ref(database, 'reports/daily/' + date));
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error(translations.errors.getDailyReport, error);
    return { success: false, error: translations.errors.getDailyReport };
  }
};

export const getMonthlyReport = async (year, month) => {
  try {
    const snapshot = await get(ref(database, `reports/monthly/${year}/${month}`));
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error(translations.errors.getMonthlyReport, error);
    return { success: false, error: translations.errors.getMonthlyReport };
  }
};

// System Maintenance
export const createBackup = async () => {
  try {
    const timestamp = new Date().toISOString();
    const snapshot = await get(ref(database, '/'));
    await set(ref(database, `backups/${timestamp}`), snapshot.val());
    return { success: true, timestamp };
  } catch (error) {
    console.error(translations.errors.createBackup, error);
    return { success: false, error: translations.errors.createBackup };
  }
};

export const restoreBackup = async (timestamp) => {
  try {
    const snapshot = await get(ref(database, `backups/${timestamp}`));
    await set(ref(database, '/'), snapshot.val());
    return { success: true };
  } catch (error) {
    console.error(translations.errors.restoreBackup, error);
    return { success: false, error: translations.errors.restoreBackup };
  }
};

// Reports
export const getLoanReports = async (startDate, endDate) => {
  try {
    const loansRef = ref(database, 'loans');
    const loansQuery = query(
      loansRef,
      orderByChild('createdAt'),
      // Add date range filtering if needed
    );
    const snapshot = await get(loansQuery);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: {} };
  } catch (error) {
    console.error('Error getting loan reports:', error);
    return { success: false, error: error.message };
  }
};

export const getAllShops = async () => {
  try {
    const shopsRef = ref(database, 'shops');
    const snapshot = await get(shopsRef);
    
    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val()
      };
    } else {
      return {
        success: true,
        data: {}
      };
    }
  } catch (error) {
    console.error('Error getting shops:', error);
    return {
      success: false,
      error: 'दुकाने मिळवताना त्रुटी आली'
    };
  }
};


// Save customer table data for a shop and month
export const saveTableData = async (shopName, month, rows) => {
  try {
    if (!shopName || !month) {
      return { success: false, error: 'दुकान नाव आणि महिना आवश्यक आहे' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const tableRef = ref(database, `shops/${shopKey}/customerTable/${month}`);
    await set(tableRef, rows);
    return { success: true };
  } catch (error) {
    console.error('Error saving customer table data:', error);
    return { success: false, error: error.message };
  }
};

export const getTableData = async (shopName, month) => {
  try {
    if (!shopName || !month) {
      return { success: true, data: [], closingAmount: 0 };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const tableRef = ref(database, `shops/${shopKey}/customerTable/${month}`);
    const snapshot = await get(tableRef);
    if (snapshot.exists()) {
      const monthData = snapshot.val();
      const closingAmount = monthData.closingAmount || 0;
      
      const transactions = Object.keys(monthData)
        .filter(key => key !== 'closingAmount')
        .reduce((obj, key) => {
          obj[key] = monthData[key];
          return obj;
        }, {});

      const rowsArray = Object.values(transactions);
      return { success: true, data: rowsArray, closingAmount: closingAmount };
    }
    return { success: true, data: [], closingAmount: 0 };
  } catch (error) {
    console.error('Error getting table data:', error);
    return { success: false, error: error.message, data: [], closingAmount: 0 };
  }
};

export const saveClosingBalance = async (shopName, month, closingAmount) => {
  try {
    if (!shopName || !month) {
      return { success: false, error: 'Shop name and month are required.' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const monthRef = ref(database, `shops/${shopKey}/customerTable/${month}`);
    await update(monthRef, { closingAmount });
    return { success: true };
  } catch (error) {
    console.error('Error saving closing balance:', error);
    return { success: false, error: error.message };
  }
};

export const updateClosingBalance = async (shopName, month, closingAmount) => {
  try {
    if (!shopName || !month) {
      return { success: false, error: 'Shop name and month are required.' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const monthRef = ref(database, `shops/${shopKey}/monthly_balances/${month}`);
    await set(monthRef, { closingAmount });
    return { success: true };
  } catch (error) {
    console.error('Error updating closing balance:', error);
    return { success: false, error: error.message };
  }
};

export const getClosingBalance = async (shopName, month) => {
  try {
    if (!shopName || !month) {
      return { success: false, error: 'Shop name and month are required.' };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const monthRef = ref(database, `shops/${shopKey}/monthly_balances/${month}`);
    const snapshot = await get(monthRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error('Error getting closing balance:', error);
    return { success: false, error: error.message };
  }
};

export const getAllCustomerTableRows = async (shopName) => {
  try {
    if (!shopName) {
      return { success: false, error: 'दुकान नाव आवश्यक आहे', data: [] };
    }
    const shopKey = shopName.toLowerCase().replace(/\s+/g, '_');
    const tableRef = ref(database, `shops/${shopKey}/customerTable`);
    const snapshot = await get(tableRef);
    let allRows = [];
    if (snapshot.exists()) {
      const monthsData = snapshot.val();
      Object.values(monthsData).forEach(monthData => {
        if (Array.isArray(monthData)) {
          allRows = allRows.concat(monthData);
        } else if (typeof monthData === 'object' && monthData !== null) {
          // If stored as an object (not array), ignore closingAmount and flatten
          allRows = allRows.concat(
            Object.entries(monthData)
              .filter(([k]) => k !== 'closingAmount')
              .map(([, v]) => v)
          );
        }
      });
    }
    return { success: true, data: allRows };
  } catch (error) {
    console.error('Error getting all customer table rows:', error);
    return { success: false, error: error.message, data: [] };
  }
};


