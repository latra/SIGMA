'use client'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, DocumentCheckIcon, KeyIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { getThemeByRoute, themes, getNavigationForUser, type ThemeType } from '../../lib/theme-config'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, systemUser, doctor, police, logout } = useAuth();

  // Determine current theme based on route
  const currentTheme: ThemeType = getThemeByRoute(pathname)
  const theme = themes[currentTheme]
  
  // Determine user role
  const userRole = systemUser?.role || (doctor ? 'doctor' : (police ? 'police' : null))
  const isAdmin = systemUser?.is_admin || doctor?.is_admin || police?.is_admin || false
  const currentUser = doctor || police
  
  // Get navigation items based on theme and user permissions
  const currentNavigation = getNavigationForUser(userRole, isAdmin, currentTheme)
  const navigationWithCurrent = currentNavigation.map(item => ({
    ...item,
    current: pathname === item.href
  }))

  const isPolice = police !== null
  const isDoctor = doctor !== null

  const handleLogin = () => {
    router.push('/login')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <Disclosure as="nav" className="relative shadow-lg" style={{ backgroundColor: theme.primaryColor }}>
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/10 hover:text-white focus:outline-2 focus:-outline-offset-1 transition-colors" style={{ outlineColor: theme.primaryColor }}>
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img
                alt={theme.altText}
                src={theme.titleImage}
                className="h-8 w-auto cursor-pointer transition-transform hover:scale-105"
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
                      item.current ? `bg-black/20 text-white` : 'text-gray-300 hover:bg-white/10 hover:text-white',
                      'rounded-md px-3 py-2 text-md font-medium transition-colors',
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
                {/* Services link for authenticated users */}
                <Link
                  href="/services"
                  className="mr-4 inline-flex items-center px-4 py-2.5 text-base font-semibold rounded-lg text-white bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <DocumentCheckIcon className="w-5 h-5 mr-2" />
                  Mis Servicios
                </Link>
                
                <Menu as="div" className="relative ml-3">
                  <MenuButton className="relative flex items-center space-x-2 rounded-md px-3 py-2 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors" style={{ outlineColor: theme.primaryColor }}>
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
              <Link
                href="/change-password"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden hover:bg-gray-100 transition-colors"
              >
                <KeyIcon className="mr-3 h-4 w-4" />
                Cambiar contraseña
              </Link>
            </MenuItem>

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
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                style={{ outlineColor: theme.primaryColor, color: theme.primaryColor }}
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
                item.current ? 'bg-black/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
          
          {/* Services link for authenticated users - Mobile */}
          {user && (
            <div className="pt-4 pb-3 border-t border-white/20">
              <DisclosureButton
                as={Link}
                href="/services"
                className="flex items-center w-full px-4 py-3 text-lg font-semibold rounded-lg text-white bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-lg transition-all duration-200"
              >
                <DocumentCheckIcon className="w-6 h-6 mr-3" />
                Mis Servicios
              </DisclosureButton>
            </div>
          )}
          
          {!user && (
            <div className="pt-4 pb-3 border-t border-gray-700">
              <button
                onClick={handleLogin}
                className="w-full rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: theme.primaryColor, outlineColor: theme.primaryColor }}
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
