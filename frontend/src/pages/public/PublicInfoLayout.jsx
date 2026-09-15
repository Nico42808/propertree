import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const publicLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'Careers', to: '/careers' },
  { label: 'Blog', to: '/blog' },
  { label: 'Help Center', to: '/help' },
  { label: 'Contact', to: '/contact' },
]

const PublicInfoLayout = ({
  eyebrow,
  title,
  intro,
  children,
  ctaLabel = 'Back to Propertree',
  ctaTo = '/',
}) => {
  return (
    <div className="bg-white text-propertree-dark">
      {/* HERO — same visual language as the main landing page */}
      <section className="relative overflow-hidden bg-propertree-cream-100 px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="absolute -right-28 -top-32 h-80 w-80 rounded-full bg-propertree-green-100 opacity-60" />
        <div className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-propertree-blue-50 opacity-70" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-propertree-dark transition hover:text-propertree-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green">
                {eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-propertree-dark sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              {intro && (
                <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
                  {intro}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-full border border-propertree-green-100 bg-white px-4 py-2 text-sm font-medium text-propertree-dark shadow-sm transition hover:border-propertree-green hover:text-propertree-green"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAGE CONTENT */}
      <section className="px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="space-y-8">{children}</div>
        </div>
      </section>

      {/* CTA — mirrors the main landing page */}
      <section className="px-6 pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-propertree-green px-8 py-12 text-center text-white md:px-12 md:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Propertree
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              Your property. Professionally managed.
            </h2>
            <Link
              to={ctaTo}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-propertree-dark transition hover:bg-gray-100"
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PublicInfoLayout
