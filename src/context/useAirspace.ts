import { useContext } from 'react';
import { AirspaceContext } from './airspaceContextDef';

export const useAirspace = () => {
  const context = useContext(AirspaceContext);
  if (!context) {
    throw new Error('useAirspace must be used within an AirspaceProvider');
  }
  return context;
};
