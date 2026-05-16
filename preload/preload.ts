import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const allowedChannels = {
  send: ['secure:ping', 'secure:fetch-state'],
  receive: ['face-event', 'log-update']
} as const;

function isAllowedChannel(channel: string, type: keyof typeof allowedChannels): boolean {
  return allowedChannels[type].includes(channel as never);
}

contextBridge.exposeInMainWorld('secureAPI', {
  send: (channel: string, payload?: unknown) => {
    if (!isAllowedChannel(channel, 'send')) {
      throw new Error('IPC channel not allowed');
    }

    return ipcRenderer.invoke(channel, payload);
  },
  receive: (channel: string, callback: (data: unknown) => void) => {
    if (!isAllowedChannel(channel, 'receive')) {
      throw new Error('IPC channel not allowed');
    }

    const listener = (_event: IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
