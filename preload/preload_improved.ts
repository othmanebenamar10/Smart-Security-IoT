/**
 * Preload Script - Secure IPC Bridge
 * @author BENAMAR Othmane
 * @secure Restricted IPC channel access with validation
 */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Whitelist of allowed IPC channels
const allowedChannels = {
  send: ['secure:ping', 'secure:fetch-state'],
  receive: ['face-event', 'log-update']
};

/**
 * Validate channel name against whitelist
 */
function isChannelAllowed(channel: string, type: 'send' | 'receive'): boolean {
  if (typeof channel !== 'string' || !channel.trim()) {
    console.error('Invalid channel: must be a non-empty string');
    return false;
  }
  return allowedChannels[type].includes(channel);
}

/**
 * Expose secure API to renderer process
 */
contextBridge.exposeInMainWorld('secureAPI', {
  /**
   * Send message to main process
   * @param channel Channel name (must be whitelisted)
   * @param payload Optional payload to send
   * @returns Promise resolving to response
   */
  send: (channel: string, payload?: unknown): Promise<unknown> => {
    if (!isChannelAllowed(channel, 'send')) {
      console.error(`IPC channel not allowed: ${channel}`);
      throw new Error(`IPC channel '${channel}' is not allowed`);
    }
    
    try {
      return ipcRenderer.invoke(channel, payload);
    } catch (error) {
      console.error(`IPC send error on channel '${channel}':`, error);
      throw error;
    }
  },

  /**
   * Listen for messages from main process
   * @param channel Channel name (must be whitelisted)\n   * @param callback Function to call when message received\n   * @returns Unsubscribe function\n   */\n  receive: (channel: string, callback: (data: unknown) => void): (() => void) => {\n    if (!isChannelAllowed(channel, 'receive')) {\n      console.error(`IPC channel not allowed: ${channel}`);\n      throw new Error(`IPC channel '${channel}' is not allowed`);\n    }\n\n    try {\n      const listener = (_event: IpcRendererEvent, data: unknown) => {\n        try {\n          callback(data);\n        } catch (error) {\n          console.error(`Error in IPC listener for channel '${channel}':`, error);\n        }\n      };\n\n      ipcRenderer.on(channel, listener);\n\n      // Return unsubscribe function\n      return () => {\n        ipcRenderer.removeListener(channel, listener);\n      };\n    } catch (error) {\n      console.error(`IPC receive error on channel '${channel}':`, error);\n      throw error;\n    }\n  }\n});\n\n// Type declaration for TypeScript\ndeclare global {\n  interface Window {\n    secureAPI: {\n      send: (channel: string, payload?: unknown) => Promise<unknown>;\n      receive: (channel: string, callback: (data: unknown) => void) => () => void;\n    };\n  }\n}
