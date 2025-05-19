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
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Schema for step 1 - Find user by username
const findUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

// Schema for step 2 - Answer security questions
const securityQuestionsSchema = z.object({
  answers: z.array(
    z.object({
      answer: z.string().min(1, 'Answer is required')
    })
  )
});

// Schema for step 3 - Reset password
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Security questions list
const securityQuestions = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the make of your first car?",
  "What was your childhood nickname?",
  "What is your favorite movie?",
  "What elementary school did you attend?",
  "What is the name of your favorite childhood teacher?",
];

// Arabic translations for security questions
const securityQuestionsArabic = [
  "ما هو اسم حيوانك الأليف الأول؟",
  "في أي مدينة ولدت؟",
  "ما هو اسم والدتك قبل الزواج؟",
  "ما كانت ماركة سيارتك الأولى؟",
  "ما كان لقبك في الطفولة؟",
  "ما هو فيلمك المفضل؟",
  "ما هي المدرسة الابتدائية التي التحقت بها؟",
  "ما هو اسم معلمك المفضل في الطفولة؟",
];

export default function ForgotPassword() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userFound, setUserFound] = useState<any>(null);
  const [securityQuestionList, setSecurityQuestionList] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const { language } = useLanguage();
  const [resetToken, setResetToken] = useState<string>('');

  // Determine translations based on language
  const translations = {
    title: language === 'English' ? 'Forgot Password' : 'نسيت كلمة المرور',
    findAccount: language === 'English' ? 'Find Your Account' : 'ابحث عن حسابك',
    securityQuestions: language === 'English' ? 'Security Questions' : 'أسئلة الأمان',
    resetPassword: language === 'English' ? 'Reset Password' : 'إعادة تعيين كلمة المرور',
    username: language === 'English' ? 'Username' : 'اسم المستخدم',
    enterUsername: language === 'English' ? 'Enter your username to find your account' : 'أدخل اسم المستخدم للعثور على حسابك',
    findButton: language === 'English' ? 'Find Account' : 'العثور على الحساب',
    backToLogin: language === 'English' ? 'Back to Login' : 'العودة إلى تسجيل الدخول',
    passwordLabel: language === 'English' ? 'New Password' : 'كلمة المرور الجديدة',
    confirmPasswordLabel: language === 'English' ? 'Confirm Password' : 'تأكيد كلمة المرور',
    resetButton: language === 'English' ? 'Reset Password' : 'إعادة تعيين كلمة المرور',
    answerQuestion: language === 'English' ? 'Answer security questions' : 'أجب على أسئلة الأمان',
    selectQuestion: language === 'English' ? 'Select a security question' : 'اختر سؤال أمان',
    answerLabel: language === 'English' ? 'Your Answer' : 'إجابتك',
    continueButton: language === 'English' ? 'Continue' : 'استمرار',
    addQuestionButton: language === 'English' ? 'Add Security Question' : 'إضافة سؤال أمان',
    submitAnswersButton: language === 'English' ? 'Submit Answers' : 'إرسال الإجابات',
    userNotFound: language === 'English' ? 'User not found' : 'لم يتم العثور على المستخدم',
    tryAgain: language === 'English' ? 'Please try again' : 'يرجى المحاولة مرة أخرى',
    answerIncorrect: language === 'English' ? 'One or more answers are incorrect' : 'إجابة واحدة أو أكثر غير صحيحة',
    resetSuccess: language === 'English' ? 'Password reset successfully' : 'تم إعادة تعيين كلمة المرور بنجاح',
    resetError: language === 'English' ? 'Failed to reset password' : 'فشل في إعادة تعيين كلمة المرور',
  };

  // Form setup for step 1
  const findUserForm = useForm<z.infer<typeof findUserSchema>>({
    resolver: zodResolver(findUserSchema),
    defaultValues: {
      username: '',
    },
  });

  // Form setup for step 2
  const securityForm = useForm<z.infer<typeof securityQuestionsSchema>>({
    resolver: zodResolver(securityQuestionsSchema),
    defaultValues: {
      answers: [{ answer: '' }],
    },
  });

  // Form setup for step 3
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Fetch available security questions from the server
  const fetchSecurityQuestions = async () => {
    try {
      const response = await fetch('/api/security-questions');
      if (response.ok) {
        const data = await response.json();
        // Extract just the question text from the question objects
        if (Array.isArray(data)) {
          return data.map((q: any) => q.question);
        }
        return data;
      }
      return language === 'English' ? securityQuestions : securityQuestionsArabic;
    } catch (error) {
      console.error('Error fetching security questions:', error);
      return language === 'English' ? securityQuestions : securityQuestionsArabic;
    }
  };

  // Handle finding user account (Step 1)
  const onFindUser = async (values: z.infer<typeof findUserSchema>) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/forgot-password/find-user', {
        username: values.username
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'User not found');
      }
      
      const data = await response.json();
      
      if (data.userId) {
        setUserFound({ id: data.userId, username: values.username });
        
        // Check if user has security questions set up
        if (data.hasSecurityQuestions) {
          // Fetch user's security questions
          const questionsResponse = await fetch(`/api/forgot-password/security-questions/${data.userId}`);
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            if (questionsData.questions && questionsData.questions.length > 0) {
              // Set the user's actual questions
              const userQuestions = questionsData.questions.map((q: any) => q.question);
              setSecurityQuestionList(userQuestions);
              
              // Initialize the form with the right number of answer fields
              securityForm.setValue('answers', userQuestions.map(() => ({ answer: '' })));
              
              // Set the selected questions
              setSelectedQuestions(userQuestions);
              
              // Move to the security questions step
              setCurrentStep(2);
              return;
            }
          }
          
          // If we couldn't fetch the specific questions, use the default list
          const availableQuestions = await fetchSecurityQuestions();
          setSecurityQuestionList(availableQuestions);
          setCurrentStep(2);
        } else {
          // No security questions set, inform user
          toast({
            title: language === 'English' ? 'No security questions found' : 'لم يتم العثور على أسئلة أمان',
            description: language === 'English' 
              ? 'This account does not have security questions set up. Please contact an administrator.' 
              : 'هذا الحساب ليس لديه أسئلة أمان. يرجى الاتصال بالمسؤول.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: translations.userNotFound,
          description: translations.tryAgain,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error finding user:', error);
      toast({
        title: translations.userNotFound,
        description: error.message || translations.tryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle security questions submission (Step 2)
  const onSubmitSecurityAnswers = async (values: z.infer<typeof securityQuestionsSchema>) => {
    try {
      setIsLoading(true);
      
      // Create an array of answers that includes both questions and answer values
      const answerPayload = values.answers.map((a, index) => ({
        question: selectedQuestions[index],
        answer: a.answer
      }));
      
      const payload = {
        userId: userFound.id,
        answers: answerPayload
      };
      
      const response = await apiRequest('POST', '/api/forgot-password/verify-answers', payload);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || translations.answerIncorrect);
      }
      
      const data = await response.json();
      
      if (data.success && data.token) {
        setResetToken(data.token);
        setCurrentStep(3);
      } else {
        toast({
          title: translations.answerIncorrect,
          description: translations.tryAgain,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error verifying security answers:', error);
      toast({
        title: translations.answerIncorrect,
        description: error.message || translations.tryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset submission (Step 3)
  const onResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/forgot-password/reset-password', {
        token: resetToken,
        newPassword: values.password
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: translations.resetSuccess,
          description: language === 'English' 
            ? 'You can now login with your new password' 
            : 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة'
        });
        
        // Redirect to login page after successful reset
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast({
          title: translations.resetError,
          description: data.message || translations.tryAgain,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: translations.resetError,
        description: error.message || translations.tryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new security question field
  const addSecurityQuestion = () => {
    const currentAnswers = securityForm.getValues().answers || [];
    securityForm.setValue('answers', [...currentAnswers, { answer: '' }]);
  };

  // Handle security question selection
  const handleQuestionSelect = (value: string, index: number) => {
    const newSelectedQuestions = [...selectedQuestions];
    newSelectedQuestions[index] = value;
    setSelectedQuestions(newSelectedQuestions);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="flex flex-col items-center justify-center mb-4">
                <h1 className="text-primary font-bold text-3xl">ELADWYSOFT</h1>
                <h2 className="text-gray-600 text-xl">SimpleIT</h2>
              </div>
              <CardTitle className="text-2xl font-bold text-center">{translations.findAccount}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...findUserForm}>
                <form onSubmit={findUserForm.handleSubmit(onFindUser)} className="space-y-4">
                  <FormField
                    control={findUserForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translations.username}</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormDescription>
                          {translations.enterUsername}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col space-y-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          <span>{translations.findButton}...</span>
                        </div>
                      ) : (
                        translations.findButton
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/login')}
                      className="w-full"
                    >
                      {translations.backToLogin}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        );
        
      case 2:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="flex flex-col items-center justify-center mb-4">
                <h1 className="text-primary font-bold text-3xl">ELADWYSOFT</h1>
                <h2 className="text-gray-600 text-xl">SimpleIT</h2>
              </div>
              <CardTitle className="text-2xl font-bold text-center">{translations.securityQuestions}</CardTitle>
              <p className="text-center text-sm text-gray-600">
                {translations.answerQuestion}
              </p>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSubmitSecurityAnswers)} className="space-y-4">
                  {securityForm.getValues().answers.map((_, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <div className="mb-4">
                        <FormLabel>{translations.selectQuestion}</FormLabel>
                        <Select 
                          onValueChange={(value) => handleQuestionSelect(value, index)}
                          defaultValue={selectedQuestions[index]}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={translations.selectQuestion} />
                          </SelectTrigger>
                          <SelectContent>
                            {securityQuestionList.map((question, qIndex) => (
                              <SelectItem 
                                key={qIndex} 
                                value={question}
                                disabled={selectedQuestions.includes(question) && selectedQuestions[index] !== question}
                              >
                                {question}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <FormField
                        control={securityForm.control}
                        name={`answers.${index}.answer`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{translations.answerLabel}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  
                  {securityForm.getValues().answers.length < 3 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addSecurityQuestion}
                      className="w-full mb-4"
                    >
                      {translations.addQuestionButton}
                    </Button>
                  )}
                  
                  <div className="flex flex-col space-y-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || !selectedQuestions.length || selectedQuestions.includes('')}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          <span>{translations.submitAnswersButton}...</span>
                        </div>
                      ) : (
                        translations.submitAnswersButton
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="w-full"
                    >
                      {language === 'English' ? 'Back' : 'رجوع'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        );
        
      case 3:
        return (
          <>
            <CardHeader className="space-y-1">
              <div className="flex flex-col items-center justify-center mb-4">
                <h1 className="text-primary font-bold text-3xl">ELADWYSOFT</h1>
                <h2 className="text-gray-600 text-xl">SimpleIT</h2>
              </div>
              <CardTitle className="text-2xl font-bold text-center">{translations.resetPassword}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={resetPasswordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translations.passwordLabel}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          {language === 'English' 
                            ? 'Must be at least 6 characters' 
                            : 'يجب أن تكون على الأقل 6 أحرف'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resetPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translations.confirmPasswordLabel}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>{translations.resetButton}...</span>
                      </div>
                    ) : (
                      translations.resetButton
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        {renderStep()}
        <CardFooter className="text-sm text-center text-gray-500">
          <p className="w-full">
            {language === 'English' 
              ? 'This process allows you to reset your password using security questions' 
              : 'تتيح لك هذه العملية إعادة تعيين كلمة المرور باستخدام أسئلة الأمان'}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}