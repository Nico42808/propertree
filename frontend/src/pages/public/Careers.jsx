import { HeartHandshake, Laptop, MapPin } from 'lucide-react'
import PublicInfoLayout from './PublicInfoLayout'

const Careers = () => (
  <PublicInfoLayout
    eyebrow="Company"
    title="Build the future of property ownership with us."
    intro="We are creating a simpler way to manage second homes and privately owned properties."
  >
    <div className="grid gap-6 md:grid-cols-3">
      {[
        [Laptop, 'Digital first', 'We build simple tools that turn complex property-management workflows into clear owner experiences.'],
        [HeartHandshake, 'Service minded', 'Great property management is practical, responsive and built on trust.'],
        [MapPin, 'International outlook', 'Propertree is designed for owners and property teams who operate across locations and borders.'],
      ].map(([Icon, title, text]) => (
        <div key={title} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-subtle">
          <Icon className="h-7 w-7 text-propertree-green" />
          <h2 className="mt-5 text-xl font-semibold">{title}</h2>
          <p className="mt-3 leading-7 text-gray-500">{text}</p>
        </div>
      ))}
    </div>

    <div className="rounded-3xl border border-propertree-green-100 bg-white p-8 md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-propertree-green">Open positions</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">No open roles at the moment.</h2>
      <p className="mt-4 max-w-2xl leading-7 text-gray-500">
        We are still building our team and will publish future opportunities here. Check back as Propertree grows.
      </p>
    </div>
  </PublicInfoLayout>
)

export default Careers
