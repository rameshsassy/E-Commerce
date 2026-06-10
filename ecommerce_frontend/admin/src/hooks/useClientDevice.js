import { useEffect, useState } from 'react';
import { getClientDeviceType, getViewportWidth } from '../utils/clientDevice';

/**
 * Reactive mobile / tablet / desktop breakpoint for conditional UI.
 */
export function useClientDevice() {
  const [deviceType, setDeviceType] = useState(() => getClientDeviceType());

  useEffect(() => {
    const onResize = () => setDeviceType(getClientDeviceType());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    viewportWidth: getViewportWidth(),
  };
}

export default useClientDevice;
