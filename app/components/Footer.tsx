import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href="/" className="text-base text-gray-600 hover:text-gray-900">
              Home
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/contact" className="text-base text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/login" className="text-base text-gray-600 hover:text-gray-900">
              Admin Login
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/login" className="text-base text-gray-600 hover:text-gray-900">
              Admin Register
            </Link>
          </div>
        </nav>
        <p className="mt-8 text-center text-base text-gray-600">&copy; 2023 ClinicPlus. All rights reserved.</p>
        <p className="mt-2 text-center text-sm text-gray-600">
          Built for maximum impact by Ayabonga Qwabi (
          <a href="https://ayabonga.com" className="hover:text-gray-900">
            ayabonga.com
          </a>
          )
        </p>
      </div>
    </footer>
  )
}

