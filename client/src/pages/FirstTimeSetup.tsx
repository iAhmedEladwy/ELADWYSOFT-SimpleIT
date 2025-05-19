import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';

const setupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function FirstTimeSetup() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof setupSchema>) => {
    try {
      setIsLoading(true);
      
      // Submit the form data to create the admin user
      const result = await apiRequest('POST', '/api/setup', {
        username: values.username,
        password: values.password,
        email: values.email || undefined
      });
      
      toast({
        title: 'Setup complete',
        description: 'Your admin account has been created. You can now log in.',
      });
      
      // Invalidate queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      
      // Redirect to login page
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: 'Setup failed',
        description: error.message || 'Failed to create admin account. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center justify-center mb-4">
            <h1 className="text-primary font-bold text-3xl">ELADWYSOFT</h1>
            <h2 className="text-gray-600 text-xl">SimpleIT</h2>
          </div>
          <CardTitle className="text-2xl font-bold text-center">First Time Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center text-sm text-gray-600">
            Create your administrator account to get started with SimpleIT Asset Management System
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a username for the administrator account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be at least 6 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for password recovery (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Setting up...</span>
                  </div>
                ) : (
                  'Create Admin Account'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-center text-gray-500">
          <p className="w-full">
            This setup will only run on first application start
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}