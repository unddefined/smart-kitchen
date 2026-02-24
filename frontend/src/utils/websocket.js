import { io } from 'socket.io-client'
import { ref } from 'vue'

const socket = ref(null)
const isConnected = ref(false)
const reconnectAttempts = ref(0)

export function useWebSocket() {
  const connect = (url = 'ws://localhost:3001') => {
    socket.value = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socket.value.on('connect', () => {
      console.log('WebSocket连接成功')
      isConnected.value = true
      reconnectAttempts.value = 0
    })

    socket.value.on('disconnect', () => {
      console.log('WebSocket断开连接')
      isConnected.value = false
    })

    socket.value.on('reconnect', (attemptNumber) => {
      console.log(`重新连接成功，尝试次数: ${attemptNumber}`)
      reconnectAttempts.value = attemptNumber
    })

    socket.value.on('reconnect_failed', () => {
      console.log('重新连接失败')
    })

    // 错误处理
    socket.value.on('connect_error', (error) => {
      console.error('连接错误:', error)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  const sendMessage = (event, data) => {
    if (socket.value && isConnected.value) {
      socket.value.emit(event, data)
    } else {
      console.warn('WebSocket未连接')
    }
  }

  const listen = (event, callback) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  const removeListener = (event, callback) => {
    if (socket.value) {
      socket.value.off(event, callback)
    }
  }

  return {
    socket: socket.value,
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    listen,
    removeListener
  }
}