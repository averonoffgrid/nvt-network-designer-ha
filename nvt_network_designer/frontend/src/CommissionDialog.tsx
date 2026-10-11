import {useEffect, useState} from 'react'
import type {NetworkDevice} from './types'

export default function CommissionDialog({
  device, usedIds, onClose, onConfirm
}:{
  device:NetworkDevice|null
  usedIds:number[]
  onClose:()=>void
  onConfirm:(nodeId:number)=>Promise<void>
}) {
  const [id,setId]=useState('1')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)

  useEffect(() => {
    if (!device) return
    let n=1
    while (usedIds.includes(n)) n++
    setId(String(n))
    setError('')
  }, [device, usedIds])

  if (!device) return null
  const submit = async () => {
    const n=Number(id)
    if (!Number.isInteger(n) || n < 1 || n > 65534) return setError('NODE_ID musi być w zakresie 1…65534.')
    if (usedIds.includes(n)) return setError('Ten NODE_ID jest już używany.')
    setBusy(true)
    try { await onConfirm(n) }
    catch(e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>Commissioning</h2>
        <p><b>UUID:</b> {device.uuid}</p>
        <p><b>Profil:</b> {device.profile_name}</p>
        <label>NODE_ID
          <input value={id} onChange={e=>setId(e.target.value)} inputMode="numeric" />
        </label>
        {error && <div className="error">{error}</div>}
        <div className="dialog-actions">
          <button onClick={onClose} disabled={busy}>Anuluj</button>
          <button className="primary-btn" onClick={submit} disabled={busy}>
            {busy ? 'Zapisywanie…' : 'Commission'}
          </button>
        </div>
      </div>
    </div>
  )
}
