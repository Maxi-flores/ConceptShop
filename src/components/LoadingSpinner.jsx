import Lottie from 'lottie-react'
import { useTheme } from '../context/ThemeContext'

// Inline Lottie animation data (loading spinner)
const loadingAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "Loading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle 1",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] },
            { t: 120, s: [360] }
          ]
        },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [80, 80] },
              p: { a: 0, k: [0, 0] },
              nm: "Ellipse"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.055, 0.647, 0.914, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 8 },
              lc: 2,
              lj: 1,
              nm: "Stroke",
              d: [
                { n: "d", nm: "dash", v: { a: 0, k: 60 } },
                { n: "g", nm: "gap", v: { a: 0, k: 200 } }
              ]
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Group"
        }
      ],
      ip: 0,
      op: 120,
      st: 0
    }
  ]
}

// Success animation
const successAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Success",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0, 0, 100] },
            { t: 30, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [80, 80] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.063, 0.725, 0.506, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: "Circle Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
}

// Data loading animation
const dataLoadingAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "Data Loading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Bar 1",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [100, 50, 100] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 30, s: [100, 100, 100] },
            { t: 60, s: [100, 50, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "rc", d: 1, s: { a: 0, k: [20, 60] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 4 }, nm: "Rect" },
            { ty: "fl", c: { a: 0, k: [0.055, 0.647, 0.914, 1] }, o: { a: 0, k: 100 }, nm: "Fill" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ],
          nm: "Bar"
        }
      ],
      ip: 0,
      op: 90,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Bar 2",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 15, s: [100, 50, 100] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 45, s: [100, 100, 100] },
            { t: 75, s: [100, 50, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "rc", d: 1, s: { a: 0, k: [20, 60] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 4 }, nm: "Rect" },
            { ty: "fl", c: { a: 0, k: [0.961, 0.773, 0.094, 1] }, o: { a: 0, k: 100 }, nm: "Fill" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ],
          nm: "Bar"
        }
      ],
      ip: 0,
      op: 90,
      st: 0
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Bar 3",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [140, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 30, s: [100, 50, 100] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 60, s: [100, 100, 100] },
            { t: 90, s: [100, 50, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "rc", d: 1, s: { a: 0, k: [20, 60] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 4 }, nm: "Rect" },
            { ty: "fl", c: { a: 0, k: [0.063, 0.725, 0.506, 1] }, o: { a: 0, k: 100 }, nm: "Fill" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ],
          nm: "Bar"
        }
      ],
      ip: 0,
      op: 90,
      st: 0
    }
  ]
}

export function LoadingSpinner({ size = 120, text = '' }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Lottie
        animationData={loadingAnimation}
        loop
        style={{ width: size, height: size }}
      />
      {text && <p className="mt-2 text-slate-400 text-sm">{text}</p>}
    </div>
  )
}

export function DataLoading({ size = 120, text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Lottie
        animationData={dataLoadingAnimation}
        loop
        style={{ width: size, height: size }}
      />
      {text && <p className="mt-2 text-slate-400 text-sm">{text}</p>}
    </div>
  )
}

export function SuccessAnimation({ size = 100 }) {
  return (
    <Lottie
      animationData={successAnimation}
      loop={false}
      style={{ width: size, height: size }}
    />
  )
}

export function PageLoader({ text = 'Loading...' }) {
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-surface-darker' : 'bg-gray-50'}`}>
      <div className="text-center">
        <Lottie
          animationData={loadingAnimation}
          loop
          style={{ width: 150, height: 150 }}
        />
        <p className={`mt-4 text-lg font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
          {text}
        </p>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Please wait...
        </p>
      </div>
    </div>
  )
}

export function CardLoader({ height = 200 }) {
  return (
    <div
      className="flex items-center justify-center bg-surface-card rounded-xl border border-surface-border animate-pulse"
      style={{ height }}
    >
      <DataLoading size={80} text="" />
    </div>
  )
}

export default LoadingSpinner
