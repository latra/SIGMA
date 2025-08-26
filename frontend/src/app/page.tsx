'use client'
import Navbar from "./components/navbar";
import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';
import { themes } from '../lib/theme-config';
import { 
  HeartIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user, systemUser, doctor, police } = useAuth();
  const theme = themes.sigma;

  // Determine user role for permissions
  const userRole = systemUser?.role || (doctor ? 'doctor' : (police ? 'police' : null));
  const isAdmin = systemUser?.is_admin || doctor?.is_admin || police?.is_admin || false;

  const services = [
    {
      title: 'Gestión Hospitalaria',
      description: 'Administración de pacientes, admisiones y servicios médicos',
      icon: HeartIcon,
      color: '#004e81',
      href: '/patients',
      available: userRole === 'doctor',
      authRequired: true,
    },
    {
      title: 'Verificación Policial',
      description: 'Consulta y verificación de certificados ciudadanos',
      icon: ShieldCheckIcon,
      color: '#810000',
      href: '/police',
      available: userRole === 'police',
      authRequired: true,
    },
    {
      title: 'Gestión de Exámenes',
      description: 'Administración y consulta de exámenes médicos',
      icon: DocumentCheckIcon,
      color: theme.primaryColor,
      href: '/exams',
      available: isAdmin,
      authRequired: true,
    },
    {
      title: 'Nuestro Equipo',
      description: 'Conoce a nuestro equipo de profesionales',
      icon: UserGroupIcon,
      color: theme.primaryColor,
      href: '/team',
      available: true,
      authRequired: false,
    },
  ];

  const availableServices = services.filter(service => service.available);
  const publicServices = services.filter(service => !service.authRequired);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <img
              className="mx-auto h-32 w-auto mb-8"
              src={theme.logoImage}
              alt={theme.altText}
            />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bienvenido a{' '}
              <span style={{ color: theme.primaryColor }}>SIGMA</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Sistema Integral de Gestión Municipal - Conectando servicios, optimizando procesos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <HomeIcon className="w-5 h-5 mr-2" />
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center px-8 py-3 border-2 text-base font-medium rounded-md bg-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    style={{ 
                      borderColor: theme.primaryColor, 
                      color: theme.primaryColor 
                    }}
                  >
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Registrarse
                  </Link>
                </>
              ) : (
                <div className="text-lg text-gray-700">
                  Bienvenido, <span className="font-semibold">{(doctor || police)?.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Accede a los servicios municipales de forma centralizada y eficiente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(user ? availableServices : publicServices).map((service, index) => {
            const Icon = service.icon;
            return (
              <Link
                key={index}
                href={service.href}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="p-8">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: service.color + '15' }}
                  >
                    <Icon 
                      className="w-8 h-8" 
                      style={{ color: service.color }}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="mt-6 flex items-center text-sm font-medium group-hover:underline transition-all">
                    <span style={{ color: service.color }}>
                      Acceder al servicio
                    </span>
                    <svg 
                      className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" 
                      style={{ color: service.color }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Section for non-authenticated users */}
        {!user && (
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8 lg:p-12">
            <div className="text-center">
              <ClipboardDocumentListIcon 
                className="w-16 h-16 mx-auto mb-6" 
                style={{ color: theme.primaryColor }}
              />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Eres profesional médico o policía?
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Únete a SIGMA y accede a herramientas especializadas para la gestión 
                de servicios hospitalarios y verificación de certificados.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-3 text-base font-medium rounded-md text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Solicitar Acceso
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <img
              className="mx-auto h-12 w-auto mb-4 opacity-80"
              src={theme.logoImage}
              alt={theme.altText}
            />
            <p className="text-gray-400 mb-4">
              Sistema Integral de Gestión Municipal
            </p>
            
            {/* Créditos */}
            <div className="mb-6">
              <p className="text-gray-300 mb-2 font-medium">
                Desarrollado con ❤️ por
              </p>
              <p className="text-gray-400 text-sm">
                Paula "Latra" Gallucci y "Raudive"
              </p>
            </div>
            
            {/* Enlace al repositorio */}
            <div className="mb-6">
              <a
                href="https://github.com/latra/SIGMA/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors duration-200 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Código fuente en GitHub
              </a>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2025 SIGMA. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}