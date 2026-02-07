// Popup script - Handle UI interactions
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

    // DOM elements
    const uploadSection = document.getElementById('uploadSection');
    const dataSection = document.getElementById('dataSection');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const dataPreview = document.getElementById('dataPreview');
    const autofillBtn = document.getElementById('autofillBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusMessage = document.getElementById('statusMessage');

    // Check if CV data already exists
    const existingData = await CVStorage.load();
    if (existingData.success && existingData.data) {
        displayCVData(existingData.data);
    }

    // File upload handlers
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            await handleFileUpload(file);
        } else {
            showStatus('Please upload a PDF file', 'error');
        }
    });

    uploadArea.addEventListener('click', () => fileInput.click());

    // Handle file upload and parsing
    async function handleFileUpload(file) {
        try {
            showStatus('Parsing CV...', 'info');

            const cvData = await CVParser.parsePDF(file);

            // Save to storage
            const saveResult = await CVStorage.save(cvData);

            if (saveResult.success) {
                displayCVData(cvData);
                showStatus('CV parsed successfully!', 'success');
            } else {
                throw new Error('Failed to save CV data');
            }
        } catch (error) {
            console.error('Error processing CV:', error);
            showStatus('Error parsing CV. Please try again.', 'error');
        }
    }

    // Display parsed CV data
    function displayCVData(cvData) {
        uploadSection.classList.add('hidden');
        dataSection.classList.remove('hidden');

        let html = '';

        // Personal Information
        if (cvData.personalInfo) {
            const info = cvData.personalInfo;

            if (info.name) {
                html += createDataField('Full Name', info.name);
            }
            if (info.firstName) {
                html += createDataField('First Name', info.firstName);
            }
            if (info.lastName) {
                html += createDataField('Last Name', info.lastName);
            }
            if (info.email) {
                html += createDataField('Email', info.email);
            }
            if (info.phone) {
                html += createDataField('Phone', info.phone);
            }
            if (info.linkedin) {
                html += createDataField('LinkedIn', info.linkedin);
            }
            if (info.github) {
                html += createDataField('GitHub', info.github);
            }
            if (info.website) {
                html += createDataField('Website', info.website);
            }
        }

        // Education
        if (cvData.education && cvData.education.length > 0) {
            const eduList = cvData.education.map(edu =>
                `${edu.degree} - ${edu.institution} ${edu.year ? `(${edu.year})` : ''}`
            );
            html += createDataField('Education', eduList, true);
        }

        // Experience
        if (cvData.experience && cvData.experience.length > 0) {
            const expList = cvData.experience.map(exp =>
                `${exp.title} at ${exp.company} ${exp.duration ? `- ${exp.duration}` : ''}`
            );
            html += createDataField('Experience', expList, true);
        }

        // Skills
        if (cvData.skills && cvData.skills.length > 0) {
            html += createDataField('Skills', cvData.skills.slice(0, 10), true);
        }

        dataPreview.innerHTML = html;
    }

    // Create data field HTML
    function createDataField(label, value, isList = false) {
        if (isList && Array.isArray(value)) {
            const listItems = value.map(item => `<li>${item}</li>`).join('');
            return `
        <div class="data-field">
          <label>${label}</label>
          <ul class="value list">${listItems}</ul>
        </div>
      `;
        } else {
            return `
        <div class="data-field">
          <label>${label}</label>
          <div class="value">${value}</div>
        </div>
      `;
        }
    }

    // AutoFill button handler
    autofillBtn.addEventListener('click', async () => {
        try {
            const result = await CVStorage.load();

            if (!result.success || !result.data) {
                showStatus('No CV data found', 'error');
                return;
            }

            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, {
                action: 'autofill',
                cvData: result.data
            }, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus('Please refresh the page and try again', 'error');
                } else if (response && response.success) {
                    showStatus(`Filled ${response.fieldsCount} fields!`, 'success');
                } else {
                    showStatus('No form fields found on this page', 'error');
                }
            });
        } catch (error) {
            console.error('Autofill error:', error);
            showStatus('Autofill failed', 'error');
        }
    });

    // Clear button handler
    clearBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear your CV data?')) {
            await CVStorage.clear();
            dataSection.classList.add('hidden');
            uploadSection.classList.remove('hidden');
            dataPreview.innerHTML = '';
            fileInput.value = '';
            showStatus('CV data cleared', 'success');
        }
    });

    // Show status message
    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');

        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 3000);
    }
});
