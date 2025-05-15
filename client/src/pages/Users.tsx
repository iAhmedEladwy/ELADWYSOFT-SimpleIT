import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import UsersTable from '@/components/users/UsersTable';
import UserForm from '@/components/users/UserForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Users() {
  const { hasAccess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Translations
  const translations = {
    title: language === 'English' ? 'Users Management' : 'إدارة المستخدمين',
    description: language === 'English' 
      ? 'Create and manage system users with different access levels' 
      : 'إنشاء وإدارة مستخدمي النظام بمستويات وصول مختلفة',
    allUsers: language === 'English' ? 'All Users' : 'جميع المستخدمين',
    admins: language === 'English' ? 'Admins' : 'المسؤولين',
    managers: language === 'English' ? 'Managers' : 'المدراء',
    viewers: language === 'English' ? 'Viewers' : 'المشاهدين',
    addUser: language === 'English' ? 'Add User' : 'إضافة مستخدم',
    editUser: language === 'English' ? 'Edit User' : 'تعديل المستخدم',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    unauthorized: language === 'English' 
      ? 'You do not have permission to access this page' 
      : 'ليس لديك إذن للوصول إلى هذه الصفحة',
    userAdded: language === 'English' ? 'User added successfully' : 'تمت إضافة المستخدم بنجاح',
    userUpdated: language === 'English' ? 'User updated successfully' : 'تم تحديث المستخدم بنجاح',
    userDeleted: language === 'English' ? 'User deleted successfully' : 'تم حذف المستخدم بنجاح',
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
      const res = await apiRequest('POST', '/api/users', userData);
      return res.json();
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
      const res = await apiRequest('PUT', `/api/users/${id}`, userData);
      return res.json();
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/users/${id}`, {});
      return res.json();
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

  const admins = users.filter((user: any) => user.accessLevel === '3');
  const managers = users.filter((user: any) => user.accessLevel === '2');
  const viewers = users.filter((user: any) => user.accessLevel === '1');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
          <p className="text-gray-600">{translations.description}</p>
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
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
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

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{translations.allUsers}</TabsTrigger>
          <TabsTrigger value="admins">{translations.admins}</TabsTrigger>
          <TabsTrigger value="managers">{translations.managers}</TabsTrigger>
          <TabsTrigger value="viewers">{translations.viewers}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <UsersTable 
              users={users} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
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
            />
          )}
        </TabsContent>

        <TabsContent value="viewers">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <UsersTable 
              users={viewers} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
