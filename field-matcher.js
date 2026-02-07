// Field Matcher - Intelligent field identification and mapping
const FieldMatcher = {
    // Field type mappings
    fieldMappings: {
        // Personal Information
        firstName: ['firstname', 'first_name', 'first-name', 'fname', 'given-name', 'givenname'],
        lastName: ['lastname', 'last_name', 'last-name', 'lname', 'surname', 'family-name', 'familyname'],
        fullName: ['name', 'fullname', 'full_name', 'full-name', 'your-name'],
        email: ['email', 'e-mail', 'emailaddress', 'email-address', 'mail'],
        phone: ['phone', 'telephone', 'mobile', 'phonenumber', 'phone-number', 'tel', 'contact'],

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
    detectFieldType(element) {
        const attributes = [
            element.name?.toLowerCase() || '',
            element.id?.toLowerCase() || '',
            element.placeholder?.toLowerCase() || '',
            element.getAttribute('aria-label')?.toLowerCase() || '',
            element.className?.toLowerCase() || ''
        ].join(' ');

        // Check for email input type
        if (element.type === 'email') {
            return 'email';
        }

        // Check for tel input type
        if (element.type === 'tel') {
            return 'phone';
        }

        // Check label text
        const label = this.getFieldLabel(element);
        if (label) {
            const labelText = label.toLowerCase();

            // Check each field type
            for (const [fieldType, keywords] of Object.entries(this.fieldMappings)) {
                if (keywords.some(keyword => labelText.includes(keyword) || attributes.includes(keyword))) {
                    return fieldType;
                }
            }
        }

        // Fallback: check attributes only
        for (const [fieldType, keywords] of Object.entries(this.fieldMappings)) {
            if (keywords.some(keyword => attributes.includes(keyword))) {
                return fieldType;
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
        const { personalInfo, education, experience, skills } = cvData;

        const valueMap = {
            firstName: personalInfo?.firstName,
            lastName: personalInfo?.lastName,
            fullName: personalInfo?.name,
            email: personalInfo?.email,
            phone: personalInfo?.phone,
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
