import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Contact Us | Fìlà Yorùbá",
  description:
    "Get in touch with Fìlà Yorùbá for product inquiries, support, and partnerships.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="bg-[#000000] text-white py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif">
            Contact Fìlà Yorùbá
          </h1>

          <p className="mt-4 text-slate-200 max-w-2xl text-sm sm:text-base">
            We would love to hear from you. Reach out for inquiries,
            orders, partnerships, or support.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl grid md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#000000]">
              Get In Touch
            </h2>

            <div className="space-y-6 mt-8">
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-muted-foreground">
                  demo@filayoruba.com
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Phone / Support</h3>
                <p className="text-muted-foreground">
                  +234 (0) 800 FILA DEMO (Showcase Mode)
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Portfolio Sandbox</h3>
                <p className="text-muted-foreground">
                  Available for evaluator review &amp; inquiries.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-4">
            <Input placeholder="Full Name" />

            <Input
              type="email"
              placeholder="Email Address"
            />

            <textarea
              className="w-full min-h-40 rounded-xl border p-4"
              placeholder="Message"
            />

            <Button className="w-full">
              Send Message
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}