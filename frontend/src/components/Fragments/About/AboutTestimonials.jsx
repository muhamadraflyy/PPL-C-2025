const testimonials = [
  {
    name: 'Andi Pratama',
    role: 'Web Developer',
    quote: 'SkillConnect membantu saya mendapatkan proyek-proyek berkualitas dan membangun karir freelance yang stabil.'
  },
  {
    name: 'Siti Rahayu',
    role: 'Graphic Designer',
    quote: 'Platform yang sangat user-friendly dengan sistem pembayaran yang aman. Sangat recommended!'
  },
  {
    name: 'Budi Santoso',
    role: 'Content Writer',
    quote: 'Sejak bergabung di SkillConnect, penghasilan saya meningkat 3x lipat. Terima kasih SkillConnect!'
  }
];

export default function AboutTestimonials() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Cerita Sukses Freelancer
          </h2>
          <p className="text-gray-600">
            Dengarkan pengalaman mereka yang telah sukses bersama SkillConnect
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-600">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
