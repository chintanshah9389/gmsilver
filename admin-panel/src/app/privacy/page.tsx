import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — GM Silver',
  description: 'Privacy Policy for the GM Silver mobile application operated by GM Silver LLP.',
};

export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 20px 72px',
        fontFamily: 'Georgia, "Times New Roman", serif',
        lineHeight: 1.65,
        color: '#1c1917',
        background: '#fbf9f6',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: '2rem', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        Privacy Policy — GM Silver
      </h1>
      <p style={{ color: '#57534e', fontFamily: 'system-ui, sans-serif', fontSize: '0.95rem' }}>
        Last updated: 4 September 2026
      </p>

      <Section title="1. Who we are">
        <p>
          GM Silver LLP (“we”, “us”, “our”) operates the GM Silver mobile
          application for browsing products, placing orders, and receiving account
          and order updates.
        </p>
        <p>
          Contact / support:{' '}
          <a href="mailto:gmsilverllp@gmail.com">gmsilverllp@gmail.com</a>
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>
          <strong>Account information you provide</strong>
        </p>
        <ul>
          <li>Name, email address, and phone number</li>
          <li>Company name and city</li>
          <li>Password and MPIN (stored securely; never shared in plain form)</li>
          <li>Security question and answer (for account recovery)</li>
        </ul>
        <p>
          <strong>Order and account activity</strong>
        </p>
        <ul>
          <li>Orders, cart and wishlist activity, and invoices</li>
          <li>Optional order notes</li>
        </ul>
        <p>
          <strong>Device and notifications</strong>
        </p>
        <ul>
          <li>
            Push notification token (Firebase Cloud Messaging) so we can send order
            and account notifications
          </li>
          <li>
            Limited technical or device details and IP address in server logs, used
            for security and troubleshooting
          </li>
        </ul>
        <p>
          We do not collect precise location, phone contacts, photos, microphone
          audio, SMS, or advertising IDs for ads.
        </p>
      </Section>

      <Section title="3. How we use your data">
        <ul>
          <li>Create and manage your account</li>
          <li>Process and fulfill orders</li>
          <li>Send push notifications (order status, account approval, offers)</li>
          <li>Provide customer support</li>
          <li>Protect against fraud and misuse</li>
          <li>Operate and improve the reliability of the app</li>
        </ul>
      </Section>

      <Section title="4. How we share data">
        <p>We do not sell your personal data.</p>
        <p>
          We use service providers who process data only as needed to run the
          service:
        </p>
        <ul>
          <li>Cloud hosting for our API and database</li>
          <li>
            Google Firebase Cloud Messaging, to deliver push notifications using
            your device token
          </li>
          <li>
            Google Contacts (when enabled), where we may sync your name, email, and
            phone into our business contact list for customer communication related
            to your account or orders
          </li>
        </ul>
      </Section>

      <Section title="5. Consent">
        <p>
          By creating an account and using the app, you agree to this processing as
          needed to provide the service. You can turn off notifications in your
          device settings; account and ordering features may still work.
        </p>
      </Section>

      <Section title="6. Data retention">
        <p>
          We keep account and order data while your account is active and as
          required for legal, tax, accounting, or dispute purposes. You may request
          deletion as described below.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          We use HTTPS for data in transit and standard safeguards for passwords
          (hashed) and access control. No method of transmission or storage is 100%
          secure.
        </p>
      </Section>

      <Section title="8. Children’s privacy">
        <p>
          The app is intended for business and adult users. It is not directed at
          children under 13.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>
          You may request access, correction, or deletion of your personal data by
          emailing{' '}
          <a href="mailto:gmsilverllp@gmail.com">gmsilverllp@gmail.com</a>. We will
          verify your identity and respond within a reasonable time.
        </p>
        <p>
          To request account/data deletion, email{' '}
          <a href="mailto:gmsilverllp@gmail.com">gmsilverllp@gmail.com</a> with the
          subject “Delete my GM Silver account” and include the email or phone
          number registered in the app.
        </p>
      </Section>

      <Section title="10. Changes">
        <p>
          We may update this policy from time to time. The “Last updated” date will
          change when we do. Continued use of the app after an update means you
          accept the revised policy.
        </p>
      </Section>

      <Section title="11. Contact">
        <div
          style={{
            marginTop: 8,
            padding: '16px 18px',
            border: '1px solid #e7e5e4',
            background: '#fff',
          }}
        >
          <p>
            <strong>GM Silver LLP</strong>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:gmsilverllp@gmail.com">gmsilverllp@gmail.com</a>
          </p>
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2
        style={{
          fontSize: '1.2rem',
          margin: '0 0 10px',
          paddingTop: 8,
          borderTop: '1px solid #e7e5e4',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
