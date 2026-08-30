/**
 * PrivacyPolicy — the static policy page covering what the platform collects, how it uses that data, how it is secured, what each user role can reach, and the rights a user has over their own data.
 * Sections are declared as a `POLICY_SECTIONS` array — each holding either a bullet list or a paragraph — so revising the policy is a content edit and the page's rhythm comes from `Prose`.
 * Lives in `components/`; routed at /privacy-policy.
 */
import type { ReactNode } from "react";
import PageContainer from "@/components/ui/layout/PageContainer";
import PageHeader from "@/components/ui/layout/PageHeader";
import Prose from "@/components/ui/misc/Prose";

interface PolicySection {
  title: string;
  /** Bulleted clauses. Mutually exclusive with `body`. */
  items?: ReactNode[];
  /** A single prose paragraph. Mutually exclusive with `items`. */
  body?: string;
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: "What We Collect",
    items: [
      <><strong>Account Information:</strong> Username, email address, and encrypted password</>,
      <><strong>Profile Data:</strong> User role (user, admin, superadmin), team associations, and player statistics</>,
      <><strong>Game Data:</strong> Match results, team statistics, player performance metrics, and season records</>,
      <><strong>Content:</strong> Articles, team information, game highlights, and any other content you submit</>,
      <><strong>Usage Data:</strong> Information about how you interact with our platform, including access times and features used</>,
    ],
  },
  {
    title: "How We Use Your Information",
    items: [
      "To authenticate and manage user accounts and access levels",
      "To maintain and display team rosters, game schedules, and season information",
      "To generate and display match statistics, player rankings, and team standings",
      "To facilitate content sharing and community engagement through articles and highlights",
      "To provide administrative tools for team and game management",
      "To improve our platform's features, performance, and user experience",
      "To communicate important updates about our service",
    ],
  },
  {
    title: "Data Security",
    items: [
      "We implement industry-standard security measures to protect your data",
      "Passwords are encrypted using bcrypt before storage",
      "Authentication is handled through secure JWT tokens",
      "Access to sensitive data is restricted based on user roles",
      "Regular security audits and updates are performed to maintain data protection",
    ],
  },
  {
    title: "User Roles and Access",
    items: [
      <><strong>Regular Users:</strong> Can view public content, manage their profile, and participate in team activities</>,
      <><strong>Team Administrators:</strong> Can manage team information, rosters, and game statistics</>,
      <><strong>Admin Users:</strong> Have access to administrative tools and can manage platform content</>,
      <><strong>Superadmin Users:</strong> Have full system access and can manage user roles and platform settings</>,
    ],
  },
  {
    title: "Third-Party Services",
    items: [
      "We use secure authentication services for user management",
      "Analytics tools to improve our service and user experience",
      "Media storage services for content hosting",
      "These services have their own privacy policies, which we recommend reviewing",
    ],
  },
  {
    title: "Your Rights",
    items: [
      "Access your personal data and account information",
      "Update or correct your profile information",
      "Request deletion of your account and associated data",
      "Export your data in a portable format",
      "Opt-out of non-essential communications",
    ],
  },
  {
    title: "Data Retention",
    body: "We retain your data for as long as your account is active or as needed to provide you services. Game statistics and team information may be retained for historical records even after account deletion. You can request complete data deletion through our contact page.",
  },
  {
    title: "Policy Updates",
    body: "This policy may be updated periodically to reflect changes in our practices or legal requirements. We will notify users of any material changes via email or through the platform. Your continued use of the service after such changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    body: "If you have any questions about this Privacy Policy or our data practices, please contact us through our contact page in the footer below. We will respond to your inquiry as soon as possible.",
  },
];

export default function PrivacyPolicy() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Privacy Policy"
        subtitle="This Privacy Policy explains how we collect, use, and protect your information when you use the Volleyball Game platform. By using our service, you agree to the collection and use of information in accordance with this policy."
      />

      <Prose>
        {POLICY_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.body && <p>{section.body}</p>}
            {section.items && (
              <ul>
                {section.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </Prose>
    </PageContainer>
  );
}
