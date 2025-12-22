const escrowSteps = [
  { step: 1, title: "Client Pesan", desc: "Client memesan layanan dan melakukan pembayaran" },
  { step: 2, title: "Dana Ditahan", desc: "Dana disimpan aman di sistem escrow kami" },
  { step: 3, title: "Freelancer Kerja", desc: "Freelancer mengerjakan dan mengirim hasil" },
  { step: 4, title: "Dana Dilepas", desc: "Setelah disetujui, dana dikirim ke freelancer" }
];

export default function PaymentEscrow() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Cara Kerja Sistem Escrow
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {escrowSteps.map((item, index) => (
            <div key={index} className="relative">
              <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
              {index < 3 && (
                <div className="hidden md:block absolute top-5 left-14 w-full h-0.5 bg-blue-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
