import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";

/**
 * Performs  privacy operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function Privacy() {
  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-jewel-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-jewel-gold font-medium">
            Last updated: 2026-02-02
          </p>
        </div>

        <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-8 border border-jewel-400/20 shadow-jewel mb-8">
          <p className="text-jewel-700 text-lg leading-relaxed">
            We take your privacy seriously. This document describes that all of your information will be visible only to you, your family, and higher-level admins. Not a single thing can be accessed by anyone else.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-6 border border-jewel-400/20 shadow-jewel">
            <h2 className="text-xl font-display font-bold text-jewel-900 mb-3">Security Tips</h2>
            <ul className="space-y-2 text-jewel-700">
              <li>Use strong passwords</li>
              <li>Never share your password with anyone</li>
              <li>Change your password regularly</li>
              <li>Log out after each session</li>
            </ul>
          </div>

          <div className="bg-jewel-50/80 backdrop-blur-xl rounded-2xl p-6 border border-jewel-400/20 shadow-jewel">
            <h2 className="text-xl font-display font-bold text-jewel-900 mb-3">Before Requests</h2>
            <ul className="space-y-2 text-jewel-700">
              <li>Discuss with your family</li>
              <li>Speak with your peers</li>
              <li>Consider community impact</li>
              <li>Review guidelines carefully</li>
            </ul>
          </div>
        </div>

        <div className="bg-jewel-gold/10 rounded-2xl p-8 border-2 border-jewel-gold/30">
          <div className="flex items-start gap-4">
            <div>
              <h3 className="text-xl font-display font-bold text-jewel-900 mb-2">Important</h3>
              <p className="text-jewel-700">
                <strong>Do not share your passwords</strong> with anyone, including family members or administrators. Your password is personal and should remain confidential at all times.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-jewel-400/20 text-center">
          <p className="text-jewel-500 text-sm">
            For questions about our privacy policy, please contact us at support@modheshwari.com
          </p>
        </div>
      </div>
    </DreamySunsetBackground>
  );
}
