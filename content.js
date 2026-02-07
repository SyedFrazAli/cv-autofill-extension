// Content Script - Runs on web pages to detect and fill forms
(function () {
    'use strict';

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'autofill') {
            const result = autofillForm(request.cvData);
            sendResponse(result);
        }
        return true; // Keep channel open for async response
    });

    // Main autofill function
    function autofillForm(cvData) {
        try {
            // Find all input fields and textareas on the page
            const formFields = document.querySelectorAll('input, textarea');
            let filledCount = 0;
            const filledFields = [];

            formFields.forEach(field => {
                // Check if field is fillable
                if (!FieldMatcher.isFillable(field)) {
                    return;
                }

                // Detect field type
                const fieldType = FieldMatcher.detectFieldType(field);

                if (fieldType) {
                    // Get appropriate value from CV data
                    const value = FieldMatcher.getValueForField(fieldType, cvData);

                    if (value) {
                        // Fill the field
                        fillField(field, value);
                        filledCount++;
                        filledFields.push({
                            element: field,
                            type: fieldType,
                            value: value
                        });
                    }
                }
            });

            // Add visual feedback
            highlightFilledFields(filledFields);

            return {
                success: true,
                fieldsCount: filledCount,
                fields: filledFields.map(f => ({ type: f.type, value: f.value }))
            };
        } catch (error) {
            console.error('Autofill error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Fill a field with value
    function fillField(field, value) {
        // Set the value
        field.value = value;

        // Trigger events to ensure the value is recognized
        const events = [
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new Event('blur', { bubbles: true })
        ];

        events.forEach(event => field.dispatchEvent(event));

        // For React/Vue inputs, also set the property directly
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        ).set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(field, value);
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // Highlight filled fields
    function highlightFilledFields(filledFields) {
        // Add highlight class
        const style = document.createElement('style');
        style.textContent = `
      .cv-autofill-highlight {
        animation: cvAutofillPulse 0.6s ease-in-out;
        border: 2px solid #00ff88 !important;
        background-color: rgba(0, 255, 136, 0.05) !important;
      }
      
      @keyframes cvAutofillPulse {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(0, 255, 136, 0);
        }
      }
    `;
        document.head.appendChild(style);

        // Apply highlight to filled fields
        filledFields.forEach(({ element }) => {
            element.classList.add('cv-autofill-highlight');

            // Remove highlight after 2 seconds
            setTimeout(() => {
                element.classList.remove('cv-autofill-highlight');
            }, 2000);
        });

        // Show notification
        showNotification(`✓ Filled ${filledFields.length} fields from your CV`);
    }

    // Show notification on page
    function showNotification(message) {
        // Check if notification already exists
        let notification = document.getElementById('cv-autofill-notification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'cv-autofill-notification';
            notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00d4ff 0%, #7000ff 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        animation: cvSlideIn 0.3s ease-out;
      `;

            const styleTag = document.createElement('style');
            styleTag.textContent = `
        @keyframes cvSlideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes cvSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
            document.head.appendChild(styleTag);

            document.body.appendChild(notification);
        }

        notification.textContent = message;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'cvSlideOut 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Initialize - log that script is ready
    console.log('CV AutoFill extension ready');
})();
