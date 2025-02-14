'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

const teamMembers = [
  {
    name: 'Onur Can Şahin',
    role: 'Kurucu & İç Mimar',
    image: '/onur.jpg',
    bio: 'Deneyimli bir iç mimar olarak, ikinci el eşyaların sürdürülebilir yaşamdaki önemini bilen Onur, Stofhamp\'ın kurucu lideridir. Çevresel sürdürülebilirlik ve modern tasarım ilkelerini birleştirerek, kullanılmış eşyalara yeni bir yaşam kazandırma vizyonuyla hareket etmektedir.',
    social: {
      linkedin: '#',
      twitter: '#',
      instagram: '#'
    }
  },
  {
    name: 'Berkan Çelik',
    role: 'Kurucu Ortak & Yazılım Geliştirici',
    image: '/berkan.jpg',
    bio: 'Modern web teknolojileri konusundaki derin bilgisi ve kullanıcı deneyimi odaklı yaklaşımıyla, Stofhamp\'ın teknolojik altyapısını geliştiren kişidir. Güvenli ve kullanıcı dostu bir platform oluşturma konusundaki tutkusuyla tanınır.',
    social: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  },
  {
    name: 'Hamza Şahin',
    role: 'Kurucu Ortak & Ürün Yöneticisi',
    image: '/hamza.jpg',
    bio: 'Kullanıcı ihtiyaçlarını analiz etme ve pazar stratejileri geliştirme konusundaki uzmanlığıyla, Stofhamp\'ın ürün vizyonunu şekillendirmektedir. İkinci el eşya pazarını daha erişilebilir ve güvenilir hale getirme misyonuyla çalışmaktadır.',
    social: {
      linkedin: '#',
      twitter: '#',
      instagram: '#'
    }
  }
]

const stats = [
  { number: '1000+', label: 'Aktif Kullanıcı' },
  { number: '500+', label: 'Başarılı İşlem' },
  { number: '50+', label: 'Şehir' },
  { number: '4.8/5', label: 'Kullanıcı Memnuniyeti' }
]

export default function AboutPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={containerRef} className="relative">
      {/* Hero Section with Parallax */}
      <div className="relative h-screen overflow-hidden">
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-700 to-green-500"
        />
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Animated Background Patterns */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-[url('/pattern.png')] bg-repeat opacity-10"
        />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center mb-8"
          >
            <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-white/30 rounded-full text-sm md:text-base font-medium mb-4 sm:mb-6 backdrop-blur-sm">
              Çevre Dostu E-Ticaret Platformu
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-3xl sm:text-5xl md:text-7xl font-bold text-center mb-6 sm:mb-8 leading-tight"
          >
            Değerli Eşyalar,<br />
            <span className="text-green-300">Yeni Hikayeler</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl text-center max-w-3xl mb-8 sm:mb-12 text-gray-200 px-4"
          >
            Her ikinci el eşya, yeni bir başlangıcın hikayesidir. Sürdürülebilir yarınlar için bugünden adım atın.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 px-4"
          >
            <Link 
              href="/listings" 
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-green-800 rounded-full font-semibold hover:bg-green-50 transition-colors text-center"
            >
              İlanları Keşfet
            </Link>
            <Link 
              href="/contact" 
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors text-center"
            >
              Bize Ulaşın
            </Link>
          </motion.div>
        </div>

        {/* Animated Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        >
          <span className="text-white/60 text-sm mb-2">Aşağı Kaydır</span>
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-xl"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Misyonumuz</h2>
              <p className="text-gray-600 leading-relaxed">
                İkinci el eşyaların alım-satımını güvenli, şeffaf ve kolay hale getirerek, 
                sürdürülebilir tüketimi desteklemek ve çevresel etkimizi azaltmak için 
                çalışıyoruz. Her bir eşyanın yeni bir hikayeye başlamasına öncülük ediyoruz.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-bl from-green-50 to-white p-8 rounded-2xl shadow-xl"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Vizyonumuz</h2>
              <p className="text-gray-600 leading-relaxed">
                Türkiye'nin en güvenilir ve tercih edilen ikinci el eşya platformu olarak, 
                sürdürülebilir tüketim alışkanlıklarının yaygınlaşmasına öncülük etmek 
                istiyoruz. Teknoloji ve güvenin birleştiği noktada, herkes için değer yaratıyoruz.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-12 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-16"
          >
            Ekibimiz
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white">
                  <div className="relative h-64 sm:h-96">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-green-600 font-medium mb-4">{member.role}</p>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 line-clamp-3">{member.bio}</p>
                    <div className="flex space-x-4">
                      {Object.entries(member.social).map(([platform, link]) => (
                        <a
                          key={platform}
                          href={link}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="capitalize">{platform}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-gray-900 mb-16"
          >
            Değerlerimiz
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Güvenilirlik</h3>
              <p className="text-gray-600 text-center">
                Kullanıcılarımıza güvenli bir alışveriş deneyimi sunmak için sürekli çalışıyoruz.
                Her işlemde şeffaflık ve dürüstlük prensibimizdir.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Sürdürülebilirlik</h3>
              <p className="text-gray-600 text-center">
                Çevresel etkimizi minimize ederek, sürdürülebilir bir gelecek için çalışıyoruz.
                Her ikinci el eşya, doğaya katkımızdır.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">İnovasyon</h3>
              <p className="text-gray-600 text-center">
                Teknoloji ve yenilikçi çözümlerle kullanıcı deneyimini sürekli iyileştiriyoruz.
                Gelişim ve yenilik DNA'mızda var.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 