/**
 * Employee Portal Dashboard (Landing Page)
 * 
 * Context: SimpleIT v0.4.3 - Main entry point for employee portal
 * 
 * Behavior:
 * - Redirects to /portal/my-assets (main view for employees)
 * - Could be enhanced later with dashboard widgets
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function PortalDashboard() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to My Assets as the default view
    navigate('/portal/my-assets');
  }, [navigate]);

  return null;
}