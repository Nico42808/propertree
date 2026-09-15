import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  FileText,
  Home,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'

const LandingPage = () => {
  const servicePreviewCards = [
    {
      title: 'Property Management Abo',
      description: 'Ongoing property management support for regular checks,...',
      duration: '2 hr',
      icon: Settings,
    },
    {
      title: 'Handyman service',
      description: 'Handyman tasks such as mounting, patching and assembly...',
      duration: '2 hr',
      icon: Wrench,
    },
    {
      title: 'Arrival Preparation',
      description: 'We prepare your property before your arrival...',
      duration: '3 hr',
      icon: Sparkles,
    },
    {
      title: 'Deep cleaning',
      description: 'Intensive deep clean of the entire property...',
      duration: '4 hr',
      icon: Sparkles,
    },
    {
      title: 'Housekeeping',
      description: 'Regular housekeeping service including tidying...',
      duration: '2 hr',
      icon: Home,
    },
    {
      title: 'Mid-stay cleaning',
      description: 'Light clean during an ongoing stay...',
      duration: '1h 30m',
      icon: Sparkles,
    },
  ]

  const serviceShortcuts = [
    'All Services',
    'Property Management Abo',
    'Arrival Preparation',
    'Fridge Refill',
    '24/7 Emergency Service',
    'Housekeeping',
    'Handyman Service',
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
              <span className="block text-propertree-green">Always taken care of.</span>
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

          {/* HERO MOBILE APP PREVIEW */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-propertree-green-100/70 blur-3xl" />

            <div className="relative w-[300px] sm:w-[330px]">
              <div className="rounded-[2.8rem] border-[6px] border-propertree-dark bg-propertree-dark p-[2px] shadow-[0_32px_90px_rgba(20,40,32,0.24)]">
                <div className="relative overflow-hidden rounded-[2.45rem] bg-white">
                  <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-propertree-dark" />

                  <div className="px-5 pb-6 pt-11">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2.5">
                        <img src="/logo.png" alt="Propertree" className="h-8 w-8 object-contain" />
                        <span className="text-[17px] font-bold tracking-tight text-propertree-dark">Propertree</span>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-propertree-green-50">
                        <Building2 className="h-4 w-4 text-propertree-green" />
                      </div>
                    </div>

                    <div className="pt-5">
                      <p className="text-[11px] font-medium text-gray-400">Your portfolio</p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-propertree-dark">My Assets</h3>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl bg-propertree-cream-100 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">Property</p>
                            <p className="mt-1.5 text-[15px] font-semibold text-propertree-dark">Lake House</p>
                            <p className="mt-0.5 text-[11px] text-gray-500">Nova Scotia, Canada</p>
                          </div>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-medium text-propertree-green-700">Active</span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-white p-3">
                            <FileText className="mb-2 h-4 w-4 text-propertree-blue" />
                            <p className="text-[11px] font-medium">Documents</p>
                            <p className="mt-0.5 text-[9px] text-gray-400">12 files</p>
                          </div>
                          <div className="rounded-xl bg-white p-3">
                            <Wrench className="mb-2 h-4 w-4 text-propertree-green" />
                            <p className="text-[11px] font-medium">Services</p>
                            <p className="mt-0.5 text-[9px] text-gray-400">2 active</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">Property</p>
                            <p className="mt-1.5 text-[15px] font-semibold text-propertree-dark">Ocean Beach House</p>
                            <p className="mt-0.5 text-[11px] text-gray-500">Nova Scotia, Canada</p>
                          </div>
                          <span className="rounded-full bg-propertree-green-50 px-2.5 py-1 text-[9px] font-medium text-propertree-green-700">Active</span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-propertree-cream-100 p-3">
                            <FileText className="mb-2 h-4 w-4 text-propertree-blue" />
                            <p className="text-[11px] font-medium">Documents</p>
                            <p className="mt-0.5 text-[9px] text-gray-400">6 files</p>
                          </div>
                          <div className="rounded-xl bg-propertree-cream-100 p-3">
                            <Wrench className="mb-2 h-4 w-4 text-propertree-green" />
                            <p className="text-[11px] font-medium">Services</p>
                            <p className="mt-0.5 text-[9px] text-gray-400">1 active</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-[9px] text-gray-400">Tasks</p>
                        <p className="mt-1 text-lg font-semibold leading-none">4</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-[9px] text-gray-400">Documents</p>
                        <p className="mt-1 text-lg font-semibold leading-none">18</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-[9px] text-gray-400">Services</p>
                        <p className="mt-1 text-lg font-semibold leading-none">3</p>
                      </div>
                    </div>
                  </div>
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
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green">One place for your property</p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Everything your property needs.</h2>
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
              <h3 className="mt-7 text-2xl font-semibold">Assets</h3>
              <p className="mt-4 leading-7 text-gray-500">
                Keep your properties, documents, key information and current
                activities organized in one central location.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-subtle transition hover:-translate-y-1 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-propertree-blue-50">
                <Wrench className="h-6 w-6 text-propertree-blue" />
              </div>
              <h3 className="mt-7 text-2xl font-semibold">Services</h3>
              <p className="mt-4 leading-7 text-gray-500">
                Request maintenance, inspections, cleaning and other property
                services directly through Propertree.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-subtle transition hover:-translate-y-1 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-propertree-cream">
                <ShieldCheck className="h-6 w-6 text-propertree-dark" />
              </div>
              <h3 className="mt-7 text-2xl font-semibold">Management</h3>
              <p className="mt-4 leading-7 text-gray-500">
                We coordinate tasks, service providers and ongoing property
                requirements so you always know what is happening.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-propertree-dark px-6 py-24 text-white lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green-300">How it works</p>
              <h2 className="max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">Property management without the complexity.</h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-300">
                Propertree connects your property, your service requests and your
                property manager in one simple workflow.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/20 text-sm font-semibold">01</div>
                <div>
                  <h3 className="text-xl font-semibold">Add your property</h3>
                  <p className="mt-2 leading-7 text-gray-300">Create your asset and keep all relevant property information together.</p>
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/20 text-sm font-semibold">02</div>
                <div>
                  <h3 className="text-xl font-semibold">Choose what you need</h3>
                  <p className="mt-2 leading-7 text-gray-300">Request individual services or ongoing support for your property.</p>
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/20 text-sm font-semibold">03</div>
                <div>
                  <h3 className="text-xl font-semibold">We take care of the rest</h3>
                  <p className="mt-2 leading-7 text-gray-300">Your property manager coordinates the work while you keep full visibility through Propertree.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="overflow-hidden bg-propertree-cream-100 px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
            <div className="relative z-10">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green">Services</p>
              <h2 className="max-w-xl text-4xl font-semibold tracking-tight md:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
                The right service.
                <span className="block text-propertree-green">When your property needs it.</span>
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
                From routine inspections to repairs and larger projects,
                Propertree helps coordinate the services required to keep your
                property in excellent condition.
              </p>
              <Link to="/register" className="mt-8 inline-flex items-center gap-2 font-semibold text-propertree-dark transition hover:text-propertree-green">
                Explore Propertree
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* MacBook-style static preview. Visual only. */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[860px] pb-8 pt-4">
                <div className="relative mx-auto w-[86%] rounded-t-[1.45rem] bg-[#111314] px-[10px] pt-[10px] shadow-[0_28px_70px_rgba(25,35,31,0.22)]">
                  <div className="absolute left-1/2 top-[5px] z-20 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#303536] ring-1 ring-black/60" />

                  <div className="overflow-hidden rounded-t-[0.9rem] bg-white">
                    <div className="border-b border-gray-100 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
                          <span className="text-[11px] font-bold text-propertree-dark">Propertree</span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-semibold text-propertree-dark">
                          <span>Assets</span>
                          <span>Services</span>
                          <span>English</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#fdfcfa] px-4 pb-5 pt-4">
                      <div className="flex items-center gap-6 border-b border-gray-200 pb-2 text-[9px]">
                        <span className="border-b-2 border-propertree-green pb-2 font-semibold text-propertree-green">Service Catalog</span>
                        <span className="text-gray-500">My Services</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {serviceShortcuts.map((item, index) => (
                          <span
                            key={item}
                            className={`rounded-full px-2.5 py-1 text-[8px] font-medium ${index === 0 ? 'bg-propertree-green text-white' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {servicePreviewCards.map(({ title, description, duration, icon: Icon }) => (
                          <div key={title} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                            <div className="flex items-start gap-2">
                              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[9px] font-semibold text-propertree-dark">{title}</p>
                                <p className="mt-1 text-[7px] leading-[1.35] text-gray-500">{description}</p>
                              </div>
                            </div>
                            <p className="mt-2 text-[8px] font-medium text-propertree-dark">Price on request</p>
                            <p className="mt-0.5 text-[7px] text-gray-400">~{duration}</p>
                            <div className="mt-2 rounded-md bg-propertree-dark px-2 py-1.5 text-center text-[8px] font-semibold text-white">Book Service</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="h-7 bg-[#111314]" />
                </div>

                <div className="relative mx-auto -mt-[1px] h-5 w-full max-w-[900px] overflow-hidden rounded-b-[1.2rem] bg-gradient-to-b from-[#dadde0] via-[#bcc1c5] to-[#8f9499] shadow-[0_14px_22px_rgba(0,0,0,0.15)]" style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)' }}>
                  <div className="absolute left-1/2 top-0 h-2.5 w-[17%] -translate-x-1/2 rounded-b-xl bg-[#9fa4a9] shadow-inner" />
                  <div className="absolute bottom-[2px] left-1/2 h-[2px] w-[86%] -translate-x-1/2 rounded-full bg-white/35" />
                </div>
                <div className="mx-auto h-[3px] w-[96%] rounded-b-full bg-[#74797e] opacity-85" />
              </div>
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
              <h3 className="mt-8 text-3xl font-semibold">Your property stays yours.</h3>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                Propertree is built around the owner. You retain full visibility
                over your property while we make management and coordination easier.
              </p>
            </div>

            <div className="rounded-3xl bg-propertree-blue-50 p-8 md:p-12">
              <ClipboardCheck className="h-8 w-8 text-propertree-blue" />
              <h3 className="mt-8 text-3xl font-semibold">Know what is happening.</h3>
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Welcome to Propertree</p>
            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Your property.
              <br />
              Professionally managed.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/80">
              Simplify ownership and keep everything your property needs in one place.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 font-semibold text-propertree-dark transition hover:bg-gray-100">
                Get started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10">
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
