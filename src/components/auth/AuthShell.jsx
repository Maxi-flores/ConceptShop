import { Link } from 'react-router-dom'

export default function AuthShell({ children, maxWidth = 'max-w-5xl' }) {
  return (
    <div className="min-h-screen bg-surface-darker flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-darker to-accent-emerald/10" />
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-accent-gold/10 blur-3xl" />

      <div className={`relative w-full ${maxWidth}`}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-emerald flex items-center justify-center">
              <span className="text-white font-bold text-xl">CS</span>
            </div>
            <span className="text-2xl font-bold gradient-text">ConceptSHOP</span>
          </Link>
        </div>

        {children}
      </div>
    </div>
  )
}
