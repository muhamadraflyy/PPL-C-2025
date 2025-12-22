import { Shield, Lock, Eye } from 'lucide-react';

const highlights = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Data Anda Dilindungi',
    description: 'Kami menggunakan enkripsi standar industri untuk melindungi data Anda'
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Privasi Terjaga',
    description: 'Kami tidak menjual data pribadi Anda kepada pihak ketiga'
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Transparansi',
    description: 'Anda dapat mengakses dan mengelola data Anda kapan saja'
  }
];

export default function PrivacyHighlights() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          {highlights.map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm flex items-start gap-4">
              <div className="text-blue-600 flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
