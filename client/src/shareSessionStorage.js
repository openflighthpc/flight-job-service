// Share session storage between tabs.
//
// This function should be called when a new tab opens.  It creates a
// `BroadcastChannel` and requests the session data from any other tabs open
// on this origin.  Other tabs respond by with the session data on the same
// `BroadcastChannel`.
//
// The broadcast channel is shared across all tabs on the same origin.  We
// obfuscate the channel name to make it harder for other apps on the same
// origin to sniff the messages.
//
function shareSessionStorage() {
  if (typeof window === 'undefined') { return; }
  if (typeof BroadcastChannel === 'undefined') { return; }

  const channelName = process.env.REACT_APP_CHANNEL_NAME;
  const bc = new BroadcastChannel(channelName);

  if (!sessionStorage.length) {
    bc.postMessage({ key: 'requestSessionStorage' });
  };

  bc.onmessage = function(event) {
    if (event.data.key === 'requestSessionStorage') {
      bc.postMessage({ key: 'sendSessionStorage', value: JSON.stringify(sessionStorage) });
    }
    if (event.data.key === 'sendSessionStorage' && !sessionStorage.length) {
      const data = JSON.parse(event.data.value);
      for (const key in data) {
        sessionStorage.setItem(key, data[key]);
      }
    }
  }
}

export default shareSessionStorage;
