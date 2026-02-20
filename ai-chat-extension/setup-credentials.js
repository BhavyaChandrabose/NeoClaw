// Quick setup script to save NeoClaw credentials
// Run this in the extension's popup or settings page console

(async function setupNeoClawCredentials() {
  console.log('🔧 Setting up NeoClaw credentials...');
  
  const credentials = {
    neoClawUrl: 'https://ai-hacker-neoclaw.securebrowser.com',
    neoClawToken: 'kOwC16C2Y6vhu1RrLz2s7wwpJAFfBwPhCcIZ8ym8nSWsgooF'
  };
  
  // Get current settings
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  
  if (response.success) {
    const currentSettings = response.data;
    console.log('📋 Current settings:', currentSettings);
    
    // Merge with credentials
    const updatedSettings = {
      ...currentSettings,
      ...credentials
    };
    
    // Save updated settings
    const saveResponse = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: updatedSettings
    });
    
    if (saveResponse.success) {
      console.log('✅ NeoClaw credentials saved successfully!');
      console.log('📝 URL:', credentials.neoClawUrl);
      console.log('🔑 Token:', credentials.neoClawToken.substring(0, 20) + '...');
      
      // Verify
      const verifyResponse = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (verifyResponse.success) {
        console.log('✔️ Verification:', {
          url: verifyResponse.data.neoClawUrl,
          tokenSet: !!verifyResponse.data.neoClawToken
        });
      }
    } else {
      console.error('❌ Failed to save settings:', saveResponse.error);
    }
  } else {
    console.error('❌ Failed to get current settings:', response.error);
  }
})();
