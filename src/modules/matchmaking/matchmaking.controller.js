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

    // remove from queue always
    service.removeFromQueue(ws.id)

    // remove from ANY existing room (prevents ghost membership)
    for (const [rid, arr] of rooms.entries()) {
      const filtered = arr.filter(s => s.id !== ws.id && s.readyState === 1)
      if (filtered.length === 0) rooms.delete(rid)
      else rooms.set(rid, filtered)
    }

    if (!rooms.has(roomId)) rooms.set(roomId, [])

    // clean stale sockets
    let room = rooms.get(roomId).filter(s => s.readyState === 1)

    // avoid duplicates
    room = room.filter(s => s.id !== ws.id)

    // enforce max 2 users
    if (room.length >= 2) {
      rooms.set(roomId, room)
      return send(ws, { type: 'room-busy', roomId })
    }

    // if exactly one user is in room → pair
    if (room.length === 1) {
      const peer = room[0]

      if (peer && peer.readyState === 1 && !peer.peer) {
        room.push(ws)
        rooms.set(roomId, room)

        service.pair(ws, peer)

        send(ws, { type: 'peer-found', peerId: peer.id, initiator: true })
        send(peer, { type: 'peer-found', peerId: ws.id, initiator: false })
        return
      }
    }

    // otherwise join and wait
    room.push(ws)
    rooms.set(roomId, room)

    send(ws, { type: 'waiting-in-room', roomId })
  },

  leave(ws) {
    // capture peer before unpairing
    const peerId = ws.peer
    const peer = peerId ? sockets.get(peerId) : null

    // unpair both sides
    service.unpair(ws, sockets)
    service.removeFromQueue(ws.id)

    // remove both users from rooms and clean rooms
    for (const [roomId, arr] of rooms.entries()) {
      const filtered = arr.filter(s => s.id !== ws.id && s.readyState === 1)

      // if peer exists, also remove peer from this room
      const final = peer ? filtered.filter(s => s.id !== peer.id) : filtered

      if (final.length === 0) rooms.delete(roomId)
      else rooms.set(roomId, final)
    }

    // notify the leaving user
    send(ws, { type: 'left' })

    // notify the peer (if any) that the other side left
    if (peer && peer.readyState === 1) {
      send(peer, { type: 'peer-left' })
    }
  }
}