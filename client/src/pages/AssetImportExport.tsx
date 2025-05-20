import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, AlertCircle, CheckCircle2, FileDown, FileUp } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { queryClient } from '@/lib/queryClient';

const AssetImportExport = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('export');
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const { language } = useLanguage();

  // Translations based on language
  const translations = {
    title: language === 'English' ? 'Asset Import & Export' : 'استيراد وتصدير الأصول',
    export: language === 'English' ? 'Export' : 'تصدير',
    import: language === 'English' ? 'Import' : 'استيراد',
    exportDesc: language === 'English' 
      ? 'Export your asset data to a CSV file for backup or reporting purposes.' 
      : 'تصدير بيانات الأصول الخاصة بك إلى ملف CSV للنسخ الاحتياطي أو لأغراض التقارير.',
    importDesc: language === 'English' 
      ? 'Import assets from a CSV file. Make sure the file follows the correct format.' 
      : 'استيراد الأصول من ملف CSV. تأكد من اتباع الملف للتنسيق الصحيح.',
    downloadTemplate: language === 'English' ? 'Download Template' : 'تنزيل القالب',
    downloadExport: language === 'English' ? 'Download Assets CSV' : 'تنزيل ملف CSV للأصول',
    chooseFile: language === 'English' ? 'Choose CSV File' : 'اختر ملف CSV',
    dragDrop: language === 'English' ? 'or drag and drop here' : 'أو اسحب وأفلت هنا',
    uploadFile: language === 'English' ? 'Upload File' : 'رفع الملف',
    importing: language === 'English' ? 'Importing assets...' : 'جاري استيراد الأصول...',
    importSuccess: language === 'English' ? 'Successfully imported' : 'تم الاستيراد بنجاح',
    importError: language === 'English' ? 'Import Error' : 'خطأ في الاستيراد',
    rows: language === 'English' ? 'rows' : 'صفوف',
    successful: language === 'English' ? 'successful' : 'ناجح',
    failed: language === 'English' ? 'failed' : 'فاشل',
    close: language === 'English' ? 'Close' : 'إغلاق',
    downloadExportFile: language === 'English' ? 'Download Export File' : 'تنزيل ملف التصدير',
    importFormat: language === 'English' 
      ? 'Import Format Instructions' 
      : 'تعليمات تنسيق الاستيراد',
    formatDetails: language === 'English' 
      ? 'Your CSV file should include the following columns:' 
      : 'يجب أن يتضمن ملف CSV الخاص بك الأعمدة التالية:',
    requiredFields: language === 'English' 
      ? 'Required fields: Type, Brand, Serial Number' 
      : 'الحقول المطلوبة: النوع، العلامة التجارية، الرقم التسلسلي',
    optionalFields: language === 'English' 
      ? 'Optional fields: Model Number, Model Name, Specs, Purchase Date, Purchase Price, Warranty Expiry Date, Out Of Box OS, Life Span' 
      : 'الحقول الاختيارية: رقم الطراز، اسم الطراز، المواصفات، تاريخ الشراء، سعر الشراء، تاريخ انتهاء الضمان، نظام التشغيل الأصلي، العمر الافتراضي',
    assetIdNote: language === 'English' 
      ? 'Note: Asset IDs will be automatically generated if not provided.' 
      : 'ملاحظة: سيتم إنشاء معرفات الأصول تلقائيًا إذا لم يتم توفيرها.',
  };

  // Handler for file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImportProgress(10);
    setImportError(null);
    setImportResults(null);

    try {
      const response = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
      });

      setImportProgress(50);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import assets');
      }

      const result = await response.json();
      setImportProgress(100);
      setImportResults(result);
      
      // Invalidate assets query to refresh the assets list
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      
      toast({
        title: translations.importSuccess,
        description: `${result.success} ${translations.successful}, ${result.failed} ${translations.failed}`,
        variant: 'default',
      });
    } catch (error) {
      setImportProgress(0);
      setImportError(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: translations.importError,
        description: error instanceof Error ? error.message : 'Failed to import assets',
        variant: 'destructive',
      });
    }
  };

  // Function to download template
  const downloadTemplate = () => {
    window.location.href = '/api/assets/template';
  };

  // Function to download export
  const downloadExport = () => {
    window.location.href = '/api/assets/export/csv';
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">{translations.title}</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {translations.export}
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {translations.import}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{translations.export}</CardTitle>
              <CardDescription>
                {translations.exportDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={downloadExport} 
                className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed"
              >
                <FileDown className="h-12 w-12" />
                <span>{translations.downloadExportFile}</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{translations.import}</CardTitle>
              <CardDescription>
                {translations.importDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{translations.importFormat}</AlertTitle>
                  <AlertDescription>
                    <p>{translations.formatDetails}</p>
                    <ul className="list-disc pl-5 mt-2">
                      <li>{translations.requiredFields}</li>
                      <li>{translations.optionalFields}</li>
                    </ul>
                    <p className="mt-2">{translations.assetIdNote}</p>
                  </AlertDescription>
                </Alert>
                
                <Button onClick={downloadTemplate} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> {translations.downloadTemplate}
                </Button>
                
                <Separator />
                
                <div 
                  className="w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv" 
                    className="hidden" 
                  />
                  <Upload className="h-8 w-8 mb-2" />
                  <p>{translations.chooseFile}</p>
                  <p className="text-sm text-muted-foreground">{translations.dragDrop}</p>
                </div>
                
                {importProgress > 0 && importProgress < 100 && (
                  <div className="space-y-2">
                    <p>{translations.importing}</p>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}
                
                {importResults && (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>{translations.importSuccess}</AlertTitle>
                    <AlertDescription>
                      {importResults.success} {translations.successful}, {importResults.failed} {translations.failed}
                    </AlertDescription>
                  </Alert>
                )}
                
                {importError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{translations.importError}</AlertTitle>
                    <AlertDescription>{importError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetImportExport;