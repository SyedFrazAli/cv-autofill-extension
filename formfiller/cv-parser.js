// CV Parser - Extract structured data from PDF CV
const CVParser = {
    // Main parsing function
    async parsePDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';

            // Extract text from all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            // Parse the extracted text
            return this.extractData(fullText);
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error('Failed to parse PDF file');
        }
    },

    // Extract structured data from text
    extractData(text) {
        const data = {
            personalInfo: this.extractPersonalInfo(text),
            education: this.extractEducation(text),
            experience: this.extractExperience(text),
            skills: this.extractSkills(text),
            customFields: this.extractCustomFields(text)
        };

        return data;
    },

    // Extract personal information
    extractPersonalInfo(text) {
        const info = {};

        // Extract email
        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
        const emailMatch = text.match(emailRegex);
        if (emailMatch) {
            info.email = emailMatch[0];
        }

        // Extract phone number (various formats)
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
        const phoneMatch = text.match(phoneRegex);
        if (phoneMatch) {
            info.phone = phoneMatch[0].trim();
        }

        // Extract name (usually first line or before email)
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            // Try to find name before email/phone
            const firstFewLines = lines.slice(0, 5).join(' ');
            const nameRegex = /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/;
            const nameMatch = firstFewLines.match(nameRegex);
            if (nameMatch) {
                info.name = nameMatch[1];
                // Split into first and last name
                const nameParts = info.name.split(' ');
                info.firstName = nameParts[0];
                info.lastName = nameParts.slice(1).join(' ');
            }
        }

        // Extract LinkedIn
        const linkedinRegex = /linkedin\.com\/in\/[\w-]+/i;
        const linkedinMatch = text.match(linkedinRegex);
        if (linkedinMatch) {
            info.linkedin = 'https://' + linkedinMatch[0];
        }

        // Extract GitHub
        const githubRegex = /github\.com\/[\w-]+/i;
        const githubMatch = text.match(githubRegex);
        if (githubMatch) {
            info.github = 'https://' + githubMatch[0];
        }

        // Extract website/portfolio
        const websiteRegex = /(https?:\/\/)?[\w-]+\.[\w.-]+/gi;
        const websites = text.match(websiteRegex);
        if (websites) {
            info.website = websites.find(url =>
                !url.includes('linkedin') &&
                !url.includes('github') &&
                !url.includes('@')
            );
        }

        return info;
    },

    // Extract education information
    extractEducation(text) {
        const education = [];

        // Common education keywords
        const eduKeywords = ['education', 'academic', 'university', 'college', 'degree'];
        const degrees = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'b.s.', 'm.s.', 'b.a.', 'm.a.'];

        // Find education section
        const eduSectionRegex = new RegExp(`(${eduKeywords.join('|')})`, 'i');
        const sections = text.split(/\n\n+/);

        let educationSection = '';
        for (let i = 0; i < sections.length; i++) {
            if (eduSectionRegex.test(sections[i])) {
                educationSection = sections[i] + '\n' + (sections[i + 1] || '');
                break;
            }
        }

        if (educationSection) {
            const lines = educationSection.split('\n').filter(line => line.trim());

            lines.forEach((line, idx) => {
                const degreeMatch = degrees.some(deg => line.toLowerCase().includes(deg));
                if (degreeMatch && idx < lines.length - 1) {
                    education.push({
                        degree: line.trim(),
                        institution: lines[idx + 1]?.trim() || '',
                        year: this.extractYear(line)
                    });
                }
            });
        }

        return education;
    },

    // Extract work experience
    extractExperience(text) {
        const experience = [];

        // Common experience keywords
        const expKeywords = ['experience', 'employment', 'work history', 'professional'];

        // Find experience section
        const expSectionRegex = new RegExp(`(${expKeywords.join('|')})`, 'i');
        const sections = text.split(/\n\n+/);

        let experienceSection = '';
        for (let i = 0; i < sections.length; i++) {
            if (expSectionRegex.test(sections[i])) {
                // Get this section and next few sections
                experienceSection = sections.slice(i, i + 5).join('\n\n');
                break;
            }
        }

        if (experienceSection) {
            const jobRegex = /([^\n]+)\n([^\n]+(?:inc|llc|ltd|corp|company|organization)?[^\n]*)\n/gi;
            let match;

            while ((match = jobRegex.exec(experienceSection)) !== null) {
                experience.push({
                    title: match[1].trim(),
                    company: match[2].trim(),
                    duration: this.extractDuration(match[0])
                });
            }
        }

        return experience;
    },

    // Extract skills
    extractSkills(text) {
        const skills = [];

        // Common skill keywords
        const skillKeywords = ['skills', 'technical skills', 'expertise', 'proficiencies', 'technologies'];

        // Find skills section
        const skillSectionRegex = new RegExp(`(${skillKeywords.join('|')})`, 'i');
        const sections = text.split(/\n\n+/);

        let skillSection = '';
        for (let i = 0; i < sections.length; i++) {
            if (skillSectionRegex.test(sections[i])) {
                skillSection = sections[i] + '\n' + (sections[i + 1] || '');
                break;
            }
        }

        if (skillSection) {
            // Split by common separators
            const skillText = skillSection.replace(/skills?:?/gi, '');
            const skillList = skillText.split(/[,•\n]/).map(s => s.trim()).filter(s => s.length > 0);

            skillList.forEach(skill => {
                if (skill.length < 50) { // Avoid long descriptions
                    skills.push(skill);
                }
            });
        }

        return skills;
    },

    // Helper: Extract year from text
    extractYear(text) {
        const yearRegex = /\b(19|20)\d{2}\b/;
        const match = text.match(yearRegex);
        return match ? match[0] : '';
    },

    // Helper: Extract duration (e.g., "2020-2023", "Jan 2020 - Present")
    extractDuration(text) {
        const durationRegex = /(\w+\s+)?(19|20)\d{2}\s*[-–]\s*(\w+\s+)?(19|20)\d{2}|present/i;
        const match = text.match(durationRegex);
        return match ? match[0] : '';
    },

    // Extract custom fields from subtitles and other sections
    extractCustomFields(text) {
        const customFields = {};
        const sections = text.split(/\n\n+/);
        
        // Known keywords to ignore because they are handled separately
        const knownKeywords = [
            'education', 'academic', 'university', 'college', 'degree',
            'experience', 'employment', 'work history', 'professional',
            'skills', 'technical skills', 'expertise', 'proficiencies', 'technologies'
        ];

        for (let i = 0; i < sections.length; i++) {
            const lines = sections[i].trim().split('\n');
            if (lines.length > 0) {
                const title = lines[0].trim();
                // Check if title is short (likely a header) and mostly alphabetical
                if (title.length < 40 && title.length > 2 && /^[a-zA-Z\s]+$/.test(title)) {
                    const titleLower = title.toLowerCase();
                    const isKnown = knownKeywords.some(kw => titleLower.includes(kw));

                    if (!isKnown && lines.length > 1) {
                        // Title case or ALL CAPS are good indicators of a section
                        const isTitleCase = /^[A-Z][a-zA-Z]*(\s+[A-Z][a-zA-Z]*)*$/.test(title);
                        const isAllCaps = /^[A-Z\s]+$/.test(title);

                        if (isTitleCase || isAllCaps) {
                            // Map the key as CamelCase or clean text
                            const keyName = title.split(' ').map((w, index) => {
                                return index === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
                            }).join('');

                            const content = lines.slice(1).join('\n').trim();
                            if (content.length > 0 && content.length < 500) { // arbitrary limit to avoid dumping half the document
                                customFields[title] = content;
                            }
                        }
                    }
                }
            }
        }
        return customFields;
    }
};
