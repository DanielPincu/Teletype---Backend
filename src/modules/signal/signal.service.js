import { sockets } from '../matchmaking/matchmaking.state.js'

export function getTarget(targetId) {
  return sockets.get(targetId)
}