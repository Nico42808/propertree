import { FileText, Home, Wrench } from 'lucide-react'
import PublicInfoLayout from './PublicInfoLayout'

const Blog = () => (
  <PublicInfoLayout
    eyebrow="Company"
    title="Insights for better property ownership."
    intro="Practical ideas around second-home management, maintenance and keeping property ownership simple."
  >
    <div className="grid gap-6 md:grid-cols-3">
      {[
        [Home, 'Second-home management', 'How to keep a property organized, ready and well cared for even when you are not there.'],
        [Wrench, 'Maintenance & services', 'What owners should plan for when coordinating recurring care, inspections and repairs.'],
        [FileText, 'Documents & visibility', 'Why having one clear place for property documents and current tasks makes ownership easier.'],
      ].map(([Icon, title, text]) => (
        <article key={title} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-subtle">
          <Icon className="h-7 w-7 text-propertree-green" />
          <h2 className="mt-5 text-xl font-semibold">{title}</h2>
          <p className="mt-3 leading-7 text-gray-500">{text}</p>
          <p className="mt-5 text-sm font-semibold text-propertree-green">Articles coming soon</p>
        </article>
      ))}
    </div>
  </PublicInfoLayout>
)

export default Blog
