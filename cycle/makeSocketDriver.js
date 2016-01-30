import io from 'socket.io-client'
import { Observable } from 'rx'

export default function makeSocketDriver(url) {
  const socket = io.connect(url)

  function get(type) {
    return Observable.create(observer => {
      const sub = socket.on(type, data => observer.onNext(data))
      return function dispose() {
        sub.dispose()
      }
    }).shareReplay(1)
  }

  return function socketDriver(emit$) {
    emit$.subscribe(({ type, message }) => {
      socket.emit(type, message)
    })

    return {
      get,
      dispose: socket.destroy.bind(socket)
    }
  }
}
