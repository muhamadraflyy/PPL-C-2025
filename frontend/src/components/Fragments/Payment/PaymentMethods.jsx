import { CreditCard, Wallet, Building2, QrCode } from 'lucide-react';

const paymentMethods = [
  {
    icon: <Building2 className="w-8 h-8" />,
    title: "Transfer Bank",
    description: "BCA, Mandiri, BNI, BRI, dan bank lainnya",
    note: "Verifikasi instan"
  },
  {
    icon: <Wallet className="w-8 h-8" />,
    title: "E-Wallet",
    description: "GoPay, OVO, DANA, ShopeePay",
    note: "Pembayaran cepat"
  },
  {
    icon: <QrCode className="w-8 h-8" />,
    title: "QRIS",
    description: "Scan & bayar dari aplikasi apapun",
    note: "Universal payment"
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: "Kartu Kredit/Debit",
    description: "Visa, Mastercard, JCB",
    note: "Pembayaran aman"
  }
];

export default function PaymentMethods() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Metode Pembayaran
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paymentMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-blue-600 mb-4">{method.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{method.description}</p>
              <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                {method.note}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
