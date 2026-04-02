import { queue } from './matchmaking.state.js'

export function addToQueue(ws) {
  // avoid duplicates in queue
  if (queue.some(p => p.id === ws.id)) return

  // only enqueue if not already paired
  if (!ws.peer) {
    queue.push(ws)
  }
}

export function removeFromQueue(id) {
  const idx = queue.findIndex(s => s.id === id)
  if (idx !== -1) queue.splice(idx, 1)
}

export function pair(a, b) {
  if (!a || !b) return
  if (a.id === b.id) return

  a.peer = b.id
  b.peer = a.id
}

export function findAvailablePeer(ws) {
  while (queue.length > 0) {
    const peer = queue.shift()

    // skip invalid
    if (!peer) continue

    // skip self
    if (peer.id === ws.id) continue

    // skip already paired
    if (peer.peer) continue

    // skip closed sockets
    if (peer.readyState !== 1) continue

    return peer
  }

  return null
}

export function unpair(ws, sockets) {
  if (!ws.peer) return

  const other = sockets.get(ws.peer)

  if (other) {
    other.peer = null
  }

  ws.peer = null
}