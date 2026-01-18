// Global variables
let extractedData = {
    OD: {},
    OS: {}
};
let selectedEye = null;
let currentImageFile = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const processingStatus = document.getElementById('processingStatus');
const extractedDataSection = document.getElementById('extractedDataSection');
const errorMessage = document.getElementById('errorMessage');
const odBtn = document.getElementById('odBtn');
const osBtn = document.getElementById('osBtn');
const fillCalculatorBtn = document.getElementById('fillCalculatorBtn');
const copyDataBtn = document.getElementById('copyDataBtn');
const resetBtn = document.getElementById('resetBtn');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
odBtn.addEventListener('click', () => selectEye('OD'));
osBtn.addEventListener('click', () => selectEye('OS'));
fillCalculatorBtn.addEventListener('click', openAndFillCalculator);
copyDataBtn.addEventListener('click', copyDataToClipboard);
resetBtn.addEventListener('click', resetApplication);

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processImage(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.style.borderColor = '#2980b9';
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.style.borderColor = '#3498db';

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processImage(file);
    } else {
        showError('Please upload a valid image file.');
    }
}

function processImage(file) {
    currentImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        imagePreview.style.display = 'block';
        processingStatus.style.display = 'block';
        errorMessage.style.display = 'none';

        // Start OCR processing
        performOCR(e.target.result);
    };
    reader.readAsDataURL(file);
}

// OCR Processing
async function performOCR(imageData) {
    try {
        const { data: { text } } = await Tesseract.recognize(
            imageData,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        console.log('OCR Text:', text);
        parseIOLMasterData(text);

        processingStatus.style.display = 'none';
        extractedDataSection.style.display = 'block';

    } catch (error) {
        console.error('OCR Error:', error);
        processingStatus.style.display = 'none';
        showError('Failed to process image. Please try again with a clearer image.');
    }
}

// Parse IOL Master data from OCR text
function parseIOLMasterData(text) {
    const lines = text.split('\n');

    // Helper function to extract number from text
    const extractNumber = (regex, text) => {
        const match = text.match(regex);
        return match ? parseFloat(match[1]) : null;
    };

    // Helper function to find value in proximity to keyword
    const findValueNear = (keyword, textArray, offset = 1) => {
        for (let i = 0; i < textArray.length; i++) {
            if (textArray[i].toLowerCase().includes(keyword.toLowerCase())) {
                // Look in current line and next few lines
                for (let j = 0; j <= offset; j++) {
                    const value = extractNumber(/(\d+\.?\d*)/g, textArray[i + j] || '');
                    if (value !== null) return value;
                }
            }
        }
        return null;
    };

    // Find OD and OS sections
    let inODSection = false;
    let inOSSection = false;
    let currentEyeData = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect eye sections
        if (line.includes('OD') && !line.includes('IOL')) {
            inODSection = true;
            inOSSection = false;
            currentEyeData = extractedData.OD;
        } else if (line.includes('OS') && !line.includes('IOL')) {
            inODSection = false;
            inOSSection = true;
            currentEyeData = extractedData.OS;
        }

        if (!currentEyeData) continue;

        // Extract Axial Length (AL)
        if (line.includes('AL:') || line.includes('AL ')) {
            const al = extractNumber(/(\d+\.?\d+)\s*mm/, line);
            if (al) currentEyeData.axialLength = al;
        }

        // Extract ACD
        if (line.includes('ACD:') || line.includes('ACD ')) {
            const acd = extractNumber(/(\d+\.?\d+)\s*mm/, line);
            if (acd) currentEyeData.acd = acd;
        }

        // Extract Lens Thickness (LT)
        if (line.includes('LT:') || line.includes('LT ')) {
            const lt = extractNumber(/(\d+\.?\d+)\s*mm/, line);
            if (lt) currentEyeData.lensThickness = lt;
        }

        // Extract K readings
        // Pattern: K1: 44.35 D @ 159° or SE 45.50 D
        if (line.includes('K1:') || (line.includes('SE') && line.includes('D') && !line.includes('TSE'))) {
            // Extract K value and angle
            const kMatch = line.match(/(\d+\.?\d+)\s*D.*?@(\d+)/);
            if (kMatch) {
                if (!currentEyeData.flatK) {
                    currentEyeData.flatK = parseFloat(kMatch[1]);
                    currentEyeData.flatMeridian = parseInt(kMatch[2]);
                }
            } else {
                // Try simpler pattern
                const simpleK = extractNumber(/(\d+\.?\d+)\s*D/, line);
                if (simpleK && !currentEyeData.flatK) {
                    currentEyeData.flatK = simpleK;
                }
            }
        }

        if (line.includes('K2:') || (line.includes('SE') && currentEyeData.flatK && line.includes('D'))) {
            const kMatch = line.match(/(\d+\.?\d+)\s*D.*?@(\d+)/);
            if (kMatch) {
                if (!currentEyeData.steepK) {
                    currentEyeData.steepK = parseFloat(kMatch[1]);
                    currentEyeData.steepMeridian = parseInt(kMatch[2]);
                }
            }
        }

        // Alternative K reading extraction - look for SE patterns
        const seMatch = line.match(/SE[\s:]+(\d+\.?\d+)\s*D/);
        if (seMatch) {
            const kValue = parseFloat(seMatch[1]);
            const angleMatch = line.match(/@(\d+)/);
            const angle = angleMatch ? parseInt(angleMatch[1]) : null;

            if (!currentEyeData.flatK) {
                currentEyeData.flatK = kValue;
                if (angle) currentEyeData.flatMeridian = angle;
            } else if (!currentEyeData.steepK && kValue !== currentEyeData.flatK) {
                currentEyeData.steepK = kValue;
                if (angle) currentEyeData.steepMeridian = angle;
            }
        }
    }

    // Fallback: Try more aggressive pattern matching for K readings
    const kPattern = /(\d+\.?\d+)\s*D\s*@?\s*(\d+)[°*]?/g;
    let kMatches = [...text.matchAll(kPattern)];

    // Filter K values (should be between 35 and 55 D typically)
    kMatches = kMatches.filter(m => {
        const val = parseFloat(m[1]);
        return val >= 35 && val <= 55;
    });

    // Assign K values to OD and OS if not already found
    if (kMatches.length >= 2) {
        if (!extractedData.OD.flatK && !extractedData.OD.steepK) {
            extractedData.OD.flatK = parseFloat(kMatches[0][1]);
            extractedData.OD.flatMeridian = parseInt(kMatches[0][2]);
            extractedData.OD.steepK = parseFloat(kMatches[1][1]);
            extractedData.OD.steepMeridian = parseInt(kMatches[1][2]);
        }
        if (kMatches.length >= 4 && !extractedData.OS.flatK && !extractedData.OS.steepK) {
            extractedData.OS.flatK = parseFloat(kMatches[2][1]);
            extractedData.OS.flatMeridian = parseInt(kMatches[2][2]);
            extractedData.OS.steepK = parseFloat(kMatches[3][1]);
            extractedData.OS.steepMeridian = parseInt(kMatches[3][2]);
        }
    }

    console.log('Extracted Data:', extractedData);

    // Enable eye selection buttons
    odBtn.disabled = false;
    osBtn.disabled = false;
}

// Eye selection
function selectEye(eye) {
    selectedEye = eye;

    // Update UI
    odBtn.classList.toggle('selected', eye === 'OD');
    osBtn.classList.toggle('selected', eye === 'OS');

    document.getElementById('selectedEye').textContent = eye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)';

    // Fill form with selected eye data
    const data = extractedData[eye];
    document.getElementById('axialLength').value = data.axialLength || '';
    document.getElementById('acd').value = data.acd || '';
    document.getElementById('lensThickness').value = data.lensThickness || '';
    document.getElementById('flatK').value = data.flatK || '';
    document.getElementById('flatMeridian').value = data.flatMeridian || '';
    document.getElementById('steepK').value = data.steepK || '';
    document.getElementById('steepMeridian').value = data.steepMeridian || '';

    // Enable action buttons
    fillCalculatorBtn.disabled = false;
    copyDataBtn.disabled = false;
}

// Open and fill Alcon calculator
function openAndFillCalculator() {
    if (!selectedEye) {
        showError('Please select an eye first.');
        return;
    }

    // Get form values
    const formData = {
        surgeon: document.getElementById('surgeonName').value,
        patient: document.getElementById('patientName').value,
        eye: selectedEye,
        formula: document.getElementById('formula').value,
        axialLength: document.getElementById('axialLength').value,
        acd: document.getElementById('acd').value,
        flatK: document.getElementById('flatK').value,
        steepK: document.getElementById('steepK').value,
        flatMeridian: document.getElementById('flatMeridian').value,
        steepMeridian: document.getElementById('steepMeridian').value,
        kIndex: document.getElementById('kIndex').value,
        sia: document.getElementById('sia').value,
        incisionLocation: document.getElementById('incisionLocation').value
    };

    // Store data in localStorage for the automation script
    localStorage.setItem('iolCalculatorData', JSON.stringify(formData));

    // Open Alcon calculator
    const alconUrl = 'https://www.acrysoftoriccalculator.com/';
    const calculatorWindow = window.open(alconUrl, '_blank');

    // Show instructions
    setTimeout(() => {
        alert('The Alcon Toric Calculator has been opened.\n\nTo auto-fill:\n1. Wait for the page to load completely\n2. Press F12 to open browser console\n3. Paste the following code and press Enter:\n\n' + getAutoFillScript());
    }, 1000);
}

// Generate auto-fill script
function getAutoFillScript() {
    return `
// Auto-fill script for Alcon Toric Calculator
(function() {
    const data = ${localStorage.getItem('iolCalculatorData')};

    function fillField(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function selectRadio(name, value) {
        const radios = document.querySelectorAll('input[name="' + name + '"]');
        radios.forEach(radio => {
            if (radio.value === value) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    // Fill surgeon and patient names
    fillField('input[placeholder*="Surgeon" i]', data.surgeon);
    fillField('input[placeholder*="Patient" i]', data.patient);

    // Select eye
    if (data.eye === 'OD') {
        const odRadio = document.querySelector('input[type="radio"][value*="right" i]');
        if (odRadio) odRadio.click();
    } else {
        const osRadio = document.querySelector('input[type="radio"][value*="left" i]');
        if (osRadio) osRadio.click();
    }

    // Fill measurements
    fillField('input[placeholder*="Axial" i], input[name*="axial" i]', data.axialLength);
    fillField('input[placeholder*="ACD" i], input[name*="acd" i]', data.acd);
    fillField('input[placeholder*="Flat K" i], input[name*="flatK" i]', data.flatK);
    fillField('input[placeholder*="Steep K" i], input[name*="steepK" i]', data.steepK);
    fillField('input[placeholder*="Flat M" i], input[name*="flatMeridian" i]', data.flatMeridian);
    fillField('input[placeholder*="Steep M" i], input[name*="steepMeridian" i]', data.steepMeridian);
    fillField('input[placeholder*="SIA" i], input[name*="sia" i]', data.sia);
    fillField('input[placeholder*="Incision" i], input[name*="incision" i]', data.incisionLocation);

    console.log('Form auto-filled successfully!');
})();
`;
}

// Copy data to clipboard
function copyDataToClipboard() {
    if (!selectedEye) {
        showError('Please select an eye first.');
        return;
    }

    const formData = {
        surgeon: document.getElementById('surgeonName').value,
        patient: document.getElementById('patientName').value,
        eye: selectedEye === 'OD' ? 'Right Eye' : 'Left Eye',
        formula: document.getElementById('formula').value,
        axialLength: document.getElementById('axialLength').value,
        acd: document.getElementById('acd').value,
        flatK: document.getElementById('flatK').value,
        steepK: document.getElementById('steepK').value,
        flatMeridian: document.getElementById('flatMeridian').value,
        steepMeridian: document.getElementById('steepMeridian').value,
        kIndex: document.getElementById('kIndex').value,
        sia: document.getElementById('sia').value,
        incisionLocation: document.getElementById('incisionLocation').value
    };

    const text = `IOL Calculator Data
==================
Surgeon: ${formData.surgeon}
Patient: ${formData.patient}
Eye: ${formData.eye}
Formula: ${formData.formula}

Biometry:
- Axial Length: ${formData.axialLength} mm
- ACD: ${formData.acd} mm

Keratometry:
- Flat K: ${formData.flatK} D @ ${formData.flatMeridian}°
- Steep K: ${formData.steepK} D @ ${formData.steepMeridian}°

Additional:
- K Index: ${formData.kIndex}
- SIA: ${formData.sia} D
- Incision Location: ${formData.incisionLocation}°
`;

    navigator.clipboard.writeText(text).then(() => {
        alert('Data copied to clipboard!');
    }).catch(err => {
        showError('Failed to copy to clipboard.');
        console.error(err);
    });
}

// Reset application
function resetApplication() {
    if (confirm('Are you sure you want to start over? All data will be cleared.')) {
        extractedData = { OD: {}, OS: {} };
        selectedEye = null;
        currentImageFile = null;

        fileInput.value = '';
        imagePreview.style.display = 'none';
        processingStatus.style.display = 'none';
        extractedDataSection.style.display = 'none';
        errorMessage.style.display = 'none';

        odBtn.classList.remove('selected');
        osBtn.classList.remove('selected');
        fillCalculatorBtn.disabled = true;
        copyDataBtn.disabled = true;

        document.getElementById('selectedEye').textContent = '-';

        // Clear all input fields
        document.querySelectorAll('.measurement-item input').forEach(input => {
            if (!input.readOnly) input.value = '';
        });
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Initialize
console.log('IOL Calculator initialized');
