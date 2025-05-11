// English to Marathi number mapping
const numberMap = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९'
};

// English to Marathi vowel mapping
const vowelMap = {
  'a': 'अ',
  'aa': 'आ',
  'i': 'इ',
  'ii': 'ई',
  'u': 'उ',
  'uu': 'ऊ',
  'e': 'ए',
  'ai': 'ऐ',
  'o': 'ओ',
  'au': 'औ',
  'am': 'अं',
  'ah': 'अः'
};

// English to Marathi matra mapping
const matraMap = {
  'aa': 'ा',
  'i': 'ि',
  'ii': 'ी',
  'u': 'ु',
  'uu': 'ू',
  'e': 'े',
  'ai': 'ै',
  'o': 'ो',
  'au': 'ौ',
  'am': 'ं',
  'ah': 'ः'
};

// English to Marathi character mapping
const charMap = {
  // Consonants
  'k': 'क',
  'kh': 'ख',
  'g': 'ग',
  'gh': 'घ',
  'ng': 'ङ',
  'ch': 'च',
  'chh': 'छ',
  'j': 'ज',
  'jh': 'झ',
  'ny': 'ञ',
  't': 'त',
  'th': 'थ',
  'd': 'द',
  'dh': 'ध',
  'n': 'न',
  'p': 'प',
  'ph': 'फ',
  'b': 'ब',
  'bh': 'भ',
  'm': 'म',
  'y': 'य',
  'r': 'र',
  'l': 'ल',
  'v': 'व',
  'w': 'व',
  'sh': 'श',
  's': 'स',
  'h': 'ह',
  'l': 'ळ',
  'ksh': 'क्ष',
  'tr': 'त्र',
  'gy': 'ज्ञ',
  
  // Special combinations
  'ri': 'ृ',
  'rri': 'ॄ',
  'lri': 'ॢ',
  'llri': 'ॣ',
  'nukta': '़',
  'virama': '्',
  'danda': '।',
  'doubledanda': '॥',
  'om': 'ॐ',
  
  // Common name patterns
  'patil': 'पाटील',
  'desai': 'देशाई',
  'joshi': 'जोशी',
  'kulkarni': 'कुलकर्णी',
  'shinde': 'शिंदे',
  'gaikwad': 'गायकवाड',
  'jadhav': 'जाधव',
  'more': 'मोरे',
  'chavan': 'चव्हाण',
  'pawar': 'पवार',
  'thakur': 'ठाकूर',
  'kadam': 'कदम',
  'sawant': 'सावंत',
  'mohite': 'मोहिते',
  'salunkhe': 'साळुंखे',
  'kamble': 'कांबळे',
  'bhosale': 'भोसले',
  'kale': 'काळे',
  'suryawanshi': 'सूर्यवंशी',
  'dhumal': 'धुमाळ',
  'khandekar': 'खंडेकर'
};

// Common name prefixes and suffixes
const namePrefixes = {
  'shri': 'श्री',
  'smt': 'श्रीमती',
  'mr': 'श्री',
  'mrs': 'श्रीमती',
  'ms': 'कु',
  'dr': 'डॉ',
  'prof': 'प्रा',
  'adv': 'अॅड',
  'capt': 'कॅप्ट',
  'col': 'कर्नल',
  'gen': 'जनरल',
  'gov': 'गव्हर्नर',
  'hon': 'माननीय',
  'jr': 'कनिष्ठ',
  'sr': 'वरिष्ठ',
  'rev': 'पाद्री',
  'sir': 'सर',
  'madam': 'मॅडम'
};

// Convert English numbers to Marathi
export const toMarathiNumber = (text) => {
  if (!text) return '';
  return text.toString().split('').map(char => numberMap[char] || char).join('');
};

// Convert English text to Marathi with improved name handling
export const toMarathiText = (text) => {
  if (!text) return '';
  
  // First convert any numbers
  let result = toMarathiNumber(text);
  
  // Convert to lowercase for consistent matching
  const lowerText = result.toLowerCase();
  
  // Handle vowels first
  for (const [eng, mar] of Object.entries(vowelMap)) {
    if (lowerText.includes(eng)) {
      result = result.replace(new RegExp(eng, 'gi'), mar);
    }
  }
  
  // Handle matras
  for (const [eng, mar] of Object.entries(matraMap)) {
    if (lowerText.includes(eng)) {
      result = result.replace(new RegExp(eng, 'gi'), mar);
    }
  }
  
  // Handle consonants and other characters
  for (const [eng, mar] of Object.entries(charMap)) {
    if (lowerText.includes(eng)) {
      // Handle special cases for names
      if (eng === 'patil' || eng === 'desai' || eng === 'joshi' || eng === 'kulkarni') {
        result = result.replace(new RegExp(eng, 'gi'), mar);
      } else {
        // Regular character replacement
        result = result.replace(new RegExp(eng, 'gi'), mar);
      }
    }
  }
  
  // Handle name prefixes
  for (const [prefix, marPrefix] of Object.entries(namePrefixes)) {
    if (lowerText.startsWith(prefix + ' ')) {
      result = result.replace(new RegExp(`^${prefix}\\s`, 'i'), marPrefix + ' ');
    }
  }
  
  return result;
};

// Format currency in Marathi
export const formatMarathiCurrency = (amount) => {
  if (!amount) return '₹०';
  const formattedAmount = toMarathiNumber(amount.toString());
  return `₹${formattedAmount}`;
};

// Format date in Marathi
export const formatMarathiDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = toMarathiNumber(d.getDate());
  const month = toMarathiNumber(d.getMonth() + 1);
  const year = toMarathiNumber(d.getFullYear());
  return `${day}/${month}/${year}`;
};

// Common Marathi translations
export const translations = {
  common: {
    selectShop: 'दुकान निवडा',
    pleaseSelectShop: 'कृपया प्रथम दुकान निवडा',
    loading: 'लोड होत आहे...',
    error: 'त्रुटी आली',
    success: 'यशस्वी',
    save: 'सेव्ह करा',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    edit: 'संपादित करा',
    add: 'जोडा',
    search: 'शोधा',
    noData: 'डेटा उपलब्ध नाही',
    confirmDelete: 'तुम्हाला खात्री आहे की हटवू इच्छिता?',
    yes: 'होय',
    no: 'नाही'
  },
  dashboard: {
    title: 'डॅशबोर्ड',
    totalCustomers: 'एकूण ग्राहक',
    activeLoans: 'सक्रिय कर्ज',
    todayRepayment: 'आजची परतफेड',
    overdueLoans: 'मागणी कर्ज',
    recentActivities: 'अलीकडील क्रिया',
    noOverdueLoans: 'कोणतेही मागणी कर्ज नाही',
    allLoansActive: 'सर्व कर्ज चालू आहेत',
    takeAction: 'कृपया त्वरित कारवाई करा'
  },
  customers: {
    title: 'ग्राहक',
    addCustomer: 'ग्राहक जोडा',
    name: 'नाव',
    phone: 'फोन',
    address: 'पत्ता',
    aadharNumber: 'आधार क्रमांक',
    addSuccess: 'ग्राहक यशस्वीरित्या जोडला',
    updateSuccess: 'ग्राहक यशस्वीरित्या अपडेट केला',
    deleteSuccess: 'ग्राहक यशस्वीरित्या हटवला'
  },
  loans: {
    title: 'कर्ज',
    addLoan: 'कर्ज जोडा',
    customerName: 'ग्राहकाचे नाव',
    goldWeight: 'सोन्याचे वजन',
    goldPurity: 'सोन्याची शुद्धता',
    loanAmount: 'कर्ज रक्कम',
    interestRate: 'व्याज दर',
    duration: 'मुदत',
    startDate: 'सुरुवातीची तारीख',
    endDate: 'शेवटची तारीख',
    status: 'स्थिती',
    addSuccess: 'कर्ज यशस्वीरित्या जोडले',
    updateSuccess: 'कर्ज यशस्वीरित्या अपडेट केले',
    deleteSuccess: 'कर्ज यशस्वीरित्या हटवले'
  }
}; 