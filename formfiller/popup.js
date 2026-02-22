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
    const addNewFormBtn = document.getElementById('addNewFormBtn');
    const backBtn = document.getElementById('backBtn');
    const dataBackBtn = document.getElementById('dataBackBtn');
    const statusMessage = document.getElementById('statusMessage');
    const editBtn = document.getElementById('editBtn');
    const manualCreateBtn = document.getElementById('manualCreateBtn');
    const profileSelect = document.getElementById('profileSelect');
    const profileContainer = document.getElementById('profileContainer');
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');

    let currentCVData = null;
    let isEditing = false;

    // Load available profiles into the UI
    async function loadProfilesList() {
        const { success, profiles, activeId } = await CVStorage.getProfiles();
        if (success && profiles.length > 0) {
            profileSelect.innerHTML = '';
            profiles.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name || 'Unnamed Form';
                profileSelect.appendChild(opt);
            });
            profileSelect.value = activeId || profiles[0].id;
            profileContainer.classList.remove('hidden');

            const activeProfile = profiles.find(p => p.id === (activeId || profiles[0].id));
            if (activeProfile) {
                currentCVData = activeProfile.data;
                isEditing = false;
                displayCVData(currentCVData);

                // Show back button so we can back out of new form creation if we have one
                backBtn?.classList.remove('hidden');
            }
        } else {
            profileContainer.classList.add('hidden');
            profileSelect.innerHTML = '';
            uploadSection.classList.remove('hidden');
            dataSection.classList.add('hidden');
            backBtn?.classList.add('hidden');
        }
    }

    // New Form and Back Buttons
    addNewFormBtn?.addEventListener('click', () => {
        dataSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    });

    dataBackBtn?.addEventListener('click', () => {
        dataSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    });

    backBtn?.addEventListener('click', () => {
        loadProfilesList();
    });

    // Profile select change listener
    profileSelect?.addEventListener('change', async (e) => {
        const newId = e.target.value;
        await CVStorage.setActive(newId);
        await loadProfilesList();
    });

    // Delete active profile
    deleteProfileBtn?.addEventListener('click', async () => {
        const activeId = profileSelect.value;
        if (activeId && confirm('Are you sure you want to delete this form entirely?')) {
            await CVStorage.deleteProfile(activeId);
            await loadProfilesList();
            showStatus('Form deleted.', 'success');
        }
    });

    // Initialize UI on load
    await loadProfilesList();

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

    uploadArea.addEventListener('click', (e) => {
        // Prevent clicking the browse button from triggering the area click again
        if (e.target !== browseBtn && e.target !== manualCreateBtn) {
            fileInput.click();
        }
    });

    // Manual Creation
    manualCreateBtn?.addEventListener('click', async (e) => {
        e.stopPropagation(); // prevent triggering uploadArea click
        const name = prompt('Name for this manual form (e.g. Developer CV):') || 'My Custom Form';
        currentCVData = {
            personalInfo: {},
            education: [{}],
            experience: [{}],
            skills: [],
            customFields: {}
        };
        await CVStorage.saveProfile(name, currentCVData);
        await loadProfilesList(); // re-sync active
        isEditing = false;
        displayCVData(currentCVData, false);
        editBtn.click(); // Automatically enter edit mode
        showStatus('Manual form created', 'success');
    });

    // Handle file upload and parsing
    async function handleFileUpload(file) {
        try {
            showStatus('Parsing CV...', 'info');

            const cvData = await CVParser.parsePDF(file);

            const name = prompt('Enter a name for this parsed profile (e.g. Startup CV):') || 'Parsed Form';

            // Save to storage
            const saveResult = await CVStorage.saveProfile(name, cvData);

            if (saveResult.success) {
                await CVStorage.setActive(saveResult.id);
                await loadProfilesList();
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
    function displayCVData(cvData, editMode = false) {
        uploadSection.classList.add('hidden');
        dataSection.classList.remove('hidden');

        let html = '';
        const info = cvData.personalInfo || {};

        if (info.name || editMode) html += createDataField('personalInfo.name', 'Full Name', info.name || '', false, editMode);
        if (info.firstName || editMode) html += createDataField('personalInfo.firstName', 'First Name', info.firstName || '', false, editMode);
        if (info.lastName || editMode) html += createDataField('personalInfo.lastName', 'Last Name', info.lastName || '', false, editMode);
        if (info.email || editMode) html += createDataField('personalInfo.email', 'Email', info.email || '', false, editMode);
        if (info.phone || editMode) html += createDataField('personalInfo.phone', 'Phone', info.phone || '', false, editMode);

        if (info.address || editMode) html += createDataField('personalInfo.address', 'Street Address', info.address || '', false, editMode);
        if (info.city || editMode) html += createDataField('personalInfo.city', 'City', info.city || '', false, editMode);
        if (info.state || editMode) html += createDataField('personalInfo.state', 'State / Province', info.state || '', false, editMode);
        if (info.zip || editMode) html += createDataField('personalInfo.zip', 'Zip / Postal Code', info.zip || '', false, editMode);
        if (info.country || editMode) html += createDataField('personalInfo.country', 'Country', info.country || '', false, editMode);

        if (info.linkedin || editMode) html += createDataField('personalInfo.linkedin', 'LinkedIn', info.linkedin || '', false, editMode);
        if (info.github || editMode) html += createDataField('personalInfo.github', 'GitHub', info.github || '', false, editMode);
        if (info.website || editMode) html += createDataField('personalInfo.website', 'Website', info.website || '', false, editMode);

        const eduDegree = (cvData.education && cvData.education.length > 0) ? cvData.education[0].degree : '';
        if (eduDegree || editMode) html += createDataField('education.0.degree', 'Recent Degree', eduDegree, false, editMode);

        const expTitle = (cvData.experience && cvData.experience.length > 0) ? cvData.experience[0].title : '';
        if (expTitle || editMode) html += createDataField('experience.0.title', 'Recent Job Title', expTitle, false, editMode);

        const expCompany = (cvData.experience && cvData.experience.length > 0) ? cvData.experience[0].company : '';
        if (expCompany || editMode) html += createDataField('experience.0.company', 'Recent Company', expCompany, false, editMode);

        const skills = (cvData.skills || []).join(', ');
        if (skills || editMode) html += createDataField('skills', 'Skills (comma separated for edit)', skills, false, editMode);

        if (cvData.customFields) {
            for (const [key, val] of Object.entries(cvData.customFields)) {
                html += createDataField(`customFields.${key}`, key, val, false, editMode, true);
            }
        }

        if (editMode) {
            html += `<div class="data-field"><button id="addCustomFieldBtn" class="btn-secondary" style="width: 100%; margin-top: 10px;">+ Add Custom Field</button></div>`;
        }

        dataPreview.innerHTML = html;

        if (editMode) {
            document.querySelectorAll('.delete-custom-field').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const keyAttr = e.currentTarget.getAttribute('data-delete');
                    const realKey = keyAttr.replace('customFields.', '');
                    if (confirm(`Delete custom field "${realKey}"?`)) {
                        saveCurrentEdits();
                        delete currentCVData.customFields[realKey];
                        displayCVData(currentCVData, true);
                    }
                });
            });

            document.getElementById('addCustomFieldBtn')?.addEventListener('click', () => {
                saveCurrentEdits(); // Save inputs before re-rendering
                const fieldName = prompt('Enter custom field name:');
                if (fieldName && fieldName.trim()) {
                    if (!currentCVData.customFields) currentCVData.customFields = {};
                    currentCVData.customFields[fieldName.trim()] = '';
                    displayCVData(currentCVData, true);
                }
            });
        }
    }

    // Helper to save current edits into currentCVData
    function saveCurrentEdits() {
        const fields = dataPreview.querySelectorAll('.data-field[data-key]');
        fields.forEach(f => {
            const key = f.getAttribute('data-key');
            const input = f.querySelector('.edit-input');
            if (!input) return;
            const val = input.value.trim();

            if (key.startsWith('personalInfo.')) {
                if (!currentCVData.personalInfo) currentCVData.personalInfo = {};
                currentCVData.personalInfo[key.split('.')[1]] = val;
            } else if (key === 'education.0.degree') {
                if (!currentCVData.education) currentCVData.education = [{}];
                if (!currentCVData.education[0]) currentCVData.education[0] = {};
                currentCVData.education[0].degree = val;
            } else if (key === 'experience.0.title') {
                if (!currentCVData.experience) currentCVData.experience = [{}];
                if (!currentCVData.experience[0]) currentCVData.experience[0] = {};
                currentCVData.experience[0].title = val;
            } else if (key === 'experience.0.company') {
                if (!currentCVData.experience) currentCVData.experience = [{}];
                if (!currentCVData.experience[0]) currentCVData.experience[0] = {};
                currentCVData.experience[0].company = val;
            } else if (key === 'skills') {
                currentCVData.skills = val.split(',').map(s => s.trim()).filter(s => s);
            } else if (key.startsWith('customFields.')) {
                if (!currentCVData.customFields) currentCVData.customFields = {};
                currentCVData.customFields[key.substring(13)] = val;
            }
        });
    }

    // Create data field HTML
    function createDataField(key, label, value, isList = false, editable = false, isCustom = false) {
        if (!editable) {
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
        } else {
            let deleteHtml = '';
            if (isCustom) {
                deleteHtml = `<span class="delete-custom-field" data-delete="${key}" style="color: var(--error); float: right; cursor: pointer;" title="Delete Field">✖</span>`;
            }
            return `
        <div class="data-field" data-key="${key}">
          <label>${label} ${deleteHtml}</label>
          <input type="text" class="edit-input" value="${value || ''}">
        </div>
      `;
        }
    }

    // Toggle Edit Mode
    editBtn?.addEventListener('click', async () => {
        isEditing = !isEditing;
        if (isEditing) {
            // Switch to Edit Mode
            editBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-green-500">
                <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;
            editBtn.title = "Save data";
            displayCVData(currentCVData, true);
        } else {
            // Save data
            saveCurrentEdits();

            await CVStorage.save(currentCVData);

            // Switch back to View Mode
            editBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43741 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;
            editBtn.title = "Edit data";
            displayCVData(currentCVData, false);
            showStatus('Changes saved!', 'success');
        }
    });

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
