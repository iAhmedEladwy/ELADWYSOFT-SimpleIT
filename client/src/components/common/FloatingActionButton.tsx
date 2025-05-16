import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Plus, 
  X, 
  User, 
  PlusCircle, 
  Briefcase, 
  Laptop, 
  Ticket, 
  Settings, 
  DownloadCloud 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  permission?: number; // Minimum access level required (1, 2, or 3)
}

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { hasAccess } = useAuth();

  // Determine actions based on current route
  const getContextActions = (): ActionItem[] => {
    // Dashboard actions
    if (location === '/') {
      return [
        {
          icon: <Briefcase className="h-4 w-4 mr-2" />,
          label: 'New Employee',
          onClick: () => window.location.href = '/employees?action=new',
          permission: 2
        },
        {
          icon: <Laptop className="h-4 w-4 mr-2" />,
          label: 'New Asset',
          onClick: () => window.location.href = '/assets?action=new',
          permission: 2
        },
        {
          icon: <Ticket className="h-4 w-4 mr-2" />,
          label: 'New Ticket',
          onClick: () => window.location.href = '/tickets?action=new',
          permission: 1
        }
      ];
    }
    
    // Employee page actions
    else if (location.startsWith('/employees')) {
      return [
        {
          icon: <PlusCircle className="h-4 w-4 mr-2" />,
          label: 'Add Employee',
          onClick: () => {
            const event = new CustomEvent('fab:add-employee');
            window.dispatchEvent(event);
          },
          permission: 2
        },
        {
          icon: <DownloadCloud className="h-4 w-4 mr-2" />,
          label: 'Export Employees',
          onClick: () => window.open('/api/employees/export', '_blank'),
          permission: 2
        }
      ];
    }
    
    // Asset page actions
    else if (location.startsWith('/assets')) {
      return [
        {
          icon: <PlusCircle className="h-4 w-4 mr-2" />,
          label: 'Add Asset',
          onClick: () => {
            const event = new CustomEvent('fab:add-asset');
            window.dispatchEvent(event);
          },
          permission: 2
        },
        {
          icon: <DownloadCloud className="h-4 w-4 mr-2" />,
          label: 'Export Assets',
          onClick: () => window.open('/api/assets/export', '_blank'),
          permission: 2
        }
      ];
    }
    
    // Ticket page actions
    else if (location.startsWith('/tickets')) {
      return [
        {
          icon: <PlusCircle className="h-4 w-4 mr-2" />,
          label: 'Create Ticket',
          onClick: () => {
            const event = new CustomEvent('fab:add-ticket');
            window.dispatchEvent(event);
          },
          permission: 1
        }
      ];
    }
    
    // Users page actions
    else if (location.startsWith('/users')) {
      return [
        {
          icon: <User className="h-4 w-4 mr-2" />,
          label: 'Add User',
          onClick: () => {
            const event = new CustomEvent('fab:add-user');
            window.dispatchEvent(event);
          },
          permission: 3
        }
      ];
    }
    
    // System Config page actions
    else if (location.startsWith('/system-config')) {
      return [
        {
          icon: <Settings className="h-4 w-4 mr-2" />,
          label: 'Save Config',
          onClick: () => {
            const event = new CustomEvent('fab:save-config');
            window.dispatchEvent(event);
          },
          permission: 3
        }
      ];
    }
    
    // Default actions if no specific context
    return [
      {
        icon: <Briefcase className="h-4 w-4 mr-2" />,
        label: 'New Employee',
        onClick: () => window.location.href = '/employees?action=new',
        permission: 2
      },
      {
        icon: <Laptop className="h-4 w-4 mr-2" />,
        label: 'New Asset',
        onClick: () => window.location.href = '/assets?action=new',
        permission: 2
      }
    ];
  };
  
  // Filter actions based on user permissions
  const actions = getContextActions().filter(action => 
    !action.permission || hasAccess(action.permission)
  );
  
  // If no actions available for the user's permission level, don't render the FAB
  if (actions.length === 0) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div 
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Button
                  onClick={() => {
                    setOpen(false);
                    action.onClick();
                  }}
                  size="sm"
                  className="flex items-center shadow-md"
                  variant="outline"
                >
                  {action.icon}
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button
        className={`h-14 w-14 rounded-full shadow-lg ${open ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
        onClick={() => setOpen(!open)}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </Button>
    </div>
  );
}