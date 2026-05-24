import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Prowider</h1>
        <p className="text-gray-500 text-sm mb-8">Lead Distribution System</p>
        <div className="space-y-3">
          <Link
            href="/request-service"
            className="block w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
          >
            Submit a Lead
          </Link>
          <Link
            href="/dashboard"
            className="block w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
          >
            Provider Dashboard
          </Link>
          <Link
            href="/test-tools"
            className="block w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
          >
            Test Tools
          </Link>
        </div>
      </div>
    </div>
  )
}