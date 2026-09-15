import { Building2, ShieldCheck, Wrench } from 'lucide-react'
import PublicInfoLayout from './PublicInfoLayout'

const AboutUs = () => (
  <PublicInfoLayout
    eyebrow="Company"
    title="Property ownership, made simpler."
    intro="Propertree brings property information, service requests and day-to-day coordination into one clear owner experience."
  >
    <div className="grid gap-6 md:grid-cols-3">
      {[
        [Building2, 'One place for every asset', 'Keep properties, documents and current activities organized in one central platform.'],
        [Wrench, 'Services when you need them', 'Request maintenance, inspections, housekeeping and other support without juggling multiple providers.'],
        [ShieldCheck, 'Visibility without complexity', 'Stay informed about what is happening at your property while local work is coordinated for you.'],
      ].map(([Icon, title, text]) => (
        <div key={title} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-subtle">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-propertree-green-50">
            <Icon className="h-5 w-5 text-propertree-green" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">{title}</h2>
          <p className="mt-3 leading-7 text-gray-500">{text}</p>
        </div>
      ))}
    </div>

    <div className="rounded-3xl bg-propertree-dark p-8 text-white md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green-300">Our approach</p>
      <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight">Built around the owner, not around complexity.</h2>
      <p className="mt-5 max-w-3xl leading-8 text-gray-300">
        Propertree is designed for owners who want a clear overview of their property and a reliable way to request support. The platform combines digital organization with practical property management workflows so ownership stays simple, transparent and easy to manage from anywhere.
      </p>
    </div>
  </PublicInfoLayout>
)

export default AboutUs
