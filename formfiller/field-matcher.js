// Field Matcher - Intelligent field identification and mapping
const FieldMatcher = {
    // Field type mappings
    fieldMappings: {
        // Personal Information
        firstName: ['first name', 'firstname', 'first_name', 'first-name', 'fname', 'given name', 'given-name', 'givenname'],
        lastName: ['last name', 'lastname', 'last_name', 'last-name', 'lname', 'surname', 'family name', 'family-name', 'familyname'],
        fullName: ['full name', 'fullname', 'full_name', 'full-name', 'your name', 'your-name', 'name'],
        email: ['email', 'e-mail', 'emailaddress', 'email-address', 'mail'],
        phone: ['phone', 'telephone', 'mobile', 'phonenumber', 'phone-number', 'tel', 'contact'],

        // Address Information
        address: ['address', 'street', 'location', 'residence', 'address line'],
        city: ['city', 'town'],
        state: ['state', 'province', 'region'],
        zip: ['zip', 'postal', 'postcode'],
        country: ['country', 'nation'],

        // Links
        linkedin: ['linkedin', 'linkedin-url', 'linkedin_url', 'linkedinprofile'],
        github: ['github', 'github-url', 'github_url', 'githubprofile'],
        website: ['website', 'portfolio', 'url', 'personal-website', 'homepage'],

        // Education
        education: ['education', 'degree', 'university', 'school', 'college'],

        // Experience
        experience: ['experience', 'work-experience', 'employment'],
        company: ['company', 'employer', 'organization', 'current-company'],
        position: ['position', 'title', 'job-title', 'role', 'job-role'],

        // Skills
        skills: ['skills', 'technical-skills', 'expertise', 'competencies']
    },

    // Detect field type based on various attributes
    detectFieldType(element, cvData = null) {
        // Check for specific input types first
        if (element.type === 'email') return 'email';
        if (element.type === 'tel') return 'phone';

        const attributes = [
            element.name || '',
            element.id || '',
            element.placeholder || '',
            element.getAttribute('aria-label') || '',
            element.className || ''
        ].join(' ').toLowerCase();

        const labelText = (this.getFieldLabel(element) || '').toLowerCase();
        const searchString = `${labelText} ${attributes}`;

        // Standard fields check
        for (const [fieldType, keywords] of Object.entries(this.fieldMappings)) {
            if (keywords.some(keyword => {
                // Strict check for "name" to avoid matching first name, last name, or company name
                if (keyword === 'name') {
                    if (searchString.includes('first') || searchString.includes('last') || searchString.includes('company')) {
                        return false;
                    }
                    return new RegExp(`\\bname\\b`, 'i').test(searchString);
                }

                // Strict check for short or ambiguous words
                if (['tel', 'url', 'title', 'role', 'mail'].includes(keyword)) {
                    return new RegExp(`\\b${keyword}\\b`, 'i').test(searchString);
                }

                return searchString.includes(keyword);
            })) {
                return fieldType;
            }
        }

        // Check against custom fields from cvData
        if (cvData && cvData.customFields) {
            for (const key of Object.keys(cvData.customFields)) {
                const keyLower = key.toLowerCase();
                const keySlug = keyLower.replace(/\s+/g, '-');
                const keySnake = keyLower.replace(/\s+/g, '_');
                const keyFlat = keyLower.replace(/\s+/g, '');

                if (
                    searchString.includes(keyLower) ||
                    searchString.includes(keySlug) ||
                    searchString.includes(keySnake) ||
                    searchString.includes(keyFlat)
                ) {
                    return `custom_${key}`;
                }
            }
        }

        return null;
    },

    // Get field label
    getFieldLabel(element) {
        // Check for label element
        const id = element.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }

        // Check for parent label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.trim();
        }

        // Check for aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            return ariaLabel;
        }

        // Check for placeholder
        if (element.placeholder) {
            return element.placeholder;
        }

        // Check for nearby text
        const previousSibling = element.previousElementSibling;
        if (previousSibling && previousSibling.tagName === 'LABEL') {
            return previousSibling.textContent.trim();
        }

        return null;
    },

    // Get value from CV data based on field type
    getValueForField(fieldType, cvData) {
        if (fieldType && fieldType.startsWith('custom_')) {
            const key = fieldType.substring(7);
            return cvData.customFields && cvData.customFields[key] ? cvData.customFields[key] : null;
        }

        const { personalInfo, education, experience, skills } = cvData;

        const valueMap = {
            firstName: personalInfo?.firstName,
            lastName: personalInfo?.lastName,
            fullName: personalInfo?.name,
            email: personalInfo?.email,
            phone: personalInfo?.phone,
            address: personalInfo?.address,
            city: personalInfo?.city,
            state: personalInfo?.state,
            zip: personalInfo?.zip,
            country: personalInfo?.country,
            linkedin: personalInfo?.linkedin,
            github: personalInfo?.github,
            website: personalInfo?.website,
            education: education?.length > 0 ? education[0].degree : null,
            company: experience?.length > 0 ? experience[0].company : null,
            position: experience?.length > 0 ? experience[0].title : null,
            skills: skills?.join(', ')
        };

        return valueMap[fieldType] || null;
    },

    // Check if element is fillable
    isFillable(element) {
        // Check if element is visible and enabled
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            element.offsetParent !== null;

        const isEnabled = !element.disabled && !element.readOnly;

        // Check element type
        const fillableTypes = ['text', 'email', 'tel', 'url', 'search', 'password'];
        const isFillableType = fillableTypes.includes(element.type) ||
            element.tagName === 'TEXTAREA';

        return isVisible && isEnabled && isFillableType;
    }
};
