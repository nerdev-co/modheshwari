"use client";

export default function Terms() {
    return (
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-saffron font-medium">
                        Last updated: September 2026
                    </p>
                </div>

                <div className="bg-surface border p-8 border-border mb-8">
                    <p className="text-ink-secondary text-lg leading-relaxed">
                        By using Modheshwari, you agree to these terms. This is a community platform built for families and community members to stay connected.
                    </p>
                </div>

                {/* Accounts */}
                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-ink mb-4">
                        1. Accounts
                    </h2>
                    <div className="space-y-4 text-ink-secondary leading-relaxed">
                        <p>
                            You must be a member of the community to use Modheshwari. Accounts are created through family invites or community head approval.
                        </p>
                        <p>
                            You are responsible for keeping your account credentials secure. Do not share your password with anyone.
                        </p>
                        <p>
                            Each person should have one account. Duplicate accounts may be removed.
                        </p>
                    </div>
                </div>

                {/* Acceptable Use */}
                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-ink mb-4">
                        Acceptable Use
                    </h2>
                    <div className="bg-surface border p-6 border-border">
                        <p className="text-ink-secondary mb-4">You agree to:</p>
                        <ul className="space-y-2 text-ink-secondary list-disc list-inside">
                            <li>Use the platform for community and family purposes only</li>
                            <li>Keep your information accurate and up to date</li>
                            <li>Respect other members and their privacy</li>
                            <li>Report any misuse or inappropriate content</li>
                        </ul>
                        <p className="text-ink-secondary mt-4">You agree not to:</p>
                        <ul className="space-y-2 text-ink-secondary list-disc list-inside mt-2">
                            <li>Harass, bully, or threaten other members</li>
                            <li>Share false or misleading information about others</li>
                            <li>Use the platform for commercial or spam purposes</li>
                            <li>Try to access other accounts or system data</li>
                            <li>Share content that is illegal or harmful</li>
                        </ul>
                    </div>
                </div>

                {/* Your Content */}
                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-ink mb-4">
                        Your Content
                    </h2>
                    <div className="space-y-4 text-ink-secondary leading-relaxed">
                        <p>
                            You own the content you share on Modheshwari — your profile, messages, and family information.
                        </p>
                        <p>
                            By sharing content, you allow Modheshwari to display it to other community members as part of the platform's normal functionality (e.g., your name appears in search, your events appear in the calendar).
                        </p>
                        <p>
                            Community heads and family heads may manage content within their scope (approving events, managing family members) as part of the platform's designed hierarchy.
                        </p>
                    </div>
                </div>

                {/* Privacy & Data */}
                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-ink mb-4">
                        Privacy & Data
                    </h2>
                    <div className="space-y-4 text-ink-secondary leading-relaxed">
                        <p>
                            Your privacy matters. We collect only what's necessary to run the platform — name, email, family associations, and optional health information you choose to share.
                        </p>
                        <p>
                            We do not sell your data to third parties. We do not use your data for advertising.
                        </p>
                        <p>
                            Health information (blood groups, medical records) is visible only to your family members, not to the broader community.
                        </p>
                        <p>
                            See our <a href="/privacy" className="text-saffron hover:underline">Privacy Policy</a> for full details.
                        </p>
                    </div>
                </div>

                {/* Account Removal */}
                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-ink mb-4">
                        Account Removal
                    </h2>
                    <div className="space-y-4 text-ink-secondary leading-relaxed">
                        <p>
                            You can leave the community at any time. Contact your family head or community head to initiate account removal.
                        </p>
                        <p>
                            Community heads may remove accounts that violate these terms or are no longer part of the community.
                        </p>
                        <p>
                            When an account is removed, your personal data is deleted from active systems. Some data may be retained in backups for a limited period as part of standard infrastructure practices.
                        </p>
                    </div>
                </div>

                {/* Limitation */}
                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-ink mb-4">
                        Limitation
                    </h2>
                    <p className="text-ink-secondary leading-relaxed">
                        Modheshwari is provided as-is for community use. We work to keep it reliable, but we cannot guarantee uninterrupted service. We are not liable for any loss of data or misuse by other members. Use the platform responsibly and report any issues promptly.
                    </p>
                </div>

                {/* Changes */}
                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-ink mb-4">
                        Changes to These Terms
                    </h2>
                    <p className="text-ink-secondary leading-relaxed">
                        We may update these terms from time to time. Significant changes will be communicated through the platform. Continued use after changes constitutes acceptance of the updated terms.
                    </p>
                </div>

                {/* Contact */}
                <div className="mt-12 pt-8 border-t border-border text-center">
                    <p className="text-ink-muted text-sm">
                        Questions about these terms?{" "}
                        <a href="/contact" className="text-saffron hover:underline">
                            Contact us
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
