import PublicInfoLayout from './PublicInfoLayout'

const Section = ({ title, children }) => (
  <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-subtle md:p-8">
    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    <div className="mt-4 space-y-3 leading-7 text-gray-600">{children}</div>
  </section>
)

const TermsOfUse = () => (
  <PublicInfoLayout
    eyebrow="Legal"
    title="Terms of Use"
    intro="These terms set out the general rules for using the Propertree website and platform."
  >
    <div className="rounded-2xl bg-propertree-green-50 p-5 text-sm leading-6 text-gray-600">
      Last updated: September 2026. These terms are intended as a clear operational draft and should be reviewed against the final company, service and jurisdictional setup before being relied on as final legal terms.
    </div>

    <Section title="1. Using Propertree">
      <p>Propertree provides digital tools for organizing property information, managing assets and requesting property-related services. You agree to use the platform lawfully and only for legitimate property-management purposes.</p>
    </Section>

    <Section title="2. Accounts">
      <p>You are responsible for keeping your login details secure and for the information submitted through your account. You should notify Propertree if you believe your account has been accessed without authorization.</p>
    </Section>

    <Section title="3. Property information and service requests">
      <p>Information entered about a property should be accurate to the best of your knowledge. Service requests may be subject to separate agreements, availability, pricing and confirmation outside the platform.</p>
    </Section>

    <Section title="4. Availability of the platform">
      <p>We aim to keep Propertree available and reliable, but uninterrupted access cannot be guaranteed. Features may be changed, improved or temporarily unavailable for maintenance or technical reasons.</p>
    </Section>

    <Section title="5. Intellectual property">
      <p>The Propertree brand, interface, design and original platform content remain protected by applicable intellectual-property rights. They may not be copied, resold or used to create a misleading association with Propertree without permission.</p>
    </Section>

    <Section title="6. Liability and service providers">
      <p>Property services can involve third-party providers or separate management arrangements. The responsibilities, scope and liability for individual services should be governed by the relevant service or management agreement.</p>
    </Section>

    <Section title="7. Changes to these terms">
      <p>These terms may be updated as the platform and service model develop. The latest version will be published on this page.</p>
    </Section>
  </PublicInfoLayout>
)

export default TermsOfUse
