import type { DeviceProfile, NetworkDevice, ProjectData, LiveValue, RuntimeState } from './types'

function apiUrl(path: string) {
  const base = window.location.href.endsWith('/') ? window.location.href : window.location.href + '/'
  return new URL(`api/${path.replace(/^\//, '')}`, base).toString()
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })
  if (!r.ok) {
    const body = await r.text()
    throw new Error(body || `${r.status} ${r.statusText}`)
  }
  return r.json() as Promise<T>
}

export const api = {
  status: () => request<{mode:string, baudrate:number, version:string}>('status'),
  profiles: () => request<DeviceProfile[]>('profiles'),
  discover: () => request<NetworkDevice[]>('network/discover', {method:'POST'}),
  commission: (uuid:string, node_id:number) =>
    request<NetworkDevice>('network/commission', {method:'POST', body: JSON.stringify({uuid,node_id})}),
  live: () => request<LiveValue[]>('network/live'),
  runtime: () => request<RuntimeState>('network/runtime'),
  resetSimulator: () => request<{ok:boolean}>('network/simulator/reset', {method:'POST'}),
  loadProject: () => request<ProjectData>('project'),
  saveProject: (project:ProjectData) =>
    request<{ok:boolean}>('project', {method:'PUT', body: JSON.stringify(project)}),
  deploy: (project:ProjectData) =>
    request<{ok:boolean, nodes:number, bindings:number, details:Record<string,unknown>}>(
      'deploy', {method:'POST', body: JSON.stringify(project)}
    ),
}
