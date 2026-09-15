import PublicInfoLayout from './PublicInfoLayout'

const faqs = [
  ['How do I add a property?', 'After creating your owner account, open Assets and add the property information required for your management setup.'],
  ['How do service requests work?', 'Open Services, choose the service you need and submit the request for the relevant property. Your request can then be tracked in My Services.'],
  ['Where can I find property documents?', 'Property-related documents are kept together with the relevant asset so important information stays easy to access.'],
  ['Can I manage more than one property?', 'Yes. Propertree is designed to give owners one portfolio overview across multiple properties.'],
  ['Can I use Propertree while travelling?', 'Yes. The platform is browser based and designed so you can stay informed wherever you are.'],
  ['Who coordinates the work at my property?', 'The exact management setup depends on the agreement for your property. Propertree gives you visibility over the requests and services connected to the asset.'],
]

const HelpCenter = () => (
  <PublicInfoLayout
    eyebrow="Support"
    title="How can we help?"
    intro="Quick answers to the most common questions about managing your assets and services with Propertree."
    ctaLabel="Go to owner login"
    ctaTo="/login"
  >
    <div className="grid gap-4 md:grid-cols-2">
      {faqs.map(([question, answer]) => (
        <div key={question} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-subtle">
          <h2 className="text-lg font-semibold">{question}</h2>
          <p className="mt-3 leading-7 text-gray-500">{answer}</p>
        </div>
      ))}
    </div>
  </PublicInfoLayout>
)

export default HelpCenter
