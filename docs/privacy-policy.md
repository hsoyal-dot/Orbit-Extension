# Privacy Policy for Orbit - The Calendar That Builds Itself

**Last Updated:** December 19, 2025  
**Effective Date:** December 19, 2025

## Introduction

Orbit ("we," "our," or "the extension") is a Chrome browser extension that helps users automatically detect and capture event information from web pages to build a smart calendar. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Orbit extension.

By installing and using Orbit, you agree to the collection and use of information in accordance with this policy.

## Information We Collect

### 1. User-Provided Information
When you use Orbit, we may collect:
- **Page Content**: Text snippets you select or page content you choose to import for event extraction
- **URLs**: The web addresses of pages where you capture events
- **Page Titles**: Titles of webpages from which events are detected
- **Event Details**: Dates, times, titles, and descriptions of events you save

### 2. Automatically Collected Information
- **Extension Usage**: Whether the extension's capture mode is enabled or disabled
- **Local Storage**: Events are temporarily stored locally in your browser until you choose to save them to our backend

### 3. Information We Do NOT Collect
- We do NOT collect personally identifiable information (name, email, phone number) unless you explicitly include it in event details
- We do NOT track your browsing history beyond pages where you actively use the extension
- We do NOT collect payment information
- We do NOT use cookies or tracking pixels

## How We Use Your Information

We use the information we collect to:
1. **Extract Event Information**: Process text snippets using Google's Gemini AI API to detect dates, times, and event details
2. **Store Events**: Save your captured events to a backend database for persistence and synchronization
3. **Provide Core Features**: Enable event management, categorization, ICS export, and calendar integration
4. **Improve Service**: Analyze usage patterns to improve event detection accuracy (anonymized data only)

## Third-Party Services

### Google Gemini AI API
Orbit uses Google's Gemini AI to intelligently extract event information from text. When you capture an event:
- The text snippet is sent to Google's Gemini API for processing
- Google may process this data according to their own privacy policy
- We recommend reviewing [Google's Privacy Policy](https://policies.google.com/privacy) for details

**Note:** Google Gemini API is used solely for event extraction and does not receive any personally identifiable information beyond the text snippets you choose to process.

## Data Storage and Security

### Local Storage
- Detected events are initially stored locally in your browser using Chrome's Storage API
- This data remains on your device until you explicitly save it to our backend or remove it

### Backend Storage
- When you save events, they are transmitted securely (HTTPS) to our backend server
- Events are stored in a PostgreSQL database with industry-standard security measures
- We implement reasonable security practices to protect your data from unauthorized access

### Data Retention
- Events remain in your local storage until you clear them or remove the extension
- Events saved to the backend are retained until you request deletion
- You can delete individual events or all your data at any time

## User Rights and Data Control

You have the right to:
- **Access Your Data**: View all detected and saved events through the extension interface
- **Delete Your Data**: Remove events from local storage or backend at any time
- **Export Your Data**: Download your events in standard ICS calendar format
- **Opt-Out**: Disable the extension's capture mode or uninstall the extension entirely

### How to Delete Your Data
1. **Local Data**: Click "Remove" on any detected event in the extension popup
2. **Backend Data**: Contact us at hemrajsoyal10@gmail.com to request complete data deletion
3. **Complete Removal**: Uninstall the extension to remove all local data

## Permissions Explanation

Orbit requires the following Chrome permissions:

- **storage**: Store detected events locally in your browser
- **notifications**: Send notifications about captured events (optional feature)
- **scripting**: Inject content scripts to enable keyboard shortcuts for event capture
- **activeTab**: Access the current tab's content when you explicitly trigger event capture
- **host_permissions (https://\*/)**: Access webpage content to extract event information when you use the extension

**Important:** We only access page content when you explicitly use the extension features (keyboard shortcut or "Import this tab" button). We do NOT continuously monitor or track your browsing.

## Children's Privacy

Orbit is not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Significant changes will be communicated through:
- Extension update notifications
- Email notification (if we have your contact information)

Continued use of the extension after changes constitutes acceptance of the updated policy.

## International Users

Our backend servers may be located in different countries. By using Orbit, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection laws.

## Contact Information

If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact:

**Developer:** Hemraj Soyal  
**Email:** hemrajsoyal10@gmail.com  
**GitHub:** [@hsoyal-dot](https://github.com/hsoyal-dot)  
**LinkedIn:** [Hemraj Soyal](https://www.linkedin.com/in/hsoyal-dot/)

## Data Processing Legal Basis

We process your data based on:
1. **Consent**: You explicitly choose to use the extension and trigger event capture
2. **Legitimate Interest**: Providing the core functionality you requested
3. **Contract Performance**: Delivering the services the extension promises

## Your Consent

By using Orbit, you consent to:
- The collection and use of information as described in this Privacy Policy
- The transmission of text snippets to Google Gemini AI for event extraction
- The storage of event data on our backend servers when you choose to save events

---

**Summary:** Orbit only collects the information necessary to provide event detection and calendar management features. We do not sell, share, or use your data for advertising purposes. Your privacy and data security are important to us.
