import * as service from './matchmaking.service.js'
import { sockets, queue, rooms } from './matchmaking.state.js'
import { send } from '../../utils/ws.send.js'

export const matchmakingController = {
  findPeer(ws) {
    service.removeFromQueue(ws.id)

    if (ws.peer) {
      return send(ws, { type: 'already-paired', peerId: ws.peer })
    }

    const peer = service.findAvailablePeer(ws)

    if (peer && peer.readyState === 1 && !peer.peer) {
      // remove both from queue just in case
      service.removeFromQueue(peer.id)
      service.removeFromQueue(ws.id)

      service.pair(ws, peer)

      send(ws, { type: 'peer-found', peerId: peer.id, initiator: true })
      send(peer, { type: 'peer-found', peerId: ws.id, initiator: false })
      return
    }

    service.addToQueue(ws)
    send(ws, { type: 'queued' })
  },

  joinRoom(ws, roomId) {
    if (!roomId || typeof roomId !== 'string') {
      return send(ws, { type: 'error', message: 'Invalid roomId' })
    }

    if (!rooms.has(roomId)) rooms.set(roomId, [])

    const room = rooms.get(roomId)

    const peer = room.find(s => s.id !== ws.id && !s.peer)

    if (peer && peer.readyState === 1 && !peer.peer) {
      service.pair(ws, peer)

      send(ws, { type: 'peer-found', peerId: peer.id, initiator: true })
      send(peer, { type: 'peer-found', peerId: ws.id, initiator: false })
      return
    }

    room.push(ws)
    send(ws, { type: 'waiting-in-room', roomId })
  },

  leave(ws) {
    service.unpair(ws, sockets)
    service.removeFromQueue(ws.id)
    send(ws, { type: 'left' })
  }
}