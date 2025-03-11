import Link from "next/link"

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h2 className="text-lg font-semibold mb-4">About Us</h2>
            <p className="mb-4">
              ClinicPlus is dedicated to promoting healthy employees and empowering healthy work environments.
            </p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <ul>
              <li className="mb-2">
                <Link href="/" className="hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/contact" className="hover:text-gray-900">
                  Contact
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/dashboard" className="hover:text-gray-900">
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/admin-login" className="hover:text-gray-900">
                  Admin Login
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/admin-register" className="hover:text-gray-900">
                  Admin Register
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
            <p className="mb-2">Email: info@clinicplus.com</p>
            <p className="mb-2">Phone: (123) 456-7890</p>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} ClinicPlus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

