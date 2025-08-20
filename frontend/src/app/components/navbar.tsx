'use client'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

// Navigation items for doctors (medical sections)
const doctorNavigation = [
  { name: 'Nuestro Equipo', href: '/team', current: false },
  { name: 'Pacientes', href: '/patients', current: false },
  { name: 'Admisiones', href: '/admissions', current: false },
]

// Navigation items for admins (medical + exam management)
const adminDoctorNavigation = [
  { name: 'Nuestro Equipo', href: '/team', current: false },
  { name: 'Pacientes', href: '/patients', current: false },
  { name: 'Admisiones', href: '/admissions', current: false },
  { name: 'Exámenes', href: '/exams', current: false },
]

// Navigation items for police and other users
const generalNavigation = [
  { name: 'Nuestro Equipo', href: '/team', current: false },
]

// Navigation items for police users
const policeNavigation = [
  { name: 'Nuestro Equipo', href: '/team', current: false },
  { name: 'Verificación', href: '/police', current: false },
]

// Navigation items for admin police
const adminPoliceNavigation = [
  { name: 'Nuestro Equipo', href: '/team', current: false },
  { name: 'Verificación', href: '/police', current: false },
  { name: 'Exámenes', href: '/exams', current: false },
]

// Navigation for non-authenticated users
const publicNavigation = [
  { name: 'Nuestro Equipo', href: '/team', current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, systemUser, doctor, police, logout } = useAuth();

  // Determine user role and theme
  const userRole = systemUser?.role || (doctor ? 'doctor' : null)
  const isPolice = userRole === 'police'
  const currentUser = doctor || police
  
  // Theme colors based on role
  const themeColor = isPolice ? '#810000' : '#004e81' // Police red vs Hospital blue
  
  // Images based on authentication and role
  const titleImage = !user ? '/sistema.png' : (isPolice ? '/police-title-wh.png' : '/hosp-title-wh.png')
  const altText = !user ? 'Sistema' : (isPolice ? 'Policía Nacional' : 'Hospital General de Real')

  // Determine which navigation to show based on user role
  const getNavigationItems = () => {
    if (!user) {
      return publicNavigation
    }
    
    // Check if user is admin
    const isAdmin = systemUser?.is_admin || doctor?.is_admin || police?.is_admin
    
    // Check if user is a doctor (either from systemUser or legacy doctor)
    const isDoctor = systemUser?.role === 'doctor' || doctor
    
    if (isDoctor) {
      return isAdmin ? adminDoctorNavigation : doctorNavigation
    }
    
    if (isPolice) {
      return isAdmin ? adminPoliceNavigation : policeNavigation
    }
    
    // For other authenticated users
    return generalNavigation
  }

  const currentNavigation = getNavigationItems()
  const navigationWithCurrent = currentNavigation.map(item => ({
    ...item,
    current: pathname === item.href
  }))

  const handleLogin = () => {
    router.push('/login')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <Disclosure as="nav" className="relative" style={{ backgroundColor: themeColor }}>
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1" style={{ outlineColor: themeColor }}>
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img
                alt={altText}
                src={titleImage}
                className="h-8 w-auto cursor-pointer"
                onClick={() => router.push('/')}    
              />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigationWithCurrent.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={classNames(
                      item.current ? `bg-black/20 text-white` : 'text-gray-300 hover:bg-white/5 hover:text-white',
                      'rounded-md px-3 py-2 text-md font-medium',
                    )}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          
            {user ? (
              <>
                <Menu as="div" className="relative ml-3">
                  <MenuButton className="relative flex items-center space-x-2 rounded-md px-3 py-2 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: themeColor }}>
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    {currentUser && (
                      <div className="flex flex-col items-start">
                        <div className="font-semibold text-sm">{currentUser.name}</div>
                        <div className="text-xs text-gray-300">
                          DNI: {currentUser.dni}
                          {isPolice && police?.badge_number && (
                            <span className="ml-2">| Placa: {police.badge_number}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </MenuButton>

                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                  >
                    {currentUser && (
                      <>
                        <MenuItem>
                          <div className="block px-4 py-2 text-sm text-gray-700">
                            <div className="font-medium">{currentUser.name}</div>
                            <div className="text-gray-500">DNI: {currentUser.dni}</div>
                            {isPolice && police?.badge_number && (
                              <div className="text-gray-500">Placa: {police.badge_number}</div>
                            )}
                            {isPolice && police?.rank && (
                              <div className="text-gray-500">Rango: {police.rank}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {isPolice ? 'Policía' : 'Médico'}
                            </div>
                          </div>
                        </MenuItem>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    <MenuItem>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                      >
                        Cerrar sesión
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: themeColor }}
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigationWithCurrent.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={classNames(
                item.current ? 'bg-hospital-blue/80 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
          {!user && (
            <div className="pt-4 pb-3 border-t border-gray-700">
              <button
                onClick={handleLogin}
                className="w-full rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: themeColor, outlineColor: themeColor }}
              >
                Iniciar sesión
              </button>
            </div>
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
