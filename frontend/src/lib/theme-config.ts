// Theme configuration based on routes
export interface ThemeConfig {
  name: string
  primaryColor: string
  logoImage: string
  titleImage: string
  altText: string
  description: string
}

export const themes = {
  sigma: {
    name: 'SIGMA',
    primaryColor: '#ea7317', // Orange
    logoImage: '/sigma.png',
    titleImage: '/sigma.png',
    logoImageBase: '/sigma.png',
    altText: 'SIGMA - Sistema Integral de Gestión Municipal',
    description: 'Sistema integral de gestión de servicios municipales'
  },
  hospital: {
    name: 'Hospital',
    primaryColor: '#004e81', // Blue
    logoImage: '/hosp-logo.png',
    titleImage: '/hosp-title-wh.png',
    titleImageBase: '/hosp-title.png',
    altText: 'Hospital General de Real',
    description: 'Gestión de pacientes y servicios médicos'
  },
  police: {
    name: 'Policía',
    primaryColor: '#810000', // Red
    logoImage: '/police-logo.png',
    titleImage: '/police-title-wh.png',
    titleImageBase: '/police-title.png',
    altText: 'Policía Nacional',
    description: 'Verificación y consulta de certificados'
  }
} as const

export type ThemeType = keyof typeof themes

// Route-based theme mapping
export const getThemeByRoute = (pathname: string): ThemeType => {
  if (pathname.startsWith('/patients') || pathname.startsWith('/admissions')) {
    return 'hospital'
  }
  
  if (pathname.startsWith('/police')) {
    return 'police'
  }
  
  // Default theme for shared pages (home, exams, team, services, etc.)
  return 'sigma'
}

// Navigation items for different themes
export const navigationItems = {
  sigma: [
    { name: 'SIGMA', href: '/', current: false },
    { name: 'Nuestro Equipo', href: '/team', current: false },
  ],
  hospital: [
    { name: 'Inicio', href: '/', current: false },
    { name: 'Nuestro Equipo', href: '/team', current: false },
    { name: 'Pacientes', href: '/patients', current: false },
    { name: 'Admisiones', href: '/admissions', current: false },
    { name: 'Exámenes', href: '/exams', current: false },
  ],
  police: [
    { name: 'Inicio', href: '/', current: false },
    { name: 'Nuestro Equipo', href: '/team', current: false },
    { name: 'Verificación', href: '/police', current: false },
    { name: 'Exámenes', href: '/exams', current: false },
  ]
}

// Role-based navigation access
export const getNavigationForUser = (userRole: string | null, isAdmin: boolean, themeType: ThemeType) => {
  const baseNavigation = navigationItems[themeType]
  
  if (!userRole) {
    // Public access - only show basic pages
    return baseNavigation.filter(item => 
      item.href === '/' || 
      item.href === '/team' ||
      (themeType === 'police' && item.href === '/police')
    )
  }
  
  // Filter based on user permissions
  return baseNavigation.filter(item => {
    // Everyone can access these
    if (item.href === '/' || item.href === '/team') return true
    
    // Exams - only admins can access
    if (item.href === '/exams') return isAdmin
    
    // Hospital pages - only doctors
    if (item.href === '/patients' || item.href === '/admissions') {
      return userRole === 'doctor'
    }
    
    // Police pages - only police
    if (item.href === '/police') {
      return userRole === 'police'
    }
    
    return true
  })
}
