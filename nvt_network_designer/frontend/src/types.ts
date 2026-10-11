export type VariableDirection = 'publish' | 'subscribe' | 'both'

export interface ProfileVariable {
  var_id: number
  name: string
  nvt_type: string
  direction: VariableDirection
  unit?: string
  description?: string
}

export interface DeviceProfile {
  schema: string
  profile_id: number
  profile_name: string
  name?: string
  profile_version: number
  device_type: number
  description?: string
  variables: ProfileVariable[]
  manifest_crc32?: string
}

export interface NetworkDevice {
  uuid: string
  node_id: number | null
  commissioned: boolean
  online: boolean
  profile_id: number
  profile_version: number
  profile_name: string
  name?: string
  fw_version: string
  hw_version: string
  variables: ProfileVariable[]
}

export interface Binding {
  id: string
  source_node: number
  source_var: number
  target_node: number
  target_var: number
  operation: string
}

export interface ProjectData {
  version: number
  name: string
  network: Record<string, never>
  nodes: Array<{
    uuid: string
    node_id: number | null
    profile_id: number
    name?: string
    x: number
    y: number
  }>
  bindings: Binding[]
}

export interface LiveValue {
  node_id: number
  var_id: number
  value: string | number | boolean | null
  updated_ms: number
}

export interface RuntimeState {
  values: LiveValue[]
  active_bindings: string[]
  now_ms: number
}
