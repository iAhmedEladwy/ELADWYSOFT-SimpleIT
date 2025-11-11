import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import UsersTable from '@/components/users/UsersTable';
import UserForm from '@/components/users/UserForm';
import ChangePasswordDialog from '@/components/users/ChangePasswordDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Shield, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

export default function Users() {
  const { hasAccess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<any>(null);
  
  // Listen for the FAB add user event
  useEffect(() => {
    const handleFabAddUser = () => {
      // Clear editing state and open dialog for new user
      setEditingUser(null);
      setOpenDialog(true);
    };
    
    // Register event listener
    window.addEventListener('fab:add-user', handleFabAddUser);
    
    // Check if URL has action=new parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      handleFabAddUser();
      // Clean up the URL to prevent dialog from reopening on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Clean up
    return () => {
      window.removeEventListener('fab:add-user', handleFabAddUser);
    };
  }, []);

  // Translations
  const translations = {
    title: language === 'English' ? 'User Management' : 'إدارة المستخدمين',
    description: language === 'English' 
      ? 'Create and manage system users with different access levels and permissions' 
      : 'إنشاء وإدارة مستخدمي النظام بمستويات وصول وصلاحيات مختلفة',
    allUsers: language === 'English' ? 'All Users' : 'جميع المستخدمين',
    admins: language === 'English' ? 'Administrators' : 'المسؤولين',
    managers: language === 'English' ? 'Managers' : 'المدراء',
    agents: language === 'English' ? 'Agents' : 'الوكلاء',
    employees: language === 'English' ? 'Employees' : 'الموظفين',
    addUser: language === 'English' ? 'Add User' : 'إضافة مستخدم',
    editUser: language === 'English' ? 'Edit User' : 'تعديل المستخدم',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    unauthorized: language === 'English' 
      ? 'You do not have permission to access this page' 
      : 'ليس لديك إذن للوصول إلى هذه الصفحة',
    userAdded: language === 'English' ? 'User added successfully' : 'تمت إضافة المستخدم بنجاح',
    userUpdated: language === 'English' ? 'User updated successfully' : 'تم تحديث المستخدم بنجاح',
    userDeleted: language === 'English' ? 'User deleted successfully' : 'تم حذف المستخدم بنجاح',
    userActivated: language === 'English' ? 'User activated successfully' : 'تم تفعيل المستخدم بنجاح',
    userDeactivated: language === 'English' ? 'User deactivated successfully' : 'تم إلغاء تفعيل المستخدم بنجاح',
    passwordChanged: language === 'English' ? 'Password changed successfully' : 'تم تغيير كلمة المرور بنجاح',
    error: language === 'English' ? 'An error occurred' : 'حدث خطأ',
  };

  // Check if user has admin access
  if (!hasAccess(3)) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {translations.unauthorized}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch users
  const { 
    data: users = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest('/api/users', 'POST', userData);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: translations.userAdded,
      });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: any }) => {
      const res = await apiRequest(`/api/users/${id}`, 'PUT', userData);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: translations.userUpdated,
      });
      setOpenDialog(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle user active status mutation
  const toggleActiveUserMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest(`/api/users/${id}`, 'PUT', { isActive });
      return res;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: isActive ? translations.userActivated : translations.userDeactivated,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Change user password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await apiRequest(`/api/users/${id}/change-password`, 'PUT', { password: newPassword });
      return res;
    },
    onSuccess: () => {
      toast({
        title: translations.passwordChanged,
      });
      setOpenChangePasswordDialog(false);
      setUserToChangePassword(null);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/users/${id}`, 'DELETE');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: translations.userDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddUser = (userData: any) => {
    addUserMutation.mutate(userData);
  };

  const handleUpdateUser = (userData: any) => {
    if (editingUser && editingUser.id) {
      updateUserMutation.mutate({ id: editingUser.id, userData });
    }
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setOpenDialog(true);
  };

  const handleToggleActive = (userId: number, isActive: boolean) => {
    toggleActiveUserMutation.mutate({ id: userId, isActive });
  };

  const handleChangePassword = (user: any) => {
    setUserToChangePassword(user);
    setOpenChangePasswordDialog(true);
  };

  const handleChangePasswordSubmit = (userId: number, newPassword: string) => {
    changePasswordMutation.mutate({ id: userId, newPassword });
  };

  const admins = users.filter((user: any) => user.role === 'admin' || user.role === 'super_admin');
  const managers = users.filter((user: any) => user.role === 'manager');
  const agents = users.filter((user: any) => user.role === 'agent');
  const employees = users.filter((user: any) => user.role === 'employee');

  return (
    <div className="p-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/admin-console" className="hover:text-gray-700 flex items-center gap-1">
            <Shield className="h-4 w-4" />
            {language === 'English' ? 'Admin Console' : 'وحدة التحكم الإدارية'}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">
            {language === 'English' ? 'User Management' : 'إدارة المستخدمين'}
          </span>
        </nav>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{translations.title}</h1>
          <p className="text-gray-600 mt-2">{translations.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {translations.refresh}
          </Button>
          <Dialog open={openDialog} onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) {
              // Clear editing user when dialog closes
              setEditingUser(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                // Clear any previous editing state when opening for new user
                setEditingUser(null);
                setOpenDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                {translations.addUser}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? translations.editUser : translations.addUser}
                </DialogTitle>
              </DialogHeader>
              <UserForm
                onSubmit={editingUser ? handleUpdateUser : handleAddUser}
                initialData={editingUser}
                isSubmitting={addUserMutation.isPending || updateUserMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{language === 'English' ? 'Total Users' : 'إجمالي المستخدمين'}</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs font-bold">{users.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{translations.admins}</p>
              <p className="text-2xl font-bold text-red-600">{admins.length}</p>
            </div>
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{translations.managers}</p>
              <p className="text-2xl font-bold text-amber-600">{managers.length}</p>
            </div>
            <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-600 text-xs font-bold">M</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{language === 'English' ? 'Active Users' : 'المستخدمون النشطون'}</p>
              <p className="text-2xl font-bold text-green-600">{users.filter((user: any) => user.isActive).length}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs font-bold">✓</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{translations.allUsers}</TabsTrigger>
          <TabsTrigger value="admins">{translations.admins}</TabsTrigger>
          <TabsTrigger value="managers">{translations.managers}</TabsTrigger>
          <TabsTrigger value="agents">{translations.agents}</TabsTrigger>
          <TabsTrigger value="employees">{translations.employees}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <UsersTable 
              users={users} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
              onToggleActive={handleToggleActive}
              onChangePassword={handleChangePassword}
            />
          )}
        </TabsContent>

        <TabsContent value="admins">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <UsersTable 
              users={admins} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
              onToggleActive={handleToggleActive}
              onChangePassword={handleChangePassword}
            />
          )}
        </TabsContent>

        <TabsContent value="managers">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <UsersTable 
              users={managers} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
              onToggleActive={handleToggleActive}
              onChangePassword={handleChangePassword}
            />
          )}
        </TabsContent>

        <TabsContent value="agents">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <UsersTable 
              users={agents} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
              onToggleActive={handleToggleActive}
              onChangePassword={handleChangePassword}
            />
          )}
        </TabsContent>

        <TabsContent value="employees">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <UsersTable 
              users={employees} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
              onToggleActive={handleToggleActive}
              onChangePassword={handleChangePassword}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={openChangePasswordDialog}
        onOpenChange={setOpenChangePasswordDialog}
        user={userToChangePassword}
        onSubmit={handleChangePasswordSubmit}
        isSubmitting={changePasswordMutation.isPending}
      />
    </div>
  );
}
