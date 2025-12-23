import { Mail, MessageCircle } from 'lucide-react';

export default function LegalContact() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ada Pertanyaan?
          </h2>
          <p className="text-gray-600 mb-6">
            Jika Anda memiliki pertanyaan tentang kebijakan kami atau ingin menggunakan
            hak privasi Anda, silakan hubungi kami.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:privacy@skillconnect.id"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              privacy@skillconnect.id
            </a>
            <a
              href="/faq"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Lihat FAQ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
