import { Building2, HelpCircle, Handshake } from 'lucide-react'
import PublicInfoLayout from './PublicInfoLayout'

const Contact = () => (
  <PublicInfoLayout
    eyebrow="Support"
    title="Get in touch with Propertree."
    intro="Choose the type of request that best matches what you need."
    ctaLabel="Owner login"
    ctaTo="/login"
  >
    <div className="grid gap-6 md:grid-cols-3">
      {[
        [Building2, 'Property owners', 'Already using Propertree? Sign in to your account to manage your assets and current service requests.'],
        [Handshake, 'Partnerships', 'For property-management, service-provider or business partnerships, please use your existing Propertree point of contact.'],
        [HelpCircle, 'General support', 'For common platform questions, start with the Help Center or use your owner account to review current requests and services.'],
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
  </PublicInfoLayout>
)

export default Contact
