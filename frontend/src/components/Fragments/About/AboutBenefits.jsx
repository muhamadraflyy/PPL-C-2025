import { Users, Briefcase, Award, Globe, Heart, Zap } from 'lucide-react';

const benefits = [
  {
    icon: <Briefcase className="w-8 h-8" />,
    title: 'Proyek Berkualitas',
    description: 'Akses ke ribuan proyek dari berbagai industri dan tingkat kompleksitas'
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: 'Sistem Rating',
    description: 'Rating dan review transparan membantu membangun reputasi Anda'
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: 'Fleksibilitas Lokasi',
    description: 'Bekerja dari mana saja, kapan saja sesuai jadwal Anda'
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: 'Komunitas Supportif',
    description: 'Bergabung dengan komunitas freelancer yang saling mendukung'
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Pembayaran Cepat',
    description: 'Sistem escrow yang aman dengan pencairan dana yang cepat'
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Client Terpercaya',
    description: 'Bekerja dengan client yang terverifikasi dan profesional'
  }
];

export default function AboutBenefits() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Mengapa Bekerja dengan SkillConnect?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nikmati berbagai keuntungan yang kami tawarkan untuk mendukung kesuksesan Anda
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-blue-600 mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
