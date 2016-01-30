import { Observable } from 'rx'
import { run } from '@cycle/core'
import { modules, makeDOMDriver, div, h1, canvas, span } from 'cycle-snabbdom'

const {
  StyleModule, PropsModule,
  AttrsModule, ClassModule,
  HeroModule, EventsModule,
} = modules

function createShape(renderFromContextFn) {
  return (props) => span({
    props: {
      shapeProps: props,
      renderFromContext: renderFromContextFn
    }
  })
}

const FillRect = createShape(
  (ctx, { x, y, width, height, fillColor = 'black' }) => {
    ctx.fillStyle = fillColor
    ctx.fillRect(x, y, width, height)
  }
)

const Line = createShape(
  (ctx, { x1, y1, x2, y2, color = 'black' }) => {
    ctx.strokeStyle = color
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
)

function Canvas(elemProps, children = []) {
  const drawChildren = (ctx, children) => {
    children.forEach(child => {
      if (child.data.props && child.data.props.renderFromContext) {
        ctx.save()
        child.data.props.renderFromContext(ctx, child.data.props.shapeProps)
        ctx.restore()
      } else if (child.children.length > 0) {
        drawChildren(ctx, child.children)
      }
    })
  }

  const drawHook = (old, vnode) => {
    const ctx = vnode.elm.getContext('2d')
    ctx.canvas.width = ctx.canvas.width
    drawChildren(ctx, vnode.children)
  }

  const props = Object.assign({}, elemProps, {
    hook: {
      create: drawHook,
      update: drawHook
    }
  })

  return canvas(props, children)
}

function view(state$) {
  return state$.map((state) =>
    div([
      h1('hello, world'),
      Canvas({
        props: {
          id: 'canvas',
          width: state.dimensions.width,
          height: state.dimensions.height
        },
        style: { border: '1px solid #ccc' }
      }, [
        FillRect({ x: state.x, y: state.y, width: 32, height: 24 }),
        Line({ x1: 0, y1: 0, x2: state.x, y2: state.y })
      ])
    ])
  )
}

function main({ DOM }) {
  const canvas = DOM.select('#canvas')

  const canvasSize$ = Observable.of({ width: 480, height: 480 })
  const division$ = canvasSize$.map(({ width }) => {
    return width / 32
  })

  const mousedown$ = canvas.events('mousedown')
  const move$ = canvas.events('mousemove')
  const mouseup$ = canvas.events('mouseup')

  const dragev$ = mousedown$.flatMapLatest(() => {
    return move$.throttle(1000 / 60.0).takeUntil(mouseup$)
  })

  const drawPos$ = dragev$.withLatestFrom(division$, (e, division) => {
    return {
      x: Math.round(e.layerX / division) * division,
      y: Math.round(e.layerY / division) * division
    }
  }).distinctUntilChanged(({ x, y }) => `${x},${y}`)

  const initial$ = Observable.of({
    x: 0,
    y: 100,
    dimensions: { width: 0, height: 0 }
  })

  const drawMod$ = drawPos$.map(({ x, y }) => function(state) {
    state.x = x
    state.y = y
    return state
  })

  const sizeMod$ = canvasSize$.map(({ width, height }) => function(state) {
    state.dimensions = {
      width,
      height
    }
    return state
  })

  const mod$ = Observable.merge(drawMod$, sizeMod$)

  const state$ = initial$.merge(mod$).scan((state, modFn) => modFn(state))

  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    log: state$
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
  log: (any$) => {
    if (process.env.NODE_ENV !== 'production') {
      any$.subscribe(x => console.log(x))
    }
  }
})
