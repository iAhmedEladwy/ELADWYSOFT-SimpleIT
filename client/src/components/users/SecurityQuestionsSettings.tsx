import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormMessage } from '@/components/ui/form';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';

const DEFAULT_QUESTIONS = [
  "What was your childhood nickname?",
  "In what city did you meet your spouse/significant other?",
  "What is the name of your favorite childhood friend?",
  "What street did you live on in third grade?",
  "What is your oldest sibling's middle name?",
  "What school did you attend for sixth grade?",
  "What was the name of your first stuffed animal?",
  "In what city or town did your mother and father meet?",
  "What was the make of your first car?",
  "What is your favorite movie?"
];

export function SecurityQuestionsSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userQuestions, setUserQuestions] = useState<Array<{ id?: number; question: string; answer: string }>>([]);
  const [availableQuestions, setAvailableQuestions] = useState<string[]>(DEFAULT_QUESTIONS);
  const { language } = useLanguage();

  // Translation constants
  const translations = {
    title: language === 'English' ? 'Security Questions' : 'أسئلة الأمان',
    subtitle: language === 'English' 
      ? 'Set up security questions to help recover your account' 
      : 'إعداد أسئلة الأمان للمساعدة في استعادة حسابك',
    selectQuestion: language === 'English' ? 'Select a question' : 'اختر سؤالاً',
    answerLabel: language === 'English' ? 'Your Answer' : 'إجابتك',
    addQuestion: language === 'English' ? 'Add Question' : 'إضافة سؤال',
    save: language === 'English' ? 'Save Questions' : 'حفظ الأسئلة',
    saving: language === 'English' ? 'Saving...' : 'جاري الحفظ...',
    successTitle: language === 'English' ? 'Security Questions Saved' : 'تم حفظ أسئلة الأمان',
    successMsg: language === 'English' 
      ? 'Your security questions have been updated' 
      : 'تم تحديث أسئلة الأمان الخاصة بك',
    errorTitle: language === 'English' ? 'Error' : 'خطأ',
    minQuestions: language === 'English' 
      ? 'Please add at least one security question' 
      : 'الرجاء إضافة سؤال أمان واحد على الأقل',
    removeQuestion: language === 'English' ? 'Remove Question' : 'إزالة السؤال',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    noQuestions: language === 'English' 
      ? 'No security questions set. Add questions to secure your account.'
      : 'لم يتم تعيين أسئلة أمان. أضف أسئلة لتأمين حسابك.'
  };

  // Fetch user's current security questions on component mount
  useEffect(() => {
    const fetchUserQuestions = async () => {
      try {
        setIsFetching(true);
        const response = await fetch('/api/user/security-questions');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.questions && data.questions.length > 0) {
            // Create placeholder answers for the UI (we don't get actual answers from API for security)
            const questions = data.questions.map((q: any) => ({
              id: q.id,
              question: q.question,
              answer: '' // We don't get answers from the server
            }));
            setUserQuestions(questions);
          } else {
            // Start with one empty question if user has none
            setUserQuestions([{ question: '', answer: '' }]);
          }
        } else {
          // Start with one empty question if there's an error
          setUserQuestions([{ question: '', answer: '' }]);
        }
      } catch (error) {
        console.error('Error fetching security questions:', error);
        // Start with one empty question if there's an error
        setUserQuestions([{ question: '', answer: '' }]);
      } finally {
        setIsFetching(false);
      }
    };

    // Also fetch the available questions list from the server
    const fetchAvailableQuestions = async () => {
      try {
        const response = await fetch('/api/security-questions');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // If the data is an array of question objects with a 'question' property
            if (data.length > 0 && data[0].question) {
              setAvailableQuestions(data.map((q: any) => q.question));
            } 
            // If the data is a direct array of question strings
            else if (data.length > 0 && typeof data[0] === 'string') {
              setAvailableQuestions(data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching available questions:', error);
        // Keep the default questions as fallback
      }
    };

    fetchUserQuestions();
    fetchAvailableQuestions();
  }, []);

  // Add a new security question
  const addQuestion = () => {
    setUserQuestions([...userQuestions, { question: '', answer: '' }]);
  };

  // Remove a security question
  const removeQuestion = (index: number) => {
    const newQuestions = [...userQuestions];
    newQuestions.splice(index, 1);
    setUserQuestions(newQuestions);
  };

  // Update question at specified index
  const updateQuestion = (index: number, questionText: string) => {
    const newQuestions = [...userQuestions];
    newQuestions[index].question = questionText;
    setUserQuestions(newQuestions);
  };

  // Update answer at specified index
  const updateAnswer = (index: number, answerText: string) => {
    const newQuestions = [...userQuestions];
    newQuestions[index].answer = answerText;
    setUserQuestions(newQuestions);
  };

  // Save security questions
  const saveSecurityQuestions = async () => {
    // Validate - ensure all questions have answers
    const validQuestions = userQuestions.filter(q => q.question && q.answer);
    
    if (validQuestions.length === 0) {
      toast({
        title: translations.errorTitle,
        description: translations.minQuestions,
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/user/security-questions', {
        questions: validQuestions
      });
      
      if (response.ok) {
        toast({
          title: translations.successTitle,
          description: translations.successMsg
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save security questions');
      }
    } catch (error: any) {
      console.error('Error saving security questions:', error);
      toast({
        title: translations.errorTitle,
        description: error.message || 'An error occurred while saving security questions',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">{translations.loading}</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{translations.title}</CardTitle>
        <CardDescription>{translations.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {userQuestions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {translations.noQuestions}
            <Button 
              variant="outline" 
              className="mt-2 mx-auto block"
              onClick={addQuestion}
            >
              <Plus className="h-4 w-4 mr-2" />
              {translations.addQuestion}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {userQuestions.map((questionObj, index) => (
              <div key={index} className="p-4 border rounded-md relative">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`question-${index}`}>{translations.selectQuestion}</Label>
                    <Select
                      value={questionObj.question}
                      onValueChange={(value) => updateQuestion(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={translations.selectQuestion} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableQuestions.map((q, qIndex) => (
                          <SelectItem key={qIndex} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!questionObj.question && (
                      <FormMessage className="text-red-500 text-xs mt-1">
                        Please select a question
                      </FormMessage>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={`answer-${index}`}>{translations.answerLabel}</Label>
                    <Input
                      id={`answer-${index}`}
                      value={questionObj.answer}
                      onChange={(e) => updateAnswer(index, e.target.value)}
                      placeholder={translations.answerLabel}
                    />
                    {!questionObj.answer && (
                      <FormMessage className="text-red-500 text-xs mt-1">
                        Please provide an answer
                      </FormMessage>
                    )}
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-destructive"
                  onClick={() => removeQuestion(index)}
                  disabled={userQuestions.length === 1} // Prevent removing the last question
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{translations.removeQuestion}</span>
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addQuestion}
              disabled={userQuestions.length >= 5} // Limit to 5 questions
            >
              <Plus className="h-4 w-4 mr-2" />
              {translations.addQuestion}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={saveSecurityQuestions} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.saving}
            </>
          ) : (
            translations.save
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}