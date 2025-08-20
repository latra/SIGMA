import { auth } from '../app/firebase/config'
import { signOut } from 'firebase/auth'

/**
 * Handles automatic logout when receiving a 401 Unauthorized error
 * This function can be called from anywhere in the app to handle authentication failures
 */
export async function handleAuthError(error: any): Promise<void> {
  // Check if the error is a 401 Unauthorized error
  if (error?.message?.includes('401') || 
      error?.status === 401 || 
      error?.response?.status === 401) {
    
    console.warn('Received 401 Unauthorized error. Triggering automatic logout.')
    
    try {
      await signOut(auth)
      console.log('User automatically logged out due to 401 error')
      
      // Show a brief notification to the user
      if (typeof window !== 'undefined') {
        // Create a temporary notification
        const notification = document.createElement('div')
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `
        notification.textContent = 'Sesión expirada. Redirigiendo al login...'
        document.body.appendChild(notification)
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification)
          }
        }, 3000)
        
        // Redirect to login page after a brief delay
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      }
    } catch (logoutError) {
      console.error('Error during automatic logout:', logoutError)
    }
  }
}

/**
 * Wraps an API call with automatic 401 error handling
 */
export async function apiCallWithAuth<T>(
  apiCallFn: () => Promise<T>
): Promise<T> {
  try {
    return await apiCallFn()
  } catch (error) {
    await handleAuthError(error)
    throw error
  }
} 