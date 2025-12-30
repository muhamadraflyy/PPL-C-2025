const feeStructure = [
  { role: "Client", fee: "0%", description: "Gratis tanpa biaya tambahan" },
  { role: "Freelancer", fee: "7.5%", description: "Biaya layanan dari setiap transaksi berhasil" }
];

export default function PaymentFees() {
  return (
    <section className="py-16 bg-gradient-to-b from-[#1D375B] to-[#0f1f36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Struktur Biaya
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {feeStructure.map((item, index) => (
            <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">{item.role}</h3>
              <div className="text-5xl font-bold text-blue-300 mb-4">{item.fee}</div>
              <p className="text-gray-300">{item.description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 mt-8 text-sm">
          * Biaya payment gateway sebesar 2.5% ditanggung oleh platform
        </p>
      </div>
    </section>
  );
}
