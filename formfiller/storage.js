// Storage wrapper for Chrome extension storage API
const CVStorage = {
  // Retrieve all profiles and the active profile ID
  async getProfiles() {
    try {
      const result = await chrome.storage.local.get(['cvProfiles', 'activeProfileId', 'cvData']);
      let profiles = result.cvProfiles || [];
      let activeId = result.activeProfileId || null;

      // Migrate old data if present
      if (result.cvData && profiles.length === 0) {
        const legacyId = Date.now().toString();
        profiles.push({ id: legacyId, name: 'Imported CV', data: result.cvData });
        activeId = legacyId;
        await chrome.storage.local.set({ cvProfiles: profiles, activeProfileId: activeId });
        await chrome.storage.local.remove('cvData');
      }

      return { success: true, profiles, activeId };
    } catch (error) {
      console.error('Error loading profiles:', error);
      return { success: false, error: error.message };
    }
  },

  // Save a specific profile, passing an ID updates it, else it creates a new one
  async saveProfile(name, cvData, id = null) {
    try {
      const { profiles } = await this.getProfiles();
      const profileId = id || Date.now().toString();

      const existingIndex = profiles.findIndex(p => p.id === profileId);
      if (existingIndex >= 0) {
        profiles[existingIndex].name = name;
        profiles[existingIndex].data = cvData;
      } else {
        profiles.push({ id: profileId, name, data: cvData });
      }

      await chrome.storage.local.set({ cvProfiles: profiles, activeProfileId: profileId });
      return { success: true, id: profileId };
    } catch (error) {
      console.error('Error saving profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Change the active profile
  async setActive(id) {
    try {
      await chrome.storage.local.set({ activeProfileId: id });
      return { success: true };
    } catch (error) {
      console.error('Error setting active profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a profile
  async deleteProfile(id) {
    try {
      const { profiles, activeId } = await this.getProfiles();
      const newProfiles = profiles.filter(p => p.id !== id);
      let newActiveId = activeId;
      if (activeId === id) {
        // Find another profile or set to null
        newActiveId = newProfiles.length > 0 ? newProfiles[0].id : null;
      }
      await chrome.storage.local.set({ cvProfiles: newProfiles, activeProfileId: newActiveId });
      return { success: true, newActiveId };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return { success: false, error: error.message };
    }
  },

  // ---------------- Legacy Compatibility Methods ----------------

  // Save CV data to currently active profile
  async save(cvData) {
    const { profiles, activeId } = await this.getProfiles();
    if (activeId) {
      const profile = profiles.find(p => p.id === activeId);
      if (profile) {
        return this.saveProfile(profile.name, cvData, activeId);
      }
    }
    // No active profile? Create a default one.
    return this.saveProfile('My Form', cvData);
  },

  // Retrieve CV data from currently active profile
  async load() {
    const { profiles, activeId } = await this.getProfiles();
    if (activeId) {
      const activeProfile = profiles.find(p => p.id === activeId);
      if (activeProfile) {
        return { success: true, data: activeProfile.data };
      }
    }
    return { success: true, data: null };
  },

  // Clear EVERYTHING
  async clear() {
    try {
      await chrome.storage.local.remove(['cvProfiles', 'activeProfileId', 'cvData']);
      return { success: true };
    } catch (error) {
      console.error('Error clearing CV data:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if active CV data exists
  async exists() {
    const result = await this.load();
    return result.success && result.data !== null;
  }
};
