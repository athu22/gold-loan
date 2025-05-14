import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { toMarathiName, toMarathiNumber } from '../utils/translations';

const MarathiTransliterator = ({ 
  value = '', 
  onChange, 
  label = 'Enter text', 
  multiline = false,
  rows = 1,
  fullWidth = true,
  type = 'text',
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  placeholder = '',
  name = '',
  id = '',
  className = '',
  style = {}
}) => {
  const [transliteratedText, setTransliteratedText] = useState('');

  useEffect(() => {
    if (value) {
      // Handle numbers separately
      if (type === 'number') {
        setTransliteratedText(toMarathiNumber(value));
      } else {
        setTransliteratedText(toMarathiName(value));
      }
    } else {
      setTransliteratedText('');
    }
  }, [value, type]);

  const handleChange = (event) => {
    const newValue = event.target.value;
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        value={value}
        onChange={handleChange}
        label={label}
        multiline={multiline}
        rows={rows}
        fullWidth={fullWidth}
        type={type}
        disabled={disabled}
        required={required}
        error={error}
        helperText={helperText}
        placeholder={placeholder}
        name={name}
        id={id}
        className={className}
        style={style}
        InputProps={{
          sx: { fontFamily: 'Noto Sans Marathi, Arial, sans-serif' }
        }}
      />
      {transliteratedText && (
        <Typography
          variant="body2"
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            mt: 1,
            color: 'text.secondary',
            fontFamily: 'Noto Sans Marathi, Arial, sans-serif'
          }}
        >
          {transliteratedText}
        </Typography>
      )}
    </Box>
  );
};

export default MarathiTransliterator; 