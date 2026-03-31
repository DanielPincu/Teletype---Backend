import { queue } from './matchmaking.state.js'

export function removeFromQueue(id) {
  const idx = queue.findIndex(s => s.id === id)
  if (idx !== -1) queue.splice(idx, 1)
}

export function pair(a, b) {
  a.peer = b.id
  b.peer = a.id
}

export function findAvailablePeer(ws) {
  while (queue.length > 0) {
    const peer = queue.shift()

    if (!peer || peer.id === ws.id || peer.peer) continue

    return peer
  }
}