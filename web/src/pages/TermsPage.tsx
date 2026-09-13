import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-24 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-2 text-[11px] tracking-[0.35em] uppercase text-leaf-700 font-semibold mb-3">
            <FileText className="w-4 h-4" /> Legal
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-ink-900 mb-3">Terms of Service</h1>
          <p className="text-ink-800/60 text-sm mb-12">Last updated: July 2026</p>

          <div className="space-y-8 text-ink-800/80 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">1. Acceptance of Terms</h2>
              <p>
                By creating an account or using TourGenie, you agree to these Terms of Service and
                our Privacy Policy. If you do not agree, please do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">2. Bookings and Payments</h2>
              <p>
                Tour, hotel, vehicle, and guide bookings made through TourGenie are subject to
                availability at the time of confirmation. Prices shown, including fuel-cost
                estimates in Daily Mode and Create Tour, are estimates based on live data sources
                and may vary slightly from actual costs incurred. All bookings are confirmed only
                once payment has been processed and a confirmation email has been sent.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">3. Cancellations and Refunds</h2>
              <p>
                Cancellation terms vary by tour, hotel, and vehicle/guide provider and are shown at
                the time of booking. Refund eligibility depends on how far in advance a booking is
                cancelled relative to the scheduled date.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">4. Live Navigation and Location Features</h2>
              <p>
                Live map routes, proximity alerts, and fuel/rest-stop suggestions are provided for
                convenience and rely on third-party mapping and location data. TourGenie does not
                guarantee real-time accuracy in areas with poor signal or outdated map data, and
                travellers remain responsible for their own safety and route decisions while
                travelling.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">5. User Conduct</h2>
              <p>
                You agree not to misuse the platform, including submitting false booking
                information, attempting to interfere with the AI trip-planning or navigation
                systems, or using the service for any unlawful purpose.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">6. Limitation of Liability</h2>
              <p>
                TourGenie facilitates bookings with independent hotels, tour operators, drivers,
                and guides. We are not liable for the acts or omissions of these independent
                providers, though we will assist in good faith with resolving any disputes.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">7. Changes to These Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of TourGenie after an
                update constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-900 mb-2">8. Contact</h2>
              <p>
                Questions about these terms can be sent to{" "}
                <a href="mailto:hello@serendib.lk" className="text-leaf-700 underline">
                  hello@serendib.lk
                </a>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
