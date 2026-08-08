import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  FileText,
  Home,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'

const LandingPage = () => {
  const services = [
    'Property inspections',
    'Maintenance & repairs',
    'Cleaning & housekeeping',
    'Garden & exterior care',
    'Document management',
    'Renovation coordination',
  ]

  return (
    <div className="bg-white text-propertree-dark">

      {/* HERO */}
      <section className="relative overflow-hidden bg-propertree-cream-100">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-propertree-green-100 opacity-60" />
        <div className="absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-propertree-blue-50 opacity-70" />

        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">

          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-propertree-green-200 bg-white px-4 py-2 text-sm font-medium text-propertree-green-700">
              <Sparkles className="h-4 w-4" />
              Property management, simplified
            </div>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-propertree-dark md:text-6xl lg:text-7xl">
              Your property.
              <span className="block text-propertree-green">
                Always taken care of.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-gray-600 md:text-xl">
              Propertree gives property owners one place to manage their assets,
              organize important information and request the services their
              properties need.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-propertree-dark px-7 py-4 font-semibold text-white transition hover:bg-propertree-dark-600"
              >
                Get started
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-4 font-semibold text-propertree-dark transition hover:border-propertree-green hover:text-propertree-green"
              >
                Owner login
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-propertree-green" />
                One platform
              </div>

              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-propertree-green" />
                One point of contact
              </div>

              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-propertree-green" />
                Full transparency
              </div>
            </div>
          </div>

          {/* HERO DASHBOARD PREVIEW */}
          <div className="relative">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-card lg:p-7">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Your portfolio</p>
                  <h3 className="mt-1 text-xl font-semibold">
                    My Assets
                  </h3>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-propertree-green-50">
                  <Building2 className="h-5 w-5 text-propertree-green" />
                </div>
              </div>

              <div className="rounded-2xl bg-propertree-cream-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Property
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      Lake House
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Nova Scotia, Canada
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-propertree-green-700">
                    Active
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-4">
                    <FileText className="mb-3 h-5 w-5 text-propertree-blue" />
                    <p className="text-sm font-medium">Documents</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Everything organized
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <Wrench className="mb-3 h-5 w-5 text-propertree-green" />
                    <p className="text-sm font-medium">Services</p>
                    <p className="mt-1 text-xs text-gray-400">
                      2 active requests
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400">Tasks</p>
                  <p className="mt-1 text-xl font-semibold">4</p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400">Documents</p>
                  <p className="mt-1 text-xl font-semibold">18</p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400">Services</p>
                  <p className="mt-1 text-xl font-semibold">2</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* VALUE PROPOSITION */}
      <section className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green">
              One place for your property
            </p>

            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Everything your property needs.
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-500">
              Stay informed, request support and keep everything related to your
              property organized without coordinating multiple providers yourself.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-subtle transition hover:-translate-y-1 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-propertree-green-50">
                <Building2 className="h-6 w-6 text-propertree-green" />
              </div>

              <h3 className="mt-7 text-2xl font-semibold">
                Assets
              </h3>

              <p className="mt-4 leading-7 text-gray-500">
                Keep your properties, documents, key information and current
                activities organized in one central location.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-subtle transition hover:-translate-y-1 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-propertree-blue-50">
                <Wrench className="h-6 w-6 text-propertree-blue" />
              </div>

              <h3 className="mt-7 text-2xl font-semibold">
                Services
              </h3>

              <p className="mt-4 leading-7 text-gray-500">
                Request maintenance, inspections, cleaning and other property
                services directly through Propertree.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-subtle transition hover:-translate-y-1 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-propertree-cream">
                <ShieldCheck className="h-6 w-6 text-propertree-dark" />
              </div>

              <h3 className="mt-7 text-2xl font-semibold">
                Management
              </h3>

              <p className="mt-4 leading-7 text-gray-500">
                We coordinate tasks, service providers and ongoing property
                requirements so you always know what is happening.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-propertree-dark px-6 py-24 text-white lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-14 lg:grid-cols-2">

            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green-300">
                How it works
              </p>

              <h2 className="max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
                Property management without the complexity.
              </h2>

              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-300">
                Propertree connects your property, your service requests and your
                property manager in one simple workflow.
              </p>
            </div>

            <div className="space-y-8">

              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/20 text-sm font-semibold">
                  01
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Add your property
                  </h3>
                  <p className="mt-2 leading-7 text-gray-300">
                    Create your asset and keep all relevant property information
                    together.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/20 text-sm font-semibold">
                  02
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Choose what you need
                  </h3>
                  <p className="mt-2 leading-7 text-gray-300">
                    Request individual services or ongoing support for your
                    property.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/20 text-sm font-semibold">
                  03
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    We take care of the rest
                  </h3>
                  <p className="mt-2 leading-7 text-gray-300">
                    Your property manager coordinates the work while you keep
                    full visibility through Propertree.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* SERVICES */}
      <section
        id="services"
        className="bg-propertree-cream-100 px-6 py-24 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">

          <div className="grid items-center gap-14 lg:grid-cols-2">

            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green">
                Services
              </p>

              <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                The right service.
                <span className="block text-propertree-green">
                  When your property needs it.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
                From routine inspections to repairs and larger projects,
                Propertree helps coordinate the services required to keep your
                property in excellent condition.
              </p>

              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 font-semibold text-propertree-dark transition hover:text-propertree-green"
              >
                Explore Propertree
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-propertree-green-50">
                    <Check className="h-4 w-4 text-propertree-green" />
                  </div>

                  <span className="font-medium">{service}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* OWNER EXPERIENCE */}
      <section className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-14 lg:grid-cols-2">

            <div className="rounded-3xl bg-propertree-green-50 p-8 md:p-12">
              <Home className="h-8 w-8 text-propertree-green" />

              <h3 className="mt-8 text-3xl font-semibold">
                Your property stays yours.
              </h3>

              <p className="mt-5 text-lg leading-8 text-gray-600">
                Propertree is built around the owner. You retain full visibility
                over your property while we make management and coordination
                easier.
              </p>
            </div>

            <div className="rounded-3xl bg-propertree-blue-50 p-8 md:p-12">
              <ClipboardCheck className="h-8 w-8 text-propertree-blue" />

              <h3 className="mt-8 text-3xl font-semibold">
                Know what is happening.
              </h3>

              <p className="mt-5 text-lg leading-8 text-gray-600">
                View your assets, track tasks and service requests, and keep
                important documents accessible wherever you are.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="px-6 pb-24 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl bg-propertree-green px-8 py-16 text-center text-white md:px-16 md:py-20">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Welcome to Propertree
            </p>

            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Your property.
              <br />
              Professionally managed.
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/80">
              Simplify ownership and keep everything your property needs in one
              place.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 font-semibold text-propertree-dark transition hover:bg-gray-100"
              >
                Get started
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Owner login
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}

export default LandingPage
