import PublicInfoLayout from './PublicInfoLayout'

const Section = ({ title, children }) => (
  <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-subtle md:p-8">
    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    <div className="mt-4 space-y-3 leading-7 text-gray-600">{children}</div>
  </section>
)

const Privacy = () => (
  <PublicInfoLayout
    eyebrow="Legal"
    title="Privacy"
    intro="A plain-language overview of how privacy is intended to be handled across Propertree."
  >
    <div className="rounded-2xl bg-propertree-green-50 p-5 text-sm leading-6 text-gray-600">
      Last updated: September 2026. This page is a practical privacy-policy draft and should be reviewed against the final hosting, analytics, data-processing and company setup before being treated as the final legal policy.
    </div>

    <Section title="1. Information you provide">
      <p>Depending on how you use Propertree, you may provide account information, property information, documents, service-request details and other information needed to manage your assets.</p>
    </Section>

    <Section title="2. How information is used">
      <p>Information is used to provide the platform, organize property data, support service workflows, maintain account access and improve the user experience.</p>
    </Section>

    <Section title="3. Property documents and uploads">
      <p>Documents uploaded to Propertree may contain property or personal information. Users should only upload documents they are permitted to store and share for the relevant property-management purpose.</p>
    </Section>

    <Section title="4. Service providers">
      <p>Technical hosting, software infrastructure or property-service workflows may involve external providers. The final production setup should document which providers process personal information and for what purpose.</p>
    </Section>

    <Section title="5. Security">
      <p>Reasonable technical and organizational measures should be used to protect account and property information. No internet-based system can guarantee absolute security.</p>
    </Section>

    <Section title="6. Retention and deletion">
      <p>Information should be retained only for as long as needed for the relevant account, legal, contractual or property-management purpose. Final retention periods will depend on the production and legal setup.</p>
    </Section>

    <Section title="7. Your privacy rights">
      <p>Depending on where you live, privacy law may give you rights to access, correct, delete or restrict the use of your personal information. The final privacy policy should include the appropriate contact details and procedures for exercising those rights.</p>
    </Section>
  </PublicInfoLayout>
)

export default Privacy
