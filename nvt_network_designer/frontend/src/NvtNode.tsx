import { useEffect } from 'react'
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps
} from '@xyflow/react'
import type { NetworkDevice, LiveValue } from './types'

export type NvtNodeData = {
  device: NetworkDevice
  live: LiveValue[]
  onCommission: (device: NetworkDevice) => void
  onRename: (device: NetworkDevice) => void
}

function valueFor(live:LiveValue[], nodeId:number|null, varId:number) {
  if (nodeId == null) return undefined
  return live.find(v => v.node_id === nodeId && v.var_id === varId)?.value
}

export default function NvtNode({id, data, selected}:NodeProps) {
  const {device, live, onCommission, onRename} = data as NvtNodeData
  const updateNodeInternals = useUpdateNodeInternals()

  /*
   * A node is initially EMPTY and gains handles after commissioning.
   * React Flow requires node internals to be recalculated when handles are
   * added/removed dynamically.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(() => updateNodeInternals(id))
    return () => cancelAnimationFrame(frame)
  }, [
    id,
    device.commissioned,
    device.profile_id,
    device.profile_version,
    device.variables.length,
    updateNodeInternals
  ])

  const state = device.online ? 'ONLINE' : 'OFFLINE'

  if (!device.commissioned) {
    return (
      <div className={`nvt-node empty ${selected ? 'selected' : ''}`}>
        <div className="node-head">
          <div>
            <strong>EMPTY NODE</strong>
            <small>{device.profile_name}</small>
          </div>
          <span className="state online">DISCOVERED</span>
        </div>
        <div className="empty-body">
          <div className="uuid">{device.uuid}</div>
          <div className="meta">FW {device.fw_version} · profile {device.profile_id}</div>
          <button className="primary-btn nodrag" onClick={() => onCommission(device)}>
            Commission
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`nvt-node ${selected ? 'selected' : ''}`}>
      <div className="node-head">
        <div className="node-title-block">
          <strong>{device.name || `Node ${device.node_id}`}</strong>
          <small>NODE {device.node_id} · {device.profile_name}</small>
        </div>
        <button
          className="rename-btn nodrag"
          title="Zmień nazwę noda"
          onClick={(e) => { e.stopPropagation(); onRename(device) }}
        >✎</button>
        <span className={`state ${device.online ? 'online':'offline'}`}>{state}</span>
      </div>

      <div className="var-head">
        <span></span>
        <span>Zmienna</span>
        <span>Typ NVT</span>
        <span>Live</span>
        <span></span>
      </div>

      <div className="vars">
        {device.variables.map(v => {
          const val = valueFor(live, device.node_id, v.var_id)
          const canReceive = v.direction === 'subscribe' || v.direction === 'both'
          const canPublish = v.direction === 'publish' || v.direction === 'both'

          return (
            <div className="var-row" key={v.var_id}>
              <div className="port-slot port-slot-in">
                {canReceive && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`in:${v.var_id}`}
                    className="nvt-handle nvt-handle-target"
                    isConnectable={true}
                    title={`Odbiornik: ${v.name} (${v.nvt_type})`}
                  >
                    <span className="nvt-port-dot nvt-port-dot-target" />
                  </Handle>
                )}
              </div>

              <span className="var-name">{v.name}<em>#{v.var_id}</em></span>
              <span className="var-type">{v.nvt_type}</span>
              <span className="var-live">{val === undefined ? '—' : String(val)}</span>

              <div className="port-slot port-slot-out">
                {canPublish && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`out:${v.var_id}`}
                    className="nvt-handle nvt-handle-source"
                    isConnectable={true}
                    title={`Publisher: ${v.name} (${v.nvt_type})`}
                  >
                    <span className="nvt-port-dot nvt-port-dot-source" />
                  </Handle>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
