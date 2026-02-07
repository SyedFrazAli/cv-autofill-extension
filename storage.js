// Storage wrapper for Chrome extension storage API
const CVStorage = {
  // Save CV data to Chrome storage
  async save(cvData) {
    try {
      await chrome.storage.local.set({ cvData });
      return { success: true };
    } catch (error) {
      console.error('Error saving CV data:', error);
      return { success: false, error: error.message };
    }
  },

  // Retrieve CV data from Chrome storage
  async load() {
    try {
      const result = await chrome.storage.local.get('cvData');
      return { success: true, data: result.cvData || null };
    } catch (error) {
      console.error('Error loading CV data:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear CV data from storage
  async clear() {
    try {
      await chrome.storage.local.remove('cvData');
      return { success: true };
    } catch (error) {
      console.error('Error clearing CV data:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if CV data exists
  async exists() {
    const result = await this.load();
    return result.success && result.data !== null;
  }
};
