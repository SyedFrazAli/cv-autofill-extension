# CV AutoFill - Job Application Assistant

A Chrome extension that intelligently autofills job application forms using information extracted from your uploaded CV/resume.

## Features

✨ **Smart CV Parsing** - Upload your PDF CV and automatically extract:
- Personal information (name, email, phone)
- Professional links (LinkedIn, GitHub, portfolio)
- Education history
- Work experience
- Skills

🎯 **Intelligent Form Detection** - Automatically identifies and fills:
- Name fields (first, last, full name)
- Contact information (email, phone)
- Professional profiles
- Education and experience fields
- Skills and competencies

🎨 **Modern UI** - Beautiful dark-themed interface with smooth animations

🔒 **Privacy-First** - All CV parsing happens locally in your browser. Your data never leaves your device.

## Installation

### From Source

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory

## How to Use

### 1. Upload Your CV

1. Click the extension icon in your Chrome toolbar
2. Drag & drop your PDF CV or click "Browse Files"
3. Wait for the CV to be parsed (usually takes a few seconds)
4. Review the extracted information

### 2. AutoFill Job Applications

1. Navigate to any job application form (LinkedIn, Indeed, company career pages, etc.)
2. Click the extension icon
3. Click the "AutoFill Form" button
4. Watch as your information is automatically filled in!

### 3. Manage Your Data

- **Edit Data**: Click the edit icon to manually adjust extracted information
- **Clear Data**: Remove your CV data at any time with the "Clear Data" button

## Supported Fields

The extension can automatically fill the following types of fields:

| Field Type | Variations Detected |
|------------|-------------------|
| **Name** | First Name, Last Name, Full Name |
| **Contact** | Email, Phone, Telephone, Mobile |
| **Links** | LinkedIn, GitHub, Portfolio, Website |
| **Education** | Degree, University, School |
| **Experience** | Company, Position, Job Title, Role |
| **Skills** | Skills, Technical Skills, Expertise |

## Tested Job Sites

✅ LinkedIn Jobs
✅ Indeed
✅ Glassdoor
✅ Company career pages (Google, Amazon, Microsoft, etc.)
✅ Most ATS (Applicant Tracking Systems)

## Privacy & Security

- **100% Local Processing**: Your CV is parsed entirely in your browser using PDF.js
- **No External Servers**: Your data is never sent to any external servers
- **Secure Storage**: Data is stored locally using Chrome's secure storage API
- **You're in Control**: Clear your data anytime with one click

## Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **PDF Parsing**: Mozilla PDF.js
- **Storage**: Chrome Storage API
- **Permissions**: 
  - `storage` - To save your CV data locally
  - `activeTab` - To fill forms on the current page
  - `scripting` - To inject autofill functionality

## Troubleshooting

### Form fields aren't being filled

- **Refresh the page**: Sometimes you need to refresh the page after installing the extension
- **Check field compatibility**: Some custom form implementations may not be detected
- **Manual verification**: Always review autofilled information before submitting

### CV parsing is inaccurate

- **CV Format**: The parser works best with standard CV formats with clear sections
- **Edit manually**: Use the edit feature to correct any misidentified information
- **Contact support**: If a specific field is consistently wrong, please report it

### Extension not appearing

- Make sure the extension is enabled in `chrome://extensions/`
- Pin the extension to your toolbar for easy access
- Refresh the page you're trying to use it on

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## License

MIT License - Feel free to use and modify as needed.

---

**Made with ❤️ for job seekers everywhere**

Save time on applications and focus on landing your dream job! 🚀
