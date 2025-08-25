'use client'
import Navbar from "../components/navbar";
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { themes } from '../../lib/theme-config';
import { 
  HeartIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  DocumentCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function ServicesPage() {
  const { user, systemUser, doctor, police } = useAuth();
  const theme = themes.sigma;

  // Determine user role for permissions
  const userRole = systemUser?.role || (doctor ? 'doctor' : (police ? 'police' : null));
  const isAdmin = systemUser?.is_admin || doctor?.is_admin || police?.is_admin || false;

  const services = [
    {
      title: 'Gestión Hospitalaria',
      description: 'Administración de pacientes, admisiones y servicios médicos del Hospital General de Real',
      icon: HeartIcon,
      color: themes.hospital.primaryColor,
      href: '/patients',
      available: userRole === 'doctor',
      authRequired: true,
      features: [
        'Registro y gestión de pacientes',
        'Control de admisiones',
        'Historial médico',
        'Seguimiento de tratamientos'
      ]
    },
    {
      title: 'Verificación Policial',
      description: 'Consulta y verificación de certificados ciudadanos para fuerzas del orden',
      icon: ShieldCheckIcon,
      color: themes.police.primaryColor,
      href: '/police',
      available: userRole === 'police',
      authRequired: true,
      features: [
        'Verificación de certificados',
        'Consulta por DNI',
        'Validación de exámenes',
        'Historial de consultas'
      ]
    },
    {
      title: 'Gestión de Exámenes',
      description: 'Administración completa del sistema de exámenes y certificaciones',
      icon: DocumentCheckIcon,
      color: theme.primaryColor,
      href: '/exams',
      available: isAdmin,
      authRequired: true,
      features: [
        'Crear y gestionar exámenes',
        'Asignar certificaciones',
        'Reportes y estadísticas',
        'Control de validez'
      ]
    },
    {
      title: 'Nuestro Equipo',
      description: 'Conoce a nuestro equipo de profesionales especializados',
      icon: UserGroupIcon,
      color: theme.primaryColor,
      href: '/team',
      available: true,
      authRequired: false,
      features: [
        'Perfiles de especialistas',
        'Información de contacto',
        'Horarios de atención',
        'Especialidades médicas'
      ]
    },
  ];

  const availableServices = services.filter(service => service.available);

  if (!user) {
    // Redirect to home if not authenticated
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Acceso Restringido
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Debes iniciar sesión para ver los servicios disponibles.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-white shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Volver al inicio
            </Link>
          </div>
          
          <div className="text-center">
            <img
              className="mx-auto h-16 w-auto mb-6"
              src={theme.logoImage}
              alt={theme.altText}
            />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Servicios Disponibles
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {userRole === 'doctor' && 'Accede a las herramientas de gestión hospitalaria y exámenes médicos'}
              {userRole === 'police' && 'Utiliza las herramientas de verificación policial y consulta de certificados'}
              {!userRole && 'Explora los servicios disponibles para tu perfil'}
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availableServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                    style={{ backgroundColor: service.color + '15' }}
                  >
                    <Icon 
                      className="w-8 h-8" 
                      style={{ color: service.color }}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    {service.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Funcionalidades:</h4>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <div 
                          className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                          style={{ backgroundColor: service.color }}
                        ></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Link
                    href={service.href}
                    className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    style={{ backgroundColor: service.color }}
                  >
                    Acceder al Servicio
                    <svg 
                      className="ml-2 w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* No services available message */}
        {availableServices.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <DocumentCheckIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay servicios disponibles
            </h3>
            <p className="text-gray-600 mb-6">
              Tu perfil actual no tiene acceso a servicios específicos. 
              Contacta con un administrador para más información.
            </p>
            <Link
              href="/team"
              className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-white shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Ver Nuestro Equipo
            </Link>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Si tienes dudas sobre el uso de algún servicio o necesitas permisos adicionales, 
              nuestro equipo está disponible para asistirte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/team"
                className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md bg-white border-2 shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ 
                  borderColor: theme.primaryColor, 
                  color: theme.primaryColor 
                }}
              >
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Contactar Equipo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
