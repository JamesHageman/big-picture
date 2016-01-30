import { Observable } from 'rx'
import { run } from '@cycle/core'
import isolate from '@cycle/isolate'
import { modules, makeDOMDriver, div, h1 } from 'cycle-snabbdom'
import makeSocketDriver from './makeSocketDriver'
import DrawView from './DrawView'

const {
  StyleModule, PropsModule,
  AttrsModule, ClassModule,
  HeroModule, EventsModule,
} = modules

function view(drawView$) {
  return Observable.of({}).combineLatest(drawView$).map(([, drawView]) =>
    div([
      h1(['app']),
      drawView
    ])
  )
}

function main(sources) {
  const drawView = isolate(DrawView)({ DOM: sources.DOM })

  return {
    DOM: view(drawView.DOM),
    log: drawView.pixels.merge(sources.socket.get('newPicture')),
    preventDefault: drawView.preventDefault
  }
}

run(main, {
  DOM: makeDOMDriver('#root', {
    modules: [
      StyleModule, PropsModule,
      AttrsModule, ClassModule,
      HeroModule, EventsModule
    ]
  }),
  socket: makeSocketDriver('/'),
  log: (any$) => {
    if (process.env.NODE_ENV !== 'production') {
      any$.subscribe(x => console.log(x))
    }
  },
  preventDefault: (e$) => {
    e$.subscribe(e => e.preventDefault())
  }
})
