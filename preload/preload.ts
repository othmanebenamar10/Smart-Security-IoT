import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const allowedChannels = {
  send: ['secure:ping', 'secure:fetch-state'],
  receive: ['face-event', 'log-update']
};

contextBridge.exposeInMainWorld('secureAPI', {
  send: (channel: string, payload?: unknown) => {
    if (allowedChannels.send.includes(channel)) {
      return ipcRenderer.invoke(channel, payload);
    }
    throw new Error('IPC channel not allowed');
  },
  receive: (channel: string, callback: (data: unknown) => void) => {
    if (allowedChannels.receive.includes(channel)) {
      const listener = (_event: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
    throw new Error('IPC channel not allowed');
  }
});
