// src/components/layout/Footer.tsx 
import Link from 'next/link'
import { FaTelegramPlane, FaVk, FaYoutube } from 'react-icons/fa'

const currentYear = new Date().getFullYear()

const footerLinks = [
  {
    title: 'Юридическая информация',
    links: [
      { href: '/privacy', label: 'Политика конфиденциальности' },
      { href: '/refund', label: 'Политика возврата средств' },
      { href: '/cookies', label: 'Политика использования cookie' },
      { href: '/terms', label: 'Условия использования' },
    ],
  },
]

const socialLinks = [
  {
    href: 'https://t.me/deflowmedia',
    icon: FaTelegramPlane,
    label: 'Telegram',
    bgColor: 'bg-gray-100',
    iconColor: 'text-blue-500',
    hoverBg: 'hover:bg-gray-200',
  },
  {
    href: 'https://vk.com/deflowmedia',
    icon: FaVk,
    label: 'VK',
    bgColor: 'bg-gray-100',
    iconColor: 'text-blue-700',
    hoverBg: 'hover:bg-gray-200',
  },
  {
    href: 'https://youtube.com/deflowru',
    icon: FaYoutube,
    label: 'YouTube',
    bgColor: 'bg-gray-100',
    iconColor: 'text-red-600',
    hoverBg: 'hover:bg-gray-200',
  },
]

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Социальные сети */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-black">Подпишитесь на нас</h3>
          <div className="flex space-x-4">
            {socialLinks.map((social) => {
              const Icon = social.icon
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${social.bgColor} ${social.hoverBg} p-2 rounded-full ${social.iconColor} transition-transform hover:scale-110`}
                  aria-label={social.label}
                >
                  <Icon size={20} />
                </a>
              )
            })}
          </div>
        </div>

        {/* Юридическая информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-bold mb-4 text-black">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-black hover:text-black transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-lg font-bold mb-4 text-black">Контакты</h3>
            <a
              href="mailto:deflowru@mail.ru"
              className="text-black hover:text-black transition-colors"
            >
              deflowru@mail.ru
            </a>
          </div>
        </div>

        {/* Дисклеймер */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="text-xs text-gray-800 space-y-4">
            <p>
              Аналитическая платформа DEFLOW представляет собой специализированный сервис для агрегации и анализа финансовой информации, собирая и систематизируя данные из множества источников, включая официальные биржевые отчетности, финансовые новости, аналитические обзоры и публичные данные о сделках с ценными бумагами и другими финансовыми инструментами.
            </p>
            <p>
              Вся информация на платформе носит исключительно образовательный и информационный характер и не является инвестиционной рекомендацией, предложением о покупке или продаже финансовых инструментов, либо индивидуальной инвестиционной консультацией. DEFLOW выступает в качестве агрегатора информации, размещенной различными аналитиками и экспертами на интернет-ресурсах и в специализированных источниках, предоставляя инструменты для анализа и сравнения данных, но не осуществляя самостоятельную инвестиционную деятельность и не давая персональных финансовых рекомендаций.
            </p>
            <p>
              Платформа не берет на себя обязательства по постоянной корректировке аналитических данных и инвестиционных идей в связи с изменением рыночной конъюнктуры, утратой актуальности информации или выявлением несоответствия приводимых данных действительности. Администрация DEFLOW не несет ответственности за содержание, точность и последствия использования размещенной на платформе информации, включая любые возможные убытки от сделок с финансовыми инструментами, совершенных на основе представленных данных.
            </p>
            <p>
              Все инвестиционные решения принимаются пользователями самостоятельно и под их собственную ответственность. Используя платформу DEFLOW, вы подтверждаете, что понимаете риски, связанные с инвестиционной деятельностью, и осознаете, что прошлые результаты не гарантируют будущих доходов. Если вы не согласны с данными условиями, немедленно покиньте платформу и не используйте размещенную на ней информацию.
            </p>
          </div>
        </div>

        {/* Копирайт */}
        <div className="border-t border-gray-800 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-800">
          <p>DEFLOW — Умные инструменты для трейдеров</p>
          <p>© {currentYear} DEFLOW. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}