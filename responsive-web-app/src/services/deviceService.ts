import type { Device } from '../types/device';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export async function getDevices(): Promise<Device[]> {
  const res = await fetch(`${API_URL}/devices`);
  const json = await res.json();
  if (json.success) return json.data;
  throw new Error(json.error || 'Failed to fetch devices');
}

export async function createDevice(device: Partial<Device>): Promise<Device> {
  const res = await fetch(`${API_URL}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device)
  });
  const json = await res.json();
  if (json.success) return json.data;
  throw new Error(json.error || 'Failed to create device');
}

export async function deleteDevice(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/devices/${id}`, {
    method: 'DELETE'
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete device');
}
