import { WebSocketServer } from 'ws'
import { randomUUID } from 'crypto'
import { handleMessage } from './ws.router.js'
import { sockets } from '../matchmaking/matchmaking.state.js'

export function createWSServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws) => {
    ws.id = randomUUID()
    ws.peer = null

    sockets.set(ws.id, ws)

    console.log('Connected:', ws.id)

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        handleMessage(ws, msg)
      } catch (err) {
        console.error('Invalid message:', err)
      }
    })

    ws.on('close', () => {
      console.log('Disconnected:', ws.id)
      sockets.delete(ws.id)
    })
  })
}