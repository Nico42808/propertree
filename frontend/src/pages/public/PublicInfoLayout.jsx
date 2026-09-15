import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const PublicInfoLayout = ({ eyebrow, title, intro, children, ctaLabel = 'Back to Propertree', ctaTo = '/' }) => {
  return (
    <section className="bg-propertree-cream-100 px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-propertree-dark transition hover:text-propertree-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-propertree-dark sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
              {intro}
            </p>
          )}
        </div>

        <div className="mt-12 space-y-8">
          {children}
        </div>

        <div className="mt-14 border-t border-propertree-cream-300 pt-8">
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 font-semibold text-propertree-dark transition hover:text-propertree-green"
          >
            {ctaLabel}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PublicInfoLayout
