import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Trash2, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  MoreHorizontal,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface UsersTableProps {
  users: any[];
  onEdit: (user: any) => void;
  onDelete: (userId: number) => void;
}

export default function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
  const { language } = useLanguage();
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Translations
  const translations = {
    username: language === 'English' ? 'Username' : 'اسم المستخدم',
    email: language === 'English' ? 'Email' : 'البريد الإلكتروني',
    accessLevel: language === 'English' ? 'Access Level' : 'مستوى الوصول',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    admin: language === 'English' ? 'Admin' : 'مسؤول',
    manager: language === 'English' ? 'Manager' : 'مدير',
    viewer: language === 'English' ? 'Viewer' : 'مشاهد',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    delete: language === 'English' ? 'Delete' : 'حذف',
    confirmDelete: language === 'English' ? 'Confirm Deletion' : 'تأكيد الحذف',
    deleteWarning: language === 'English' 
      ? 'Are you sure you want to delete this user? This action cannot be undone.' 
      : 'هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    noUsers: language === 'English' ? 'No users found' : 'لم يتم العثور على مستخدمين',
  };

  // Get access level badge and icon
  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case '3':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
            {translations.admin}
          </Badge>
        );
      case '2':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            {translations.manager}
          </Badge>
        );
      case '1':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className="h-3.5 w-3.5 mr-1" />
            {translations.viewer}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (userToDelete) {
      onDelete(userToDelete.id);
      setUserToDelete(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.username}</TableHead>
            <TableHead>{translations.email}</TableHead>
            <TableHead>{translations.accessLevel}</TableHead>
            <TableHead className="text-right">{translations.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getAccessLevelBadge(user.accessLevel)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {translations.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setUserToDelete(user)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {translations.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                {translations.noUsers}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
