import { Card } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

export function PrivacyNoticePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Privacy Notice" subtitle="Philippine Data Privacy Act of 2012 (RA 10173) Compliance" />

      <Card>
        <div className="p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Data Collection</h2>
            <p className="text-gray-600 leading-relaxed">
              The PSA Inventory Management System collects personal information necessary for inventory management purposes, including:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600">
              <li>Full name (first, middle, last)</li>
              <li>Employee identification number</li>
              <li>Email address</li>
              <li>Department and office assignment</li>
              <li>Username for system access</li>
              <li>Login and activity logs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Purpose of Collection</h2>
            <p className="text-gray-600 leading-relaxed">
              Personal information is collected for the following purposes:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600">
              <li>Asset borrowing and return tracking</li>
              <li>Inventory management and accountability</li>
              <li>User authentication and access control</li>
              <li>Audit trail and security monitoring</li>
              <li>System administration and maintenance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Storage and Security</h2>
            <p className="text-gray-600 leading-relaxed">
              All personal information is stored securely using:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600">
              <li>Encrypted password storage using bcrypt hashing</li>
              <li>Secure session management with token expiration</li>
              <li>Role-based access control to limit data access</li>
              <li>Audit logging for all sensitive operations</li>
              <li>Secure API endpoints with authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Access and Sharing</h2>
            <p className="text-gray-600 leading-relaxed">
              Access to personal information is restricted to:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600">
              <li>Authorized system administrators</li>
              <li>Department supervisors for asset management</li>
              <li>Users accessing their own information</li>
              <li>Auditors for compliance purposes</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Personal information is not shared with third parties except as required by law or with explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              Personal information is retained for the duration of employment and as required by law. Upon separation, user accounts are deactivated but records are maintained for audit and compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Rights of Data Subjects</h2>
            <p className="text-gray-600 leading-relaxed">
              Under RA 10173, you have the right to:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Object to processing of your data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>File a complaint with the National Privacy Commission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              For inquiries, requests, or complaints regarding your personal information, please contact:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600"><strong>Data Protection Officer:</strong> [DPO Name]</p>
              <p className="text-gray-600"><strong>Email:</strong> dpo@psa.gov.ph</p>
              <p className="text-gray-600"><strong>Phone:</strong> [Contact Number]</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Consent</h2>
            <p className="text-gray-600 leading-relaxed">
              By using this system, you consent to the collection, processing, and storage of your personal information as described in this Privacy Notice. You may withdraw your consent at any time by contacting the Data Protection Officer, subject to legal and operational requirements.
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}
