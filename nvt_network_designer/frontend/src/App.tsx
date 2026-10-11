import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges,
  type Connection, type Edge, type Node, type NodeChange, type EdgeChange
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Save, RefreshCw, UploadCloud, Radio, RotateCcw } from 'lucide-react'
import NvtNode, {type NvtNodeData} from './NvtNode'
import CommissionDialog from './CommissionDialog'
import {api} from './api'
import type {Binding, LiveValue, NetworkDevice, ProjectData} from './types'
import './styles.css'

const nodeTypes = { nvt: NvtNode }

function parseHandle(handle:string|null|undefined) {
  if (!handle) return null
  const [kind,id] = handle.split(':')
  return {kind,varId:Number(id)}
}

function bindingId(s:number,sv:number,t:number,tv:number) {
  return `${s}:${sv}->${t}:${tv}`
}

export default function App() {
  const [devices,setDevices]=useState<NetworkDevice[]>([])
  const [nodes,setNodes]=useState<Node<NvtNodeData>[]>([])
  const [edges,setEdges]=useState<Edge[]>([])
  const [live,setLive]=useState<LiveValue[]>([])
  const [activeBindings,setActiveBindings]=useState<string[]>([])
  const [status,setStatus]=useState({mode:'?',version:'?'})
  const [commissionDevice,setCommissionDevice]=useState<NetworkDevice|null>(null)
  const [message,setMessage]=useState('Gotowy')
  const [projectName,setProjectName]=useState('My NVT Network')

  const profilesByDevice = useMemo(() => new Map(devices.map(d=>[d.uuid,d])), [devices])

  const renameDevice = useCallback((device:NetworkDevice) => {
    const current=device.name || `Node ${device.node_id ?? ''}`.trim()
    const next=window.prompt('Nazwa noda / urządzenia w Home Assistant:', current)
    if(next===null) return
    const name=next.trim()
    if(!name) return
    setDevices(ds=>ds.map(d=>d.uuid===device.uuid?{...d,name}:d))
    setNodes(ns=>ns.map(n=>n.id===device.uuid?{
      ...n,
      data:{...n.data,device:{...n.data.device,name}}
    }:n))
    setMessage(`Nazwa zmieniona na: ${name}. Kliknij Deploy, aby zsynchronizować Home Assistant.`)
  }, [])

  const toNodes = useCallback((ds:NetworkDevice[], previous?:Node<NvtNodeData>[]) => {
    const pos = new Map((previous||[]).map(n=>[n.id,n.position]))
    return ds.map((d,i) => ({
      id:d.uuid,
      type:'nvt',
      position: pos.get(d.uuid) || {x:80+(i%3)*430,y:80+Math.floor(i/3)*380},
      data:{device:d,live,onCommission:setCommissionDevice,onRename:renameDevice}
    }))
  }, [live, renameDevice])

  useEffect(() => {
    Promise.all([api.status(), api.discover(), api.loadProject()])
      .then(([s,ds,p]) => {
        setStatus(s); setProjectName(p.name || 'My NVT Network')
        const savedNames = new Map(p.nodes.map(n=>[n.uuid,n.name]))
        const mergedDs = ds.map(d=>({...d,name:savedNames.get(d.uuid) || d.name}))
        setDevices(mergedDs)
        const positionMap = new Map(p.nodes.map(n=>[n.uuid,{x:n.x,y:n.y}]))
        const nn = mergedDs.map((d,i)=>({
          id:d.uuid,type:'nvt',
          position:positionMap.get(d.uuid)||{x:80+(i%3)*430,y:80+Math.floor(i/3)*380},
          data:{device:d,live:[],onCommission:setCommissionDevice,onRename:renameDevice}
        })) as Node<NvtNodeData>[]
        setNodes(nn)
        const devByNode = new Map(ds.filter(d=>d.node_id!=null).map(d=>[d.node_id!,d]))
        const ee:Edge[] = (p.bindings||[]).flatMap(b=>{
          const sdev=devByNode.get(b.source_node), tdev=devByNode.get(b.target_node)
          if(!sdev||!tdev) return []
          return [{
            id:b.id,
            source:sdev.uuid,
            sourceHandle:`out:${b.source_var}`,
            target:tdev.uuid,
            targetHandle:`in:${b.target_var}`,
            animated:false,
            className:'binding-idle',
            data:{binding:b}
          }]
        })
        setEdges(ee)
      })
      .catch(e=>setMessage(`Błąd startu: ${e.message}`))
  }, [])

  useEffect(() => {
    setNodes(prev => prev.map(n => ({
      ...n,
      data:{...n.data, device:profilesByDevice.get(n.id) || n.data.device, live}
    })))
  }, [devices, live, profilesByDevice])

  useEffect(() => {
    const active = new Set(activeBindings)
    setEdges(prev => prev.map(e => ({
      ...e,
      animated: active.has(e.id),
      className: active.has(e.id) ? 'binding-active' : 'binding-idle'
    })))
  }, [activeBindings])

  useEffect(() => {
    const poll = () => api.runtime().then(r => {
      setLive(r.values)
      setActiveBindings(r.active_bindings)
    }).catch(()=>{})
    poll()
    const timer=setInterval(poll,500)
    return ()=>clearInterval(timer)
  }, [])

  const refresh = async () => {
    try {
      const ds=await api.discover()
      const oldNames=new Map(devices.map(d=>[d.uuid,d.name]))
      const merged=ds.map(d=>({...d,name:oldNames.get(d.uuid)||d.name}))
      setDevices(merged)
      setNodes(prev=>toNodes(merged,prev))
      setMessage(`Discovery: ${ds.length} urządzeń`)
    } catch(e) { setMessage(`Discovery error: ${String(e)}`) }
  }

  const getVariable = (dev:NetworkDevice, varId:number) => dev.variables.find(v=>v.var_id===varId)

  const onConnect = useCallback((c:Connection) => {
    const sp=parseHandle(c.sourceHandle), tp=parseHandle(c.targetHandle)
    const sd=devices.find(d=>d.uuid===c.source), td=devices.find(d=>d.uuid===c.target)
    if(!sp||!tp||!sd||!td||sd.node_id==null||td.node_id==null) {
      setMessage('Binding wymaga dwóch commissioned nodów.')
      return
    }
    const sv=getVariable(sd,sp.varId), tv=getVariable(td,tp.varId)
    if(!sv||!tv) return
    if(sv.nvt_type!==tv.nvt_type) {
      setMessage(`Niezgodne typy: ${sv.nvt_type} → ${tv.nvt_type}`)
      return
    }
    const b:Binding={
      id:bindingId(sd.node_id,sv.var_id,td.node_id,tv.var_id),
      source_node:sd.node_id,source_var:sv.var_id,target_node:td.node_id,target_var:tv.var_id,
      operation:'COPY'
    }
    setEdges(es => {
      if(es.some(e=>e.id===b.id)) return es
      return addEdge({...c,id:b.id,data:{binding:b},animated:false,className:'binding-idle'},es)
    })
    setMessage(`${sd.node_id}.${sv.name} → ${td.node_id}.${tv.name}`)
  }, [devices])

  const onNodesChange = useCallback((ch:NodeChange[])=>setNodes(n=>applyNodeChanges(ch,n) as Node<NvtNodeData>[]),[])
  const onEdgesChange = useCallback((ch:EdgeChange[])=>setEdges(e=>applyEdgeChanges(ch,e)),[])

  const currentProject = ():ProjectData => ({
    version:1,
    name:projectName,
    network:{},
    nodes:nodes.map(n=>({
      uuid:n.id,
      node_id:n.data.device.node_id,
      profile_id:n.data.device.profile_id,
      name:n.data.device.name || `Node ${n.data.device.node_id}`,
      x:n.position.x,y:n.position.y
    })),
    bindings:edges.map(e=>e.data?.binding as Binding).filter(Boolean)
  })

  const save = async () => {
    await api.saveProject(currentProject())
    setMessage('Projekt zapisany w /data.')
  }

  const deploy = async () => {
    try {
      await save()
      const r=await api.deploy(currentProject())
      setMessage(`Deploy OK: ${r.bindings} bindingów do ${r.nodes} nodów · runtime aktywny`)
    } catch(e) { setMessage(`Deploy error: ${String(e)}`) }
  }

  const commission = async (nodeId:number) => {
    if(!commissionDevice) return
    const updated=await api.commission(commissionDevice.uuid,nodeId)
    setDevices(ds=>ds.map(d=>d.uuid===updated.uuid?updated:d))
    setCommissionDevice(null)
    setMessage(`UUID ${updated.uuid.slice(-8)} → NODE ${nodeId}`)
  }

  const resetSim = async () => {
    if(!confirm('Zresetować symulator i usunąć commissioning symulowanych nodów?')) return
    await api.resetSimulator()
    setEdges([])
    await refresh()
    setMessage('Symulator zresetowany.')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>NVT Network Designer</h1>
          <div className="sub">React Flow · {status.mode} · v{status.version}</div>
        </div>
        <input className="project-name" value={projectName} onChange={e=>setProjectName(e.target.value)} />
        <div className="actions">
          <button onClick={refresh}><RefreshCw size={17}/> Discovery</button>
          <button onClick={save}><Save size={17}/> Save</button>
          <button className="primary-btn" onClick={deploy}><UploadCloud size={17}/> Deploy</button>
          {status.mode==='simulator' && <button onClick={resetSim}><RotateCcw size={17}/> Reset sim</button>}
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <h3>Sieć</h3>
          <div className="metric"><span>Urządzenia</span><b>{devices.length}</b></div>
          <div className="metric"><span>Commissioned</span><b>{devices.filter(d=>d.commissioned).length}</b></div>
          <div className="metric"><span>Bindings</span><b>{edges.length}</b></div>
          <div className="tip">
            <Radio size={18}/>
            <div><b>Binding</b><br/>Przeciągnij uchwyt z prawej strony zmiennej publikowanej na lewy uchwyt zmiennej odbiorczej. Typ NVT musi być zgodny.</div>
          </div>
          <h3>Legenda</h3>
          <div className="legend-row"><span className="dot pub"/> publisher</div>
          <div className="legend-row"><span className="dot sub"/> subscriber</div>
          <div className="legend-row"><span className="dot both"/> oba kierunki</div>
        </aside>

        <main className="flow-wrap">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            minZoom={0.25}
            maxZoom={1.8}
            deleteKeyCode={['Backspace','Delete']}
          >
            <Background gap={24} size={1}/>
            <MiniMap pannable zoomable/>
            <Controls/>
          </ReactFlow>
          <div className="statusbar">{message}</div>
        </main>
      </div>

      <CommissionDialog
        device={commissionDevice}
        usedIds={devices.flatMap(d=>d.node_id==null?[]:[d.node_id])}
        onClose={()=>setCommissionDevice(null)}
        onConfirm={commission}
      />
    </div>
  )
}
