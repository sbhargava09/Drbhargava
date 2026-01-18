# IOL Master Calculator Application

## Overview
A web-based application that automates the process of extracting IOL Master measurements from photos and filling the Alcon Toric Calculator. Designed for mobile and desktop use.

## Features

### 1. Image Upload
- Take photos directly from your phone camera
- Upload existing IOL Master sheet images
- Supports JPG and PNG formats
- Real-time image preview

### 2. Automatic OCR Processing
- Uses Tesseract.js for optical character recognition
- Extracts measurements for both eyes (OD and OS):
  - Axial Length (AL)
  - Anterior Chamber Depth (ACD)
  - Lens Thickness (LT)
  - Keratometry values (K1, K2)
  - Meridian angles

### 3. Eye Selection
- Easy-to-use buttons to select Right Eye (OD) or Left Eye (OS)
- Visual feedback for selected eye
- Automatically populates form with selected eye's measurements

### 4. Data Verification
- All extracted values are displayed in editable fields
- Manual correction capability if OCR misreads any values
- Pre-filled with surgeon name (Bhargava) and patient name (Patient1)

### 5. Alcon Calculator Integration
- Opens the Alcon Toric Calculator in a new tab
- Provides auto-fill script for seamless data transfer
- Alternative: Copy all values to clipboard for manual entry

## How to Use

### Step 1: Upload IOL Master Sheet
1. Navigate to the IOL Calculator page
2. Click "Take Photo or Upload Image"
3. Either take a photo with your phone or select an existing image
4. Wait for OCR processing to complete (typically 10-30 seconds)

### Step 2: Select Eye
1. Click either "OD (Right Eye)" or "OS (Left Eye)" button
2. The form will auto-populate with that eye's measurements

### Step 3: Verify Values
1. Review all extracted measurements
2. Correct any values that were misread
3. Adjust additional parameters if needed (SIA, Incision Location, etc.)

### Step 4: Fill Alcon Calculator
**Option A: Auto-Fill (Recommended)**
1. Click "Open & Fill Alcon Calculator"
2. A new tab opens with the Alcon calculator
3. Open browser console (F12)
4. Paste the provided script and press Enter
5. Form auto-fills with your data

**Option B: Manual Entry**
1. Click "Copy Values to Clipboard"
2. Open Alcon calculator manually
3. Use copied values for reference

## Technical Details

### Technologies Used
- **HTML5**: Structure and semantic markup
- **CSS3**: Responsive design with mobile-first approach
- **JavaScript (ES6+)**: Application logic and data handling
- **Tesseract.js**: OCR library for text extraction from images
- **localStorage**: Temporary data storage for calculator integration

### Browser Compatibility
- Chrome/Edge (recommended)
- Safari (iOS and macOS)
- Firefox
- Opera

### Mobile Optimization
- Responsive design works on all screen sizes
- Touch-friendly interface
- Camera integration for direct photo capture
- Optimized for phones, tablets, and desktops

## File Structure
```
/Drbhargava
├── iol-calculator.html         # Main calculator page
├── css/
│   ├── style.css              # Main site styles
│   └── iol-calculator.css     # Calculator-specific styles
├── js/
│   └── iol-calculator.js      # Calculator logic and OCR processing
└── IOL_CALCULATOR_README.md   # This file
```

## Data Privacy
- All processing happens locally in your browser
- No data is sent to external servers (except Tesseract.js CDN)
- Images are not stored or transmitted
- Data is cleared when you reset or close the application

## Troubleshooting

### OCR Not Extracting Values Correctly
- Ensure image is clear and well-lit
- Make sure text is not skewed or rotated
- Try uploading a higher resolution image
- Manually correct any misread values in the form

### Auto-Fill Not Working
1. Make sure the Alcon calculator page is fully loaded
2. Verify you're using a modern browser (Chrome recommended)
3. Check browser console for errors (F12)
4. Use the "Copy to Clipboard" option as fallback

### Mobile Camera Not Working
- Grant camera permissions when prompted
- If denied, go to browser settings and enable camera
- Alternatively, take photo with camera app and upload

## Future Enhancements
- Support for additional IOL calculators
- Batch processing of multiple patients
- PDF report generation
- Cloud storage integration (optional)
- Advanced OCR training for better accuracy

## Support
For issues or questions, please contact through the main website contact form.

## Version
- Version 1.0
- Last Updated: January 2026
- Author: Dr. Bhargava's Practice
