export default function Privacy() {
  const date = "Jun 3 2024";
  return (
    <>
      <h1>Privacy Policy for EmailWise</h1>
      <p>
        <strong>Effective Date:</strong> {date}
      </p>
      <h2>1. Introduction</h2>
      <p>
        EmailWise (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
        committed to protecting your privacy. This Privacy Policy explains how
        we collect, use, and store your information when you use our Shopify app
        to generate sales emails for your products.
      </p>

      <h2>2. Information We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li>
          <strong>3rd Party API Keys:</strong> For AI and email integration.
        </li>
        <li>
          <strong>Company Brand Information:</strong> Details about your company
          and brand.
        </li>
        <li>
          <strong>Email Campaign Templates:</strong> Imported using API keys.
        </li>
        <li>
          <strong>Customization Data:</strong> Additional information for
          customizing sales emails.
        </li>
      </ul>
      <p>
        Information is collected through forms you fill out and by backend
        processes that import data using your provided API keys.
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Access third-party APIs necessary for our services.</li>
        <li>Generate sales emails tailored to your products and brand.</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>We do not share your data with any third parties.</p>

      <h2>5. Data Storage and Security</h2>
      <p>
        Your data is stored in a PostgreSQL database hosted in the cloud. Our
        databases are password protected to ensure your data is secure.
      </p>

      <h2>6. User Rights</h2>
      <p>
        Your rights regarding data access, correction, and deletion are
        implemented according to standard Shopify webhook notifications.
      </p>

      <h2>7. Cookies and Tracking</h2>
      <p>
        EmailWise does not use cookies or tracking technologies beyond what
        Shopify implements.
      </p>

      <h2>8. Compliance with Laws</h2>
      <p>
        We comply with all relevant data protection laws, including GDPR and
        CCPA.
      </p>

      <h2>9. Contact Information</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please
        contact us at{" "}
        <a href="mailto:support@emailwise.io">support@emailwise.io</a>.
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page.
      </p>

      <p>
        <strong>Last Updated:</strong> {date}
      </p>
    </>
  );
}
