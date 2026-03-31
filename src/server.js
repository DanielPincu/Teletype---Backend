import http from 'http'
import { createWSServer } from './ws/ws.server.js'

const server = http.createServer()

createWSServer(server)

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})