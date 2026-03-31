import { send } from '../../utils/ws.send.js'
import { getTarget } from './signal.service.js'

export const signalController = {
  forward(ws, msg) {
    const target = msg.target || ws.peer
    const peer = getTarget(target)

    if (!peer) {
      return send(ws, {
        type: 'error',
        message: 'Peer not available'
      })
    }

    send(peer, {
      ...msg,
      from: ws.id,
      target
    })
  }
}