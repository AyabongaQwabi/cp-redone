import Hero from "./components/Hero"
import Services from "./components/Services"
import WhyChooseUs from "./components/WhyChooseUs"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <main className="flex-grow">
        <Services />
        <WhyChooseUs />
        <div className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Ready to Get Started?</h2>
              <p className="mt-4 text-xl text-gray-600">
                Join ClinicPlus today and take the first step towards a healthier, more productive workplace.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Register Now
                </Link>
                <Link
                  href="/login"
                  className="ml-4 inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

