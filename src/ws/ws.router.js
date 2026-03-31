

export function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'find-peer':
      return matchmakingController.findPeer(ws)

    case 'join-room':
      return matchmakingController.joinRoom(ws, msg.roomId)

    case 'leave':
      return matchmakingController.leave(ws)

    case 'offer':
    case 'answer':
    case 'ice-candidate':
      return signalController.forward(ws, msg)

    default:
      console.log('Unknown message:', msg.type)
  }
}