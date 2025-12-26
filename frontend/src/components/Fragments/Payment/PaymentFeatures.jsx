import { Shield, Clock, CheckCircle } from 'lucide-react';

const paymentFeatures = [
  {
    icon: <Shield className="w-12 h-12 text-blue-600" />,
    title: "Sistem Escrow Aman",
    description: "Dana Anda aman tersimpan hingga pekerjaan selesai. Pembayaran hanya dilepas ke freelancer setelah Anda menyetujui hasil kerja."
  },
  {
    icon: <Clock className="w-12 h-12 text-blue-600" />,
    title: "Proses Cepat",
    description: "Pembayaran diproses dalam hitungan menit. Freelancer dapat menerima dana mereka dengan cepat setelah pekerjaan disetujui."
  },
  {
    icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
    title: "Transparansi Biaya",
    description: "Tidak ada biaya tersembunyi. Semua biaya ditampilkan dengan jelas sebelum Anda melakukan pembayaran."
  }
];

export default function PaymentFeatures() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Keunggulan Sistem Pembayaran Kami
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {paymentFeatures.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
