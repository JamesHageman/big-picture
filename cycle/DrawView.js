import { Observable } from 'rx'
import { div, canvas, span, img } from 'cycle-snabbdom'

function createBackBuffer(width, height) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  return ctx
}

function Array2d(outer, inner, initial = 0) {
  let grid = new Array(outer)

  for (let y = 0; y < outer; y++) {
    grid[y] = new Array(inner)
    for (let x = 0; x < inner; x++) {
      grid[y][x] = initial
    }
  }

  return grid
}

function createShape(renderFromContextFn) {
  return (props) => span({
    props: {
      shapeProps: props,
      renderFromContext: renderFromContextFn
    }
  })
}

const Image = createShape(
  (ctx, { src, x = 0, y = 0 }) => {
    ctx.drawImage(src, x, y)
  }
)

const FillRect = createShape(
  (ctx, { x, y, width, height, fillColor = 'black' }) => {
    ctx.fillStyle = fillColor
    ctx.fillRect(x, y, width, height)
  }
)

const Line = createShape(
  (ctx, { x1, y1, x2, y2, color = 'black', width = '1px' }) => {
    ctx.strokeStyle = color
    ctx.strokeWidth = width
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
)

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

function Canvas(elemProps, children = []) {
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

function createGridLines(dimensions) {
  const { width, height, division } = dimensions

  let lines = []
  for (let y = 0; y < height; y += division) {
    lines.push(Line({
      x1: 0, x2: width,
      y1: y, y2: y,
      color: '#ccc',
      width: '1px'
    }))

    for (let x = 0; x < width; x += division) {
      lines.push(Line({
        x1: x, x2: x,
        y1: 0, y2: height,
        color: '#ccc',
        width: '1px'
      }))
    }
  }

  return lines
}

function view(state$, gridBuffer$, pixelBuffer$) {
  return state$.combineLatest(gridBuffer$, pixelBuffer$)
  .map(([state, grid, pixels]) => {
    return div('.draw-view', {
      style: {
        position: 'relative'
      }
    }, [
      Canvas({
        props: {
          id: 'canvas',
          width: state.dimensions.width,
          height: state.dimensions.height
        },
        style: {
          position: 'absolute',
          top: 0,
          left: 0
        }
      }, [
        Image({ src: pixels }),
        Image({ src: grid }),
      ]),

      img('.image-overlay', {
        props: {
          src: '/image/56aa3729768a0438fde53adc/2/0',
          width: state.dimensions.width,
          height: state.dimensions.height,
        },
        style: {
          position: 'absolute',
          cursor: 'pointer',
          top: '0px',
          left: '0px',
          opacity: 0.5
        }
      })
    ])
  }
  )
}

function DrawView({ DOM }) {
  const image = DOM.select('.image-overlay')

  const preventDefault$ = Observable.merge(
    image.events('mousedown'),
    image.events('mousemove')
  )

  const colors$ = Observable.of(['#000000'])
  const selectedColorIndex$ = Observable.of(0)
  const selectedColor$ = colors$.combineLatest(selectedColorIndex$,
    (colors, i) => colors[i]
  )

  const canvasSize$ = Observable.of({ width: 480, height: 480 })
  const division$ = canvasSize$.map(({ width }) => {
    return width / 24
  })

  const dimensions$ = canvasSize$.combineLatest(division$,
    ({ width, height }, division) => ({
      width,
      height,
      division
    })
  )

  const mousedown$ = image.events('mousedown')
  const move$ = image.events('mousemove')
  const mouseup$ = image.events('mouseup')

  const dragev$ = mousedown$.flatMapLatest((e) => {
    return Observable.of(e).merge(
      move$.throttle(1000 / 60.0).takeUntil(mouseup$)
    )
  })

  const drawPos$ = dragev$.withLatestFrom(division$, (e, division) => {
    const x = e.layerX
    const y = e.layerY
    return {
      x: Math.floor(x / division) * division,
      y: Math.floor(y / division) * division
    }
  }).distinctUntilChanged(({ x, y }) => `${x},${y}`)

  const drawStroke$ = drawPos$.bufferWithTime(2000)
    .filter(arr => arr.length > 0)

  const pixels$ = dimensions$.flatMapLatest(dimensions => {
    const { division } = dimensions
    const h = Math.floor(dimensions.height / dimensions.division)
    const w = Math.floor(dimensions.width / dimensions.division)

    const grid = Array2d(h, w, -1)

    return drawStroke$.withLatestFrom(selectedColorIndex$)
    .scan((grid, [pixels, color]) => {
      pixels.forEach(({ x, y }) => {
        try {
          grid[y / division][x / division] = color
        } catch (e) {}
      })
      return grid
    }, grid)
  })

  const drawWithColor$ = drawPos$
    .withLatestFrom(selectedColor$, ({ x, y }, color) => ({
      x,
      y,
      color
    })
  )

  const pixelBuffer$ = dimensions$.flatMapLatest(
    ({ width, height, division }) => {
      const ctx = createBackBuffer(width, height)

      return Observable.of(ctx).merge(drawWithColor$)
        .scan((ctx, { x, y, color }) => {
          const children = [
            FillRect({
              x: x,
              y: y,
              width: division,
              height: division,
              fillColor: color
            })
          ]

          drawChildren(ctx, children)

          return ctx
        })
        .map(ctx => ctx.canvas)
    }
  )

  const initial$ = Observable.of({
    x: 0,
    y: 100,
    dimensions: { width: 0, height: 0, division: 1 }
  })

  const gridBuffer$ = dimensions$.map(dimensions => {
    const children = createGridLines(dimensions)
    const ctx = createBackBuffer(dimensions.width, dimensions.height)

    drawChildren(ctx, children)
    return ctx.canvas
  })

  const drawMod$ = drawPos$.map(({ x, y }) => function(state) {
    state.x = x
    state.y = y
    return state
  })

  const sizeMod$ = dimensions$.map(
    ({ width, height, division }) => function(state) {
      state.dimensions = {
        width,
        height,
        division
      }
      return state
    }
  )

  const mod$ = Observable.merge(drawMod$, sizeMod$)

  const state$ = initial$.merge(mod$).scan((state, modFn) => modFn(state))

  const vtree$ = view(state$, gridBuffer$, pixelBuffer$)

  return {
    DOM: vtree$,
    log: state$,
    preventDefault: preventDefault$,
    pixels: pixels$
  }
}

export default DrawView
