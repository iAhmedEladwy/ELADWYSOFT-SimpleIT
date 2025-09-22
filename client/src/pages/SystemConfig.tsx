import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Save, Globe, Loader2, Trash, Trash2, Plus, Edit, Check, X, Mail, Download, Upload, Search, Users, Ticket, Package, FileText, Database, Info as InfoIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FieldMappingInterface } from '@/components/import/FieldMappingInterface';

function SystemConfig() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();

  // Translations
  const translations = {
    // Main navigation and titles
    systemConfiguration: language === 'English' ? 'Settings' : 'الإعدادات',
    configureSystem: language === 'English' ? 'Configure system settings, manage user permissions, and customize organizational preferences' : 'تكوين إعدادات النظام وإدارة صلاحيات المستخدمين وتخصيص تفضيلات المؤسسة',
    
    // Tab labels
    general: language === 'English' ? 'General' : 'عام',
    emailConfig: language === 'English' ? 'Email' : 'البريد الإلكتروني',
    employees: language === 'English' ? 'Employees' : 'الموظفون',
    assets: language === 'English' ? 'Assets' : 'الأصول',
    tickets: language === 'English' ? 'Tickets' : 'التذاكر',
    importExport: language === 'English' ? 'Import/Export' : 'استيراد/تصدير',
    security: language === 'English' ? 'Security' : 'الأمان',
    
    // General Settings
    generalSettings: language === 'English' ? 'General Settings' : 'الإعدادات العامة',
    generalSettingsDescription: language === 'English' ? 'Configure basic system settings and preferences' : 'تكوين إعدادات النظام الأساسية والتفضيلات',
    systemPrefixes: language === 'English' ? 'System Prefixes' : 'بادئات النظام',
    idPrefixes: language === 'English' ? 'Configure ID prefixes for assets, employees, and tickets' : 'تكوين بادئات المعرفات للأصول والموظفين والتذاكر',
    assetIdPrefix: language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل',
    employeeIdPrefix: language === 'English' ? 'Employee ID Prefix' : 'بادئة معرف الموظف',
    ticketIdPrefix: language === 'English' ? 'Ticket ID Prefix' : 'بادئة معرف التذكرة',
    systemLanguage: language === 'English' ? 'System Language' : 'لغة النظام',
    selectLanguage: language === 'English' ? 'Select language for the system interface' : 'اختر لغة واجهة النظام',
    defaultCurrency: language === 'English' ? 'Default Currency' : 'العملة الافتراضية',
    currencyDescription: language === 'English' ? 'Set the default currency for financial calculations' : 'تعيين العملة الافتراضية للحسابات المالية',
    
    // Company Details
    companyDetails: language === 'English' ? 'Company Details' : 'تفاصيل الشركة',
    companyDetailsDescription: language === 'English' ? 'Manage your organization information and contact details' : 'إدارة معلومات مؤسستك وتفاصيل الاتصال',
    companyName: language === 'English' ? 'Company Name' : 'اسم الشركة',
    companyAddress: language === 'English' ? 'Company Address' : 'عنوان الشركة',
    companyPhone: language === 'English' ? 'Company Phone' : 'هاتف الشركة',
    companyEmail: language === 'English' ? 'Company Email' : 'بريد الشركة الإلكتروني',
    companyWebsite: language === 'English' ? 'Company Website' : 'موقع الشركة الإلكتروني',
    
    // Company Display Configuration
    companyDisplay: language === 'English' ? 'Company Display' : 'عرض الشركة',
    companyDisplayDescription: language === 'English' ? 'Configure how company information appears in the application header' : 'تكوين كيفية ظهور معلومات الشركة في رأس التطبيق',
    showCompanyInHeader: language === 'English' ? 'Show Company in Header' : 'إظهار الشركة في الرأس',
    showCompanyDescription: language === 'English' ? 'Display company name in the application header' : 'عرض اسم الشركة في رأس التطبيق',
    displayLocation: language === 'English' ? 'Display Location' : 'موقع العرض',
    displayLocationDescription: language === 'English' ? 'Choose where to display the company name in the header' : 'اختر مكان عرض اسم الشركة في الرأس',
    badgeNextToLanguage: language === 'English' ? 'Badge next to language selector' : 'شارة بجانب محدد اللغة',
    underUsername: language === 'English' ? 'Under username dropdown' : 'تحت قائمة اسم المستخدم',
    
    // Email Configuration
    emailConfiguration: language === 'English' ? 'Email Configuration' : 'تكوين البريد الإلكتروني',
    emailConfigDescription: language === 'English' ? 'Configure SMTP settings for system email notifications' : 'تكوين إعدادات SMTP لإشعارات البريد الإلكتروني للنظام',
    smtpSettings: language === 'English' ? 'SMTP Settings' : 'إعدادات SMTP',
    emailHost: language === 'English' ? 'Email Host' : 'مضيف البريد الإلكتروني',
    emailPort: language === 'English' ? 'Email Port' : 'منفذ البريد الإلكتروني',
    emailUsername: language === 'English' ? 'Email Username' : 'اسم مستخدم البريد الإلكتروني',
    emailPassword: language === 'English' ? 'Email Password' : 'كلمة مرور البريد الإلكتروني',
    fromAddress: language === 'English' ? 'From Address' : 'عنوان المرسل',
    fromName: language === 'English' ? 'From Name' : 'اسم المرسل',
    useSSL: language === 'English' ? 'Use SSL/TLS' : 'استخدام SSL/TLS',
    testEmail: language === 'English' ? 'Test Email' : 'اختبار البريد الإلكتروني',
    
    // Department Management
    departmentManagement: language === 'English' ? 'Department Management' : 'إدارة الأقسام',
    departmentDescription: language === 'English' ? 'Manage organizational departments and employee assignments' : 'إدارة أقسام المؤسسة وتعيينات الموظفين',
    departments: language === 'English' ? 'Departments' : 'الأقسام',
    addDepartment: language === 'English' ? 'Add Department' : 'إضافة قسم',
    departmentName: language === 'English' ? 'Department Name' : 'اسم القسم',
    departmentPlaceholder: language === 'English' ? 'Enter department name...' : 'أدخل اسم القسم...',
    
    // Asset Configuration
    assetConfiguration: language === 'English' ? 'Asset Configuration' : 'تكوين الأصول',
    assetConfigDescription: language === 'English' ? 'Manage asset types, brands, and statuses for comprehensive asset tracking.' : 'إدارة أنواع الأصول والعلامات التجارية والحالات لتتبع شامل للأصول.',
    types: language === 'English' ? 'Types' : 'الأنواع',
    brands: language === 'English' ? 'العلامات' : 'العلامات',
    statuses: language === 'English' ? 'Statuses' : 'الحالات',
    searchTypes: language === 'English' ? 'Search types...' : 'البحث في الأنواع...',
    searchBrands: language === 'English' ? 'Search brands...' : 'البحث في العلامات...',
    searchStatuses: language === 'English' ? 'Search statuses...' : 'البحث في الحالات...',
    addType: language === 'English' ? 'Add Type' : 'إضافة نوع',
    addBrand: language === 'English' ? 'Add Brand' : 'إضافة علامة',
    addStatus: language === 'English' ? 'Add Status' : 'إضافة حالة',
    addAssetType: language === 'English' ? 'Add Asset Type' : 'إضافة نوع أصل',
    addAssetBrand: language === 'English' ? 'Add Asset Brand' : 'إضافة علامة أصل',
    addAssetStatus: language === 'English' ? 'Add Asset Status' : 'إضافة حالة أصل',
    createNewAssetType: language === 'English' ? 'Create a new asset type for classification.' : 'إنشاء نوع أصل جديد للتصنيف.',
    createNewAssetBrand: language === 'English' ? 'Create a new asset brand for organization.' : 'إنشاء علامة أصل جديدة للتنظيم.',
    createNewAssetStatus: language === 'English' ? 'Create a new asset status for tracking.' : 'إنشاء حالة أصل جديدة للتتبع.',
    typeName: language === 'English' ? 'Type Name' : 'اسم النوع',
    brandName: language === 'English' ? 'Brand Name' : 'اسم العلامة',
    statusName: language === 'English' ? 'Status Name' : 'اسم الحالة',
    typeNamePlaceholder: language === 'English' ? 'e.g., Laptop, Desktop, Server' : 'مثال: لابتوب، سطح مكتب، خادم',
    brandNamePlaceholder: language === 'English' ? 'e.g., Dell, HP, Lenovo' : 'مثال: Dell، HP، Lenovo',
    statusNamePlaceholder: language === 'English' ? 'e.g., Available, In Use, Maintenance' : 'مثال: متاح، قيد الاستخدام، صيانة',
    description: language === 'English' ? 'Description' : 'الوصف',
    descriptionPlaceholder: language === 'English' ? 'Brief description...' : 'وصف مختصر...',
    color: language === 'English' ? 'Color' : 'اللون',
    colorPlaceholder: language === 'English' ? 'Status color' : 'لون الحالة',
    noAssetTypes: language === 'English' ? 'No Asset Types' : 'لا توجد أنواع أصول',
    noAssetBrands: language === 'English' ? 'No Asset Brands' : 'لا توجد علامات أصول',
    noAssetStatuses: language === 'English' ? 'No Asset Statuses' : 'لا توجد حالات أصول',
    addAssetTypesMessage: language === 'English' ? 'Add asset types to categorize equipment.' : 'أضف أنواع الأصول لتصنيف المعدات.',
    addAssetBrandsMessage: language === 'English' ? 'Add asset brands to organize by manufacturer.' : 'أضف علامات الأصول للتنظيم حسب الشركة المصنعة.',
    addAssetStatusesMessage: language === 'English' ? 'Add asset statuses to track asset lifecycle.' : 'أضف حالات الأصول لتتبع دورة حياة الأصل.',
    
    // Ticket Configuration
    ticketConfiguration: language === 'English' ? 'Ticket Configuration' : 'تكوين التذاكر',
    ticketConfigDescription: language === 'English' ? 'Manage ticket categories, priorities, and workflow settings for efficient support operations.' : 'إدارة فئات التذاكر والأولويات وإعدادات سير العمل لعمليات دعم فعالة.',
    categories: language === 'English' ? 'Categories' : 'الفئات',
    searchCategories: language === 'English' ? 'Search categories...' : 'البحث في الفئات...',
    addCategory: language === 'English' ? 'Add Category' : 'إضافة فئة',
    createNewCategory: language === 'English' ? 'Create a new category for ticket classification.' : 'إنشاء فئة جديدة لتصنيف التذاكر.',
    categoryName: language === 'English' ? 'Category Name' : 'اسم الفئة',
    categoryPlaceholder: language === 'English' ? 'e.g., Hardware Issue, Software Support' : 'مثال: مشكلة أجهزة، دعم برمجيات',
    
    // Common actions
    save: language === 'English' ? 'Save' : 'حفظ',
    saving: language === 'English' ? 'Saving...' : 'جارٍ الحفظ...',
    add: language === 'English' ? 'Add' : 'إضافة',
    adding: language === 'English' ? 'Adding...' : 'جارٍ الإضافة...',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    delete: language === 'English' ? 'Delete' : 'حذف',
    
    // Toast messages
    success: language === 'English' ? 'Success' : 'تم بنجاح',
    error: language === 'English' ? 'Error' : 'خطأ',
    generalSettingsUpdated: language === 'English' ? 'General settings updated successfully' : 'تم تحديث الإعدادات العامة بنجاح',
    emailSettingsUpdated: language === 'English' ? 'Email settings updated successfully' : 'تم تحديث إعدادات البريد بنجاح',
    testEmailSent: language === 'English' ? 'Test email sent successfully' : 'تم إرسال رسالة الاختبار بنجاح',
    categoryAdded: language === 'English' ? 'Category added successfully' : 'تمت إضافة الفئة بنجاح',
    assetTypeAdded: language === 'English' ? 'Asset type added successfully' : 'تمت إضافة نوع الأصل بنجاح',
    assetBrandAdded: language === 'English' ? 'Asset brand added successfully' : 'تمت إضافة علامة الأصل بنجاح',
    assetStatusAdded: language === 'English' ? 'Asset status added successfully' : 'تمت إضافة حالة الأصل بنجاح',
    failedToUpdate: language === 'English' ? 'Failed to update settings' : 'فشل تحديث الإعدادات',
    failedToUpdateEmail: language === 'English' ? 'Failed to update email settings' : 'فشل تحديث إعدادات البريد',
    failedToSendTestEmail: language === 'English' ? 'Failed to send test email' : 'فشل إرسال رسالة الاختبار',
    failedToAddCategory: language === 'English' ? 'Failed to add request type' : 'فشل إضافة نوع الطلب',
    failedToAddAssetType: language === 'English' ? 'Failed to add asset type' : 'فشل إضافة نوع الأصل',
    failedToAddAssetBrand: language === 'English' ? 'Failed to add asset brand' : 'فشل إضافة علامة الأصل',
    failedToAddAssetStatus: language === 'English' ? 'Failed to add asset status' : 'فشل إضافة حالة الأصل',
    
    // Additional missing translations
    accessDenied: language === 'English' ? 'Access Denied' : 'تم رفض الوصول',
    noPermissionMessage: language === 'English' ? 'You do not have permission to access settings.' : 'ليس لديك إذن للوصول إلى الإعدادات.',
    usedForAssetGeneration: language === 'English' ? 'Used for automatic asset ID generation' : 'يستخدم لتوليد معرفات الأصول تلقائياً',
    usedForEmployeeGeneration: language === 'English' ? 'Used for automatic employee ID generation' : 'يستخدم لتوليد معرفات الموظفين تلقائياً',
    usedForTicketGeneration: language === 'English' ? 'Used for automatic ticket ID generation' : 'يستخدم لتوليد معرفات التذاكر تلقائياً',
    enterCompanyAddress: language === 'English' ? 'Enter company address' : 'أدخل عنوان الشركة',
    
    // Import/Export section
    importExportData: language === 'English' ? 'Import & Export Data' : 'استيراد وتصدير البيانات',
    importExportDescription: language === 'English' ? 'Bulk import employee data from CSV files or export current data for backup and analysis.' : 'الاستيراد المجمع لبيانات الموظفين من ملفات CSV أو تصدير البيانات الحالية للنسخ الاحتياطي والتحليل.',
    selectDataType: language === 'English' ? 'Select Data Type' : 'اختر نوع البيانات',
    importData: language === 'English' ? 'Import Data' : 'استيراد البيانات',
    dragDropFiles: language === 'English' ? 'Drag and drop your CSV files here' : 'اسحب وأدرج ملفات CSV هنا',
    orClickToBrowse: language === 'English' ? 'or click to browse' : 'أو انقر للتصفح',
    chooseFile: language === 'English' ? 'Choose File' : 'اختيار ملف',
    getTemplate: language === 'English' ? 'Get Template' : 'احصل على القالب',
    exportData: language === 'English' ? 'Export Data' : 'تصدير البيانات',
    importing: language === 'English' ? 'Importing...' : 'جاري الاستيراد...',
    importFile: language === 'English' ? 'Import File' : 'استيراد الملف',
    importResults: language === 'English' ? 'Import Results' : 'نتائج الاستيراد',
    totalRecords: language === 'English' ? 'Total Records' : 'إجمالي السجلات',
    successfullyImported: language === 'English' ? 'Successfully Imported' : 'تم الاستيراد بنجاح',
    failed: language === 'English' ? 'Failed' : 'فشل',
    errors: language === 'English' ? 'Errors:' : 'الأخطاء:',
    noErrorsToShow: language === 'English' ? 'No specific errors to show.' : 'لا توجد أخطاء محددة للعرض.',
    importError: language === 'English' ? 'Import Error' : 'خطأ في الاستيراد',
    
    // Employee Configuration
    employeeConfiguration: language === 'English' ? 'Employee Configuration' : 'تكوين الموظفين',
    employeeConfigDescription: language === 'English' ? 'Manage departments and organizational structure for employee management.' : 'إدارة الأقسام والهيكل التنظيمي لإدارة الموظفين.',
    createNewDepartment: language === 'English' ? 'Create a new department to organize employees.' : 'إنشاء قسم جديد لتنظيم الموظفين.',
    departmentNamePlaceholder: language === 'English' ? 'e.g., IT, HR, Finance' : 'مثال: تقنية المعلومات، الموارد البشرية، المالية',
    noDepartments: language === 'English' ? 'No Departments' : 'لا توجد أقسام',
    addDepartmentsMessage: language === 'English' ? 'Add departments to organize your employees.' : 'أضف أقساماً لتنظيم موظفيك.',
    
   
    addBrandsMessage: language === 'English' ? 'Add brands to track manufacturers.' : 'أضف العلامات لتتبع المصنعين.',
    
    // Additional Import/Export translations (only new keys)
    uploadCsvFiles: language === 'English' ? 'Upload CSV files to import' : 'رفع ملفات CSV لاستيراد',
    dataIntoSystem: language === 'English' ? 'data into your system.' : 'إلى النظام.',
    dragDropCsv: language === 'English' ? 'Drag and drop your CSV file here' : 'اسحب وأفلت ملف CSV هنا',
    
    // Delete success/error messages
    assetTypeDeleted: language === 'English' ? 'Asset type deleted successfully' : 'تم حذف نوع الأصل بنجاح',
    assetBrandDeleted: language === 'English' ? 'Asset brand deleted successfully' : 'تم حذف علامة الأصل بنجاح',
    assetStatusDeleted: language === 'English' ? 'Asset status deleted successfully' : 'تم حذف حالة الأصل بنجاح',
    categoryDeleted: language === 'English' ? 'Category deleted successfully' : 'تم حذف الفئة بنجاح',
    failedToDeleteAssetType: language === 'English' ? 'Failed to delete asset type' : 'فشل حذف نوع الأصل',
    failedToDeleteAssetBrand: language === 'English' ? 'Failed to delete asset brand' : 'فشل حذف علامة الأصل',
    failedToDeleteAssetStatus: language === 'English' ? 'Failed to delete asset status' : 'فشل حذف حالة الأصل',
    failedToDeleteCategory: language === 'English' ? 'Failed to delete category' : 'فشل حذف الفئة',
    
    // Update success messages
    assetTypeUpdated: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
    assetBrandUpdated: language === 'English' ? 'Asset brand updated successfully' : 'تم تحديث علامة الأصل بنجاح',
    assetStatusUpdated: language === 'English' ? 'Asset status updated successfully' : 'تم تحديث حالة الأصل بنجاح',
    categoryUpdated: language === 'English' ? 'Category updated successfully' : 'تم تحديث الفئة بنجاح',
    failedToUpdateAssetType: language === 'English' ? 'Failed to update asset type' : 'فشل تحديث نوع الأصل',
    failedToUpdateAssetBrand: language === 'English' ? 'Failed to update asset brand' : 'فشل تحديث علامة الأصل',
    failedToUpdateAssetStatus: language === 'English' ? 'Failed to update asset status' : 'فشل تحديث حالة الأصل',
    failedToUpdateCategory: language === 'English' ? 'Failed to update request type' : 'فشل تحديث نوع الطلب',
    
    // Employee Configuration description
    manageEmployeeDepartments: language === 'English' ? 'Manage employee departments, custom fields, and organizational settings.' : 'إدارة أقسام الموظفين والحقول المخصصة وإعدادات المؤسسة.',
    
    // Additional missing translations
    briefDescription: language === 'English' ? 'Brief description...' : 'وصف مختصر...',
    createCategoryDescription: language === 'English' ? 'Create a new category for ticket classification.' : 'إنشاء فئة جديدة لتصنيف التذاكر.',
    categoryNamePlaceholder: language === 'English' ? 'e.g., Hardware Issue, Software Support' : 'مثال: مشكلة أجهزة، دعم برمجيات',
    categoryDescriptionPlaceholder: language === 'English' ? 'Brief description of this category...' : 'وصف مختصر لهذه الفئة...',
    noCategories: language === 'English' ? 'No Categories' : 'لا توجد فئات',
    addCategoriesMessage: language === 'English' ? 'Add categories to classify support tickets.' : 'أضف الفئات لتصنيف تذاكر الدعم.',
    category: language === 'English' ? 'Category' : 'الفئة'
  };
  
  // Tab state management with localStorage persistence
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('systemConfigActiveTab') || 'general';
    } catch {
      return 'general';
    }
  });
  const [preservedTab, setPreservedTab] = useState<string | null>(null);

  // Handle tab changes with persistence
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try {
      localStorage.setItem('systemConfigActiveTab', value);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Restore preserved tab after mutations
  useEffect(() => {
    if (preservedTab) {
      setActiveTab(preservedTab);
      try {
        localStorage.setItem('systemConfigActiveTab', preservedTab);
      } catch {
        // Ignore localStorage errors
      }
      setPreservedTab(null);
    }
  }, [preservedTab]);
  
  // Basic configuration states
  const [assetIdPrefix, setAssetIdPrefix] = useState('AST-');
  const [empIdPrefix, setEmpIdPrefix] = useState('EMP-');
  const [ticketIdPrefix, setTicketIdPrefix] = useState('TKT-');
  const [currency, setCurrency] = useState('USD');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(true);
  
  // Department management states
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editedDeptName, setEditedDeptName] = useState('');
  
  // Category management states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  // Email configuration states
  const [emailHost, setEmailHost] = useState('');
  const [emailPort, setEmailPort] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailSecure, setEmailSecure] = useState(true);
  
  // Company details states
  const [companyName, setCompanyName] = useState('ELADWYSOFT');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  
  // Company display configuration states
  const [showCompanyInHeader, setShowCompanyInHeader] = useState(true);
  const [companyDisplayLocation, setCompanyDisplayLocation] = useState('badge');
  
  // Import/Export states from current working version
  const [selectedDataType, setSelectedDataType] = useState<string>('employees');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const [importError, setImportError] = useState<string>('');
  const [parsedFileData, setParsedFileData] = useState<any[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [showFieldMapping, setShowFieldMapping] = useState(false);

  // Asset Management form states
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusDescription, setNewStatusDescription] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3B82F6');

  // Asset Management dialog states
  const [isAssetTypeDialogOpen, setIsAssetTypeDialogOpen] = useState(false);
  const [isAssetBrandDialogOpen, setIsAssetBrandDialogOpen] = useState(false);
  const [isAssetStatusDialogOpen, setIsAssetStatusDialogOpen] = useState(false);
  
  // Department dialog state
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);

  // Asset Management search states
  const [assetTypeSearch, setAssetTypeSearch] = useState('');
  const [assetBrandSearch, setAssetBrandSearch] = useState('');
  const [assetStatusSearch, setAssetStatusSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Editing states for asset management
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editedTypeName, setEditedTypeName] = useState('');
  const [editedTypeDescription, setEditedTypeDescription] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editedBrandName, setEditedBrandName] = useState('');
  const [editedBrandDescription, setEditedBrandDescription] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editedStatusName, setEditedStatusName] = useState('');
  const [editedStatusDescription, setEditedStatusDescription] = useState('');
  const [editedStatusColor, setEditedStatusColor] = useState('#3B82F6');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [editedCategoryDescription, setEditedCategoryDescription] = useState('');
  
  // Clear audit logs states
  const [clearLogsDialogOpen, setClearLogsDialogOpen] = useState(false);
  const [clearLogsTimeframe, setClearLogsTimeframe] = useState('month');
  
  // Data type options for import/export
  const DATA_TYPE_OPTIONS = [
    { 
      value: 'employees', 
      label: { English: 'Employees', Arabic: 'الموظفون' } as Record<string, string>,
      description: { English: 'Manage employee records and information', Arabic: 'إدارة سجلات ومعلومات الموظفين' } as Record<string, string>,
      icon: Users,
      color: 'text-blue-600'
    },
    { 
      value: 'assets', 
      label: { English: 'Assets', Arabic: 'الأصول' } as Record<string, string>,
      description: { English: 'Manage IT assets and equipment', Arabic: 'إدارة الأصول والمعدات التقنية' } as Record<string, string>,
      icon: Package,
      color: 'text-green-600'
    },
    { 
      value: 'tickets', 
      label: { English: 'Tickets', Arabic: 'التذاكر' } as Record<string, string>,
      description: { English: 'Manage support tickets and requests', Arabic: 'إدارة تذاكر الدعم والطلبات' } as Record<string, string>,
      icon: Ticket,
      color: 'text-orange-600'
    }
  ];

  // Queries
  const { data: config } = useQuery<any>({
    queryKey: ['/api/system-config'],
    enabled: hasAccess(3),
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: customAssetTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-types'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: customAssetBrands = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-brands'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: customAssetStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-statuses'],
    enabled: hasAccess(4), // Admin only
  });

  // Filtered arrays for search functionality
  const filteredAssetTypes = customAssetTypes.filter((type: any) =>
    type.name.toLowerCase().includes(assetTypeSearch.toLowerCase())
  );

  const filteredAssetBrands = customAssetBrands.filter((brand: any) =>
    brand.name.toLowerCase().includes(assetBrandSearch.toLowerCase())
  );

  const filteredAssetStatuses = customAssetStatuses.filter((status: any) =>
    status.name.toLowerCase().includes(assetStatusSearch.toLowerCase())
  );

  const filteredCategories = categories.filter((category: any) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Update local state when config data is loaded
  useEffect(() => {
    if (config) {
      setAssetIdPrefix(config.assetIdPrefix || 'AST-');
      setEmpIdPrefix(config.empIdPrefix || 'EMP-');
      setTicketIdPrefix(config.ticketIdPrefix || 'TKT-');
      setCurrency(config.currency || 'USD');
      setSelectedLanguage(config.language === 'en' ? 'English' : 'Arabic');
      setDepartments(config.departments || []);
      
      // Load email configuration
      setEmailHost(config.emailHost || '');
      setEmailPort(config.emailPort?.toString() || '');
      setEmailUser(config.emailUser || '');
      setEmailPassword(config.emailPassword || '');
      setEmailFromAddress(config.emailFromAddress || '');
      setEmailFromName(config.emailFromName || '');
      setEmailSecure(config.emailSecure !== false);
      
      // Load company details
      setCompanyName(config.companyName || 'ELADWYSOFT');
      setCompanyAddress(config.companyAddress || '');
      setCompanyPhone(config.companyPhone || '');
      setCompanyEmail(config.companyEmail || '');
      setCompanyWebsite(config.companyWebsite || '');
      
      // Load company display configuration
      setShowCompanyInHeader(config.showCompanyInHeader !== false);
      setCompanyDisplayLocation(config.companyDisplayLocation || 'badge');
      
      setIsLoading(false);
    }
  }, [config]);

  // Configuration update mutation (General Settings only)
  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/system-config', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      // Force refetch to ensure language changes are reflected immediately
      queryClient.refetchQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: translations.success,
        description: translations.generalSettingsUpdated,
      });
      // Restore preserved tab after department operations
      if (preservedTab) {
        setActiveTab(preservedTab);
        setPreservedTab(null);
      }
    },
    onError: (error) => {
      toast({
        title: translations.error,
        description: translations.failedToUpdate,
        variant: 'destructive'
      });
    }
  });

  // Email configuration update mutation
  const updateEmailConfigMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/email-config', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-config'] });
      toast({
        title: translations.success,
        description: translations.emailSettingsUpdated,
      });
      // Preserve current tab
      setPreservedTab(activeTab);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToUpdateEmail,
        variant: 'destructive'
      });
    }
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: (data: { emailConfig: any; testEmail: { to: string; subject?: string } }) => 
      apiRequest('/api/email-config/test', 'POST', data),
    onSuccess: () => {
      toast({
        title: translations.success,
        description: translations.testEmailSent,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToSendTestEmail,
        variant: 'destructive'
      });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('/api/categories', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: translations.success,
        description: translations.categoryAdded,
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsCategoryDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: translations.error,
        description: translations.failedToAddCategory,
        variant: 'destructive'
      });
      console.error('Failed to create request type:', error);
    }
  });

  // Create custom asset type mutation
  const createAssetTypeMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('/api/custom-asset-types', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: translations.success,
        description: translations.assetTypeAdded,
      });
      setNewTypeName('');
      setNewTypeDescription('');
      setIsAssetTypeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: translations.error,
        description: translations.failedToAddAssetType,
        variant: 'destructive'
      });
      console.error('Failed to create asset type:', error);
    }
  });

  // Create custom asset brand mutation
  const createAssetBrandMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('/api/custom-asset-brands', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: translations.success,
        description: translations.assetBrandAdded,
      });
      setNewBrandName('');
      setNewBrandDescription('');
      setIsAssetBrandDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: translations.error,
        description: translations.failedToAddAssetBrand,
        variant: 'destructive'
      });
      console.error('Failed to create asset brand:', error);
    }
  });

  // Create custom asset status mutation  
  const createAssetStatusMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) => 
      apiRequest('/api/custom-asset-statuses', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: translations.success,
        description: translations.assetStatusAdded,
      });
      setNewStatusName('');
      setNewStatusDescription('');
      setNewStatusColor('#3B82F6');
      setIsAssetStatusDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: translations.error,
        description: translations.failedToAddAssetStatus,
        variant: 'destructive'
      });
      console.error('Failed to create asset status:', error);
    }
  });

  // Create service provider mutation

  // Delete Asset Type Mutation
  const deleteAssetTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-types/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: translations.success,
        description: translations.assetTypeDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToDeleteAssetType,
        variant: 'destructive'
      });
    }
  });

  // Delete Asset Brand Mutation  
  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-brands/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: translations.success,
        description: translations.assetBrandDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToDeleteAssetBrand,
        variant: 'destructive'
      });
    }
  });

  // Delete Asset Status Mutation
  const deleteAssetStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-statuses/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: translations.success,
        description: translations.assetStatusDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToDeleteAssetStatus,
        variant: 'destructive'
      });
    }
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/categories/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: translations.success,
        description: translations.categoryDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToDeleteCategory,
        variant: 'destructive'
      });
    }
  });

  // UPDATE MUTATIONS - Missing functionality
  
  // Update Asset Type Mutation
  const updateAssetTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) => 
      apiRequest(`/api/custom-asset-types/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: translations.success,
        description: translations.assetTypeUpdated,
      });
      setEditingTypeId(null);
      setEditedTypeName('');
      setEditedTypeDescription('');
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToUpdateAssetType,
        variant: 'destructive'
      });
    }
  });

  // Update Asset Brand Mutation
  const updateAssetBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) => 
      apiRequest(`/api/custom-asset-brands/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: translations.success,
        description: translations.assetBrandUpdated,
      });
      setEditingBrandId(null);
      setEditedBrandName('');
      setEditedBrandDescription('');
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToUpdateAssetBrand,
        variant: 'destructive'
      });
    }
  });

  // Update Asset Status Mutation
  const updateAssetStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string; color?: string } }) => 
      apiRequest(`/api/custom-asset-statuses/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: translations.success,
        description: translations.assetStatusUpdated,
      });
      setEditingStatusId(null);
      setEditedStatusName('');
      setEditedStatusDescription('');
      setEditedStatusColor('#3B82F6');
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToUpdateAssetStatus,
        variant: 'destructive'
      });
    }
  });

  // Update Category Mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) => 
      apiRequest(`/api/categories/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: translations.success,
        description: translations.categoryUpdated,
      });
      setEditingCategoryId(null);
      setEditedCategoryName('');
      setEditedCategoryDescription('');
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToUpdateCategory,
        variant: 'destructive'
      });
    }
  });

  // Import/Export functions from current working version
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === 'text/csv') {
      setSelectedFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0] && files[0].type === 'text/csv') {
      setSelectedFile(files[0]);
    }
  };

  const handleDownloadTemplate = async (type: 'employees' | 'assets' | 'tickets') => {
    try {
      // Use direct fetch with authentication since we need the raw CSV text
      const response = await fetch(`/api/${type}/template`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv, application/csv, text/plain',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the CSV text content
      const csvContent = await response.text();
      
      // Create blob from the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_template.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: language === 'English' ? 'Template Downloaded' : 'تم تنزيل القالب',
        description: language === 'English' ? `${type} template downloaded successfully` : `تم تنزيل قالب ${type} بنجاح`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to download template' : 'فشل تحميل القالب',
        variant: 'destructive'
      });
    }
  };

  const handleExport = async (type: 'employees' | 'assets' | 'tickets') => {
    try {
      // Use direct fetch with authentication since we need the raw CSV text
      const response = await fetch(`/api/${type}/export`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv, application/csv, text/plain',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the CSV text content
      const csvContent = await response.text();
      
      // Create blob from the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: language === 'English' ? 'Export Successful' : 'تم التصدير بنجاح',
        description: language === 'English' ? `${type} data exported successfully` : `تم تصدير بيانات ${type} بنجاح`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to export data' : 'فشل تصدير البيانات',
        variant: 'destructive'
      });
    }
  };

 const parseCSV = (csvText: string) => {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return { headers, data };
};

// ✅ NEW: Proper CSV line parser that handles quotes
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes ("") -> single quote
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Only split on comma if we're not inside quotes
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

  const handleFileImport = async () => {
    if (!selectedFile) {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'No file selected for import' : 'لم يتم اختيار ملف للاستيراد',
        variant: 'destructive',
      });
      return;
    }

    setImportError('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        
        const { headers, data } = parseCSV(csvText);
        
        setParsedFileData(data);
        setFileColumns(headers);
        setShowFieldMapping(true);
        setImportError('');
        
      } catch (error) {
        console.error('File parsing error:', error);
        const errorMessage = language === 'English' ? 'Failed to parse CSV file' : 'فشل تحليل ملف CSV';
        setImportError(errorMessage);
        toast({
          title: language === 'English' ? 'Parse Error' : 'خطأ تحليل',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleMappingComplete = async (mappings: any[]) => {
    // Extract mapped data and mapping from the interface format
    const mappedData = parsedFileData;
    const mapping = mappings.reduce((acc: Record<string, string>, m: any) => {
      if (m.sourceColumn && m.targetField) {
        acc[m.targetField] = m.sourceColumn;
      }
      return acc;
    }, {});
    
    // Validate required data before proceeding
    if (!selectedDataType) {
      throw new Error('No data type selected');
    }
    if (!mappedData || !Array.isArray(mappedData)) {
      throw new Error('No parsed file data available');
    }
    if (!mapping || Object.keys(mapping).length === 0) {
      throw new Error('No field mapping provided');
    }
    
    setIsImporting(true);
    setImportProgress(0);
    setImportError('');
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('entityType', selectedDataType);
      formData.append('data', JSON.stringify(mappedData));
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetch('/api/import/process', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      const results = await response.json();
      setImportResults(results);
      setShowFieldMapping(false);
      setSelectedFile(null);
      
      toast({
        title: language === 'English' ? 'Import Complete' : 'اكتمل الاستيراد',
        description: language === 'English' 
          ? `Successfully imported ${results.imported} of ${results.total} records` 
          : `تم استيراد ${results.imported} من ${results.total} سجل بنجاح`,
      });

    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown import error occurred';
      setImportError(errorMessage);
      toast({
        title: language === 'English' ? 'Import Failed' : 'فشل الاستيراد',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  const handleMappingCancel = () => {
    setShowFieldMapping(false);
    setParsedFileData([]);
    setFileColumns([]);
  };

  // Handler functions for various operations
  const handleSaveGeneralConfig = () => {
    const configData = {
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      language: selectedLanguage === 'English' ? 'en' : 'ar',
      departments,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyWebsite,
      showCompanyInHeader,
      companyDisplayLocation,
    };
    updateConfigMutation.mutate(configData);
  };

  const handleSaveEmailConfig = () => {
    const emailConfig = {
      emailHost,
      emailPort: emailPort ? parseInt(emailPort) : 587,
      emailUser,
      emailPassword,
      emailFromAddress,
      emailFromName,
      emailSecure,
    };
    updateEmailConfigMutation.mutate(emailConfig);
  };

  const handleTestEmail = () => {
    const emailConfig = {
      emailHost,
      emailPort: emailPort ? parseInt(emailPort) : 587,
      emailUser,
      emailPassword,
      emailFromAddress,
      emailFromName,
      emailSecure,
    };
    
    const testEmail = {
      to: emailUser, // Send test email to the configured email address
      subject: 'SimpleIT Email Configuration Test',
    };

    testEmailMutation.mutate({ emailConfig, testEmail });
  };

  // Handler functions for delete operations
  const handleDeleteAssetType = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this asset type?' : 'هل أنت متأكد من حذف نوع الأصل هذا؟')) {
      deleteAssetTypeMutation.mutate(id);
    }
  };

  const handleDeleteAssetBrand = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this asset brand?' : 'هل أنت متأكد من حذف علامة الأصل هذه؟')) {
      deleteAssetBrandMutation.mutate(id);
    }
  };

  const handleDeleteAssetStatus = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this asset status?' : 'هل أنت متأكد من حذف حالة الأصل هذه؟')) {
      deleteAssetStatusMutation.mutate(id);
    }
  };

  const handleDeleteCategory = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this category?' : 'هل أنت متأكد من حذف هذه الفئة؟')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Department handlers
  const handleAddDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      const updatedDepartments = [...departments, newDepartment.trim()];
      setDepartments(updatedDepartments);
      setNewDepartment('');
      
      // Save immediately to database
      const configData = {
        assetIdPrefix,
        empIdPrefix,
        ticketIdPrefix,
        currency,
        language: selectedLanguage === 'English' ? 'en' : 'ar',
        departments: updatedDepartments,
        emailHost,
        emailPort: emailPort ? parseInt(emailPort) : 587,
        emailUser,
        emailPassword,
        emailFromAddress,
        emailFromName,
        emailSecure,
      };
      updateConfigMutation.mutate(configData);
    }
  };

  const handleEditDepartment = (index: number) => {
    setEditingDeptIndex(index);
    setEditedDeptName(departments[index]);
  };

  const handleSaveDepartmentEdit = () => {
    if (editingDeptIndex !== null && editedDeptName.trim()) {
      const updatedDepartments = departments.map((dept, index) => 
        index === editingDeptIndex ? editedDeptName.trim() : dept
      );
      setDepartments(updatedDepartments);
      setEditingDeptIndex(null);
      setEditedDeptName('');
      
      // Save immediately to database
      const configData = {
        assetIdPrefix,
        empIdPrefix,
        ticketIdPrefix,
        currency,
        language: selectedLanguage === 'English' ? 'en' : 'ar',
        departments: updatedDepartments,
        emailHost,
        emailPort: emailPort ? parseInt(emailPort) : 587,
        emailUser,
        emailPassword,
        emailFromAddress,
        emailFromName,
        emailSecure,
      };
      updateConfigMutation.mutate(configData);
    }
  };

  // Asset Type Edit Handlers
  const startEditAssetType = (type: any) => {
    setEditingTypeId(type.id);
    setEditedTypeName(type.name);
    setEditedTypeDescription(type.description || '');
  };

  const handleSaveAssetType = () => {
    if (editingTypeId && editedTypeName.trim()) {
      updateAssetTypeMutation.mutate({
        id: editingTypeId,
        data: {
          name: editedTypeName.trim(),
          description: editedTypeDescription.trim()
        }
      });
    }
  };

  const handleCancelAssetTypeEdit = () => {
    setEditingTypeId(null);
    setEditedTypeName('');
    setEditedTypeDescription('');
  };

  // Asset Brand Edit Handlers
  const startEditAssetBrand = (brand: any) => {
    setEditingBrandId(brand.id);
    setEditedBrandName(brand.name);
    setEditedBrandDescription(brand.description || '');
  };

  const handleSaveAssetBrand = () => {
    if (editingBrandId && editedBrandName.trim()) {
      updateAssetBrandMutation.mutate({
        id: editingBrandId,
        data: {
          name: editedBrandName.trim(),
          description: editedBrandDescription.trim()
        }
      });
    }
  };

  const handleCancelAssetBrandEdit = () => {
    setEditingBrandId(null);
    setEditedBrandName('');
    setEditedBrandDescription('');
  };

  // Asset Status Edit Handlers
  const startEditAssetStatus = (status: any) => {
    setEditingStatusId(status.id);
    setEditedStatusName(status.name);
    setEditedStatusDescription(status.description || '');
    setEditedStatusColor(status.color || '#3B82F6');
  };

  const handleSaveAssetStatus = () => {
    if (editingStatusId && editedStatusName.trim()) {
      updateAssetStatusMutation.mutate({
        id: editingStatusId,
        data: {
          name: editedStatusName.trim(),
          description: editedStatusDescription.trim(),
          color: editedStatusColor
        }
      });
    }
  };

  const handleCancelAssetStatusEdit = () => {
    setEditingStatusId(null);
    setEditedStatusName('');
    setEditedStatusDescription('');
    setEditedStatusColor('#3B82F6');
  };

  // Category Edit Handlers
  const startEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setEditedCategoryName(category.name);
    setEditedCategoryDescription(category.description || '');
  };

  const handleSaveCategory = () => {
    if (editingCategoryId && editedCategoryName.trim()) {
      updateCategoryMutation.mutate({
        id: editingCategoryId,
        data: {
          name: editedCategoryName.trim(),
          description: editedCategoryDescription.trim()
        }
      });
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditedCategoryName('');
    setEditedCategoryDescription('');
  };

  const handleCancelDepartmentEdit = () => {
    setEditingDeptIndex(null);
    setEditedDeptName('');
  };

  const handleDeleteDepartment = (index: number) => {
    if (window.confirm(language === 'English' ? `Delete department "${departments[index]}"?` : `حذف القسم "${departments[index]}"؟`)) {
      const updatedDepartments = departments.filter((_, i) => i !== index);
      setDepartments(updatedDepartments);
      
      // Save immediately to database
      const configData = {
        assetIdPrefix,
        empIdPrefix,
        ticketIdPrefix,
        currency,
        language: selectedLanguage === 'English' ? 'en' : 'ar',
        departments: updatedDepartments,
        emailHost,
        emailPort: emailPort ? parseInt(emailPort) : 587,
        emailUser,
        emailPassword,
        emailFromAddress,
        emailFromName,
        emailSecure,
      };
      updateConfigMutation.mutate(configData);
    }
  };

  // If user doesn't have access to system configuration
  if (!hasAccess(3)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {translations.accessDenied}
          </h2>
          <p className="text-gray-600">
            {translations.noPermissionMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            {translations.systemConfiguration}
          </h1>
          <p className="text-gray-600 mt-2">
            {translations.configureSystem}
          </p>
        </div>
        
        
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">
              {translations.general}
            </span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">
              {translations.employees}
            </span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">
              {translations.assets}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">
              {translations.tickets}
            </span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">
              {translations.emailConfig}
            </span>
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">
              {translations.importExport}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{translations.generalSettings}</CardTitle>
              <CardDescription>
                {translations.generalSettingsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>{translations.assetIdPrefix}</Label>
                  <Input
                    value={assetIdPrefix}
                    onChange={(e) => setAssetIdPrefix(e.target.value)}
                    placeholder="AST-"
                  />
                  <p className="text-xs text-muted-foreground">
                    {translations.usedForAssetGeneration}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>{translations.employeeIdPrefix}</Label>
                  <Input
                    value={empIdPrefix}
                    onChange={(e) => setEmpIdPrefix(e.target.value)}
                    placeholder="EMP-"
                  />
                  <p className="text-xs text-muted-foreground">
                    {translations.usedForEmployeeGeneration}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>{translations.ticketIdPrefix}</Label>
                  <Input
                    value={ticketIdPrefix}
                    onChange={(e) => setTicketIdPrefix(e.target.value)}
                    placeholder="TKT-"
                  />
                  <p className="text-xs text-muted-foreground">
                    {translations.usedForTicketGeneration}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{translations.defaultCurrency}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{translations.systemLanguage}</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Arabic">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Company Details Section */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">
                  {translations.companyDetails}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{translations.companyName}</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ELADWYSOFT"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{translations.companyEmail}</Label>
                    <Input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@company.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{translations.companyPhone}</Label>
                    <Input
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{translations.companyWebsite}</Label>
                    <Input
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://www.company.com"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>{translations.companyAddress}</Label>
                    <Input
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder={translations.enterCompanyAddress}
                    />
                  </div>
                </div>
              </div>

              {/* Company Display Configuration Section */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">
                  {translations.companyDisplay}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {translations.companyDisplayDescription}
                </p>
                
                <div className="space-y-6">
                  {/* Show Company in Header Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="show-company-header" className="text-sm font-medium">
                        {translations.showCompanyInHeader}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {translations.showCompanyDescription}
                      </p>
                    </div>
                    <Switch
                      id="show-company-header"
                      checked={showCompanyInHeader}
                      onCheckedChange={setShowCompanyInHeader}
                    />
                  </div>

                  {/* Display Location Selection - Only show when company display is enabled */}
                  {showCompanyInHeader && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        {translations.displayLocation}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {translations.displayLocationDescription}
                      </p>
                      <Select value={companyDisplayLocation} onValueChange={setCompanyDisplayLocation}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="badge">
                            {translations.badgeNextToLanguage}
                          </SelectItem>
                          <SelectItem value="dropdown">
                            {translations.underUsername}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSaveGeneralConfig}
                  disabled={updateConfigMutation.isPending}
                  className="min-w-32"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translations.saving}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {translations.save}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Import/Export Tab - Working version preserved */}
        <TabsContent value="import-export" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {translations.importExportData}
                </CardTitle>
                <CardDescription>
                  {translations.importExportDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {translations.selectDataType}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DATA_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedDataType === option.value;
                      
                      return (
                        <Card
                          key={option.value}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 shadow-md bg-blue-50' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedDataType(option.value)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-8 w-8 ${option.color}`} />
                              <div className="flex-1">
                                <h3 className="font-medium text-sm">
                                  {option.label[language]}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {option.description[language]}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Field Mapping Interface */}
                {showFieldMapping && (
                  <div className="mt-6">
                    <FieldMappingInterface
                      entityType={selectedDataType as 'employees' | 'assets' | 'tickets'}
                      fileData={parsedFileData}
                      fileColumns={fileColumns.map(col => ({ 
                        name: col, 
                        sampleValues: [], 
                        dataType: 'text' as const 
                      }))}
                      onMappingComplete={handleMappingComplete}
                      onCancel={handleMappingCancel}
                    />
                  </div>
                )}

                {/* Action Section - Detailed Interface based on selected action */}
                {!showFieldMapping && (
                  <div className="mt-6">
                    {/* File Upload Interface */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-blue-600" />
                          {translations.importData}
                        </CardTitle>
                        <CardDescription>
                          {translations.uploadCsvFiles} {selectedDataType} {translations.dataIntoSystem}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* File Upload Area */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            dragActive 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onDrop={handleFileDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                        >
                          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              {translations.dragDropCsv}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {translations.orClickToBrowse}
                            </p>
                            <input
                              id="file-input"
                              type="file"
                              accept=".csv"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('file-input')?.click()}
                              className="mt-2"
                            >
                              {translations.chooseFile}
                            </Button>
                          </div>
                        </div>

                        {/* Selected File Display */}
                        {selectedFile && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border">
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">{selectedFile.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Button 
                            onClick={() => handleDownloadTemplate(selectedDataType as 'employees' | 'assets' | 'tickets')}
                            variant="outline" 
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {translations.getTemplate}
                          </Button>
                          
                          <Button 
                            onClick={() => handleExport(selectedDataType as 'employees' | 'assets' | 'tickets')}
                            variant="outline"
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {translations.exportData}
                          </Button>

                          <Button 
                            onClick={() => {
                              if (selectedFile) {
                                handleFileImport();
                              }
                            }}
                            disabled={!selectedFile || isImporting}
                            className="w-full"
                          >
                            {isImporting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {translations.importing}
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {translations.importFile}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Import Results */}
                    {importResults && (
                      <Card className="mt-4">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-lg">
                              {translations.importResults}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium">{translations.totalRecords}</p>
                              <p className="text-2xl font-bold">{importResults.total || 0}</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <p className="font-medium text-green-800">{translations.successfullyImported}</p>
                              <p className="text-2xl font-bold text-green-600">{importResults.imported || 0}</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <p className="font-medium text-red-800">{translations.failed}</p>
                              <p className="text-2xl font-bold text-red-600">{importResults.failed || 0}</p>
                            </div>
                          </div>
                          {importResults.errors && importResults.errors.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 rounded-lg">
                              <p className="font-medium text-red-800 mb-2">
                                {translations.errors}
                              </p>
                              <ul className="list-disc list-inside text-red-700 max-h-32 overflow-y-auto text-sm">
                                {importResults.errors.slice(0, 10).map((error: string, index: number) => (
                                  <li key={index}>{error}</li>
                                ))}
                                {importResults.errors.length > 10 && (
                                  <li>
                                    {language === 'English' 
                                      ? `... and ${importResults.errors.length - 10} more errors` 
                                      : `... و ${importResults.errors.length - 10} أخطاء أخرى`}
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Import Error */}
                    {importError && (
                      <Card className="mt-4 border-red-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <X className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-800 text-lg">
                              {translations.importError}
                            </span>
                          </div>
                          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{importError}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {translations.employeeConfiguration}
              </CardTitle>
              <CardDescription>
                {translations.manageEmployeeDepartments}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Department Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {translations.departmentManagement}
                  </h3>
                  <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {translations.addDepartment}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{translations.addDepartment}</DialogTitle>
                        <DialogDescription>
                          {translations.createNewDepartment}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{translations.departmentName}</Label>
                          <Input 
                            value={newDepartment} 
                            onChange={(e) => setNewDepartment(e.target.value)}
                            placeholder={translations.departmentNamePlaceholder}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setIsDepartmentDialogOpen(false);
                            setNewDepartment('');
                          }}>
                            {translations.cancel}
                          </Button>
                          <Button 
                            onClick={() => {
                              if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
                                const updatedDepartments = [...departments, newDepartment.trim()];
                                setDepartments(updatedDepartments);
                                setNewDepartment('');
                                setIsDepartmentDialogOpen(false);
                                setPreservedTab('employees');
                                
                                // Save immediately to database
                                const configData = {
                                  assetIdPrefix,
                                  empIdPrefix,
                                  ticketIdPrefix,
                                  currency,
                                  language: selectedLanguage === 'English' ? 'en' : 'ar',
                                  departments: updatedDepartments,
                                  emailHost,
                                  emailPort: emailPort ? parseInt(emailPort) : 587,
                                  emailUser,
                                  emailPassword,
                                  emailFromAddress,
                                  emailFromName,
                                  emailSecure,
                                };
                                updateConfigMutation.mutate(configData);
                              }
                            }}
                            disabled={!newDepartment.trim() || departments.includes(newDepartment.trim())}
                          >
                            {translations.add}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="border rounded-lg bg-white shadow-sm">
                  {!departments?.length ? (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {translations.noDepartments}
                      </h3>
                      <p className="text-gray-600">
                        {translations.addDepartmentsMessage}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">{translations.departmentName}</TableHead>
                          <TableHead className="font-semibold w-32">{translations.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departments.map((dept: string, index: number) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell>
                              {editingDeptIndex === index ? (
                                <Input
                                  value={editedDeptName}
                                  onChange={(e) => setEditedDeptName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const updatedDepartments = [...departments];
                                      updatedDepartments[index] = editedDeptName.trim();
                                      setDepartments(updatedDepartments);
                                      setEditingDeptIndex(null);
                                      setEditedDeptName('');
                                      setPreservedTab('employees');
                                      
                                      // Save immediately to database
                                      const configData = {
                                        assetIdPrefix,
                                        empIdPrefix,
                                        ticketIdPrefix,
                                        currency,
                                        language: selectedLanguage === 'English' ? 'en' : 'ar',
                                        departments: updatedDepartments,
                                        emailHost,
                                        emailPort: emailPort ? parseInt(emailPort) : 587,
                                        emailUser,
                                        emailPassword,
                                        emailFromAddress,
                                        emailFromName,
                                        emailSecure,
                                      };
                                      updateConfigMutation.mutate(configData);
                                    }
                                  }}
                                  className="h-8"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-medium">{dept}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {editingDeptIndex === index ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedDepartments = [...departments];
                                        updatedDepartments[index] = editedDeptName.trim();
                                        setDepartments(updatedDepartments);
                                        setEditingDeptIndex(null);
                                        setEditedDeptName('');
                                        setPreservedTab('employees');
                                        
                                        // Save immediately to database
                                        const configData = {
                                          assetIdPrefix,
                                          empIdPrefix,
                                          ticketIdPrefix,
                                          currency,
                                          language: selectedLanguage === 'English' ? 'en' : 'ar',
                                          departments: updatedDepartments,
                                          emailHost,
                                          emailPort: emailPort ? parseInt(emailPort) : 587,
                                          emailUser,
                                          emailPassword,
                                          emailFromAddress,
                                          emailFromName,
                                          emailSecure,
                                        };
                                        updateConfigMutation.mutate(configData);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingDeptIndex(null);
                                        setEditedDeptName('');
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingDeptIndex(index);
                                        setEditedDeptName(dept);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteDepartment(index)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {translations.assetConfiguration}
              </CardTitle>
              <CardDescription>
                {translations.assetConfigDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="types" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="types" className="text-xs">
                    {translations.types}
                  </TabsTrigger>
                  <TabsTrigger value="brands" className="text-xs">
                    {translations.brands}
                  </TabsTrigger>
                  <TabsTrigger value="statuses" className="text-xs">
                    {translations.statuses}
                  </TabsTrigger>
                </TabsList>

                {/* Asset Types Tab */}
                <TabsContent value="types" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={translations.searchTypes}
                        value={assetTypeSearch}
                        onChange={(e) => setAssetTypeSearch(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <Dialog open={isAssetTypeDialogOpen} onOpenChange={setIsAssetTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          {translations.addType}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{translations.addAssetType}</DialogTitle>
                          <DialogDescription>
                            {translations.createNewAssetType}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{translations.typeName}</Label>
                            <Input 
                              value={newTypeName} 
                              onChange={(e) => setNewTypeName(e.target.value)}
                              placeholder={translations.typeNamePlaceholder}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{translations.description}</Label>
                            <Input 
                              value={newTypeDescription} 
                              onChange={(e) => setNewTypeDescription(e.target.value)}
                              placeholder={translations.descriptionPlaceholder}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAssetTypeDialogOpen(false)}>
                              {translations.cancel}
                            </Button>
                            <Button 
                              onClick={() => {
                                if (newTypeName.trim()) {
                                  createAssetTypeMutation.mutate({
                                    name: newTypeName.trim(),
                                    description: newTypeDescription.trim()
                                  });
                                }
                              }}
                              disabled={createAssetTypeMutation.isPending || !newTypeName.trim()}
                            >
                              {createAssetTypeMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {translations.adding}
                                </>
                              ) : (
                                translations.add
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="border rounded-lg">
                    {!filteredAssetTypes?.length ? (
                      <div className="p-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {translations.noAssetTypes}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {translations.addAssetTypesMessage}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{translations.typeName}</TableHead>
                            <TableHead>{translations.description}</TableHead>
                            <TableHead className="w-20">{translations.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssetTypes.map((type: any) => (
                            <TableRow key={type.id}>
                              <TableCell className="font-medium">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeName}
                                    onChange={(e) => setEditedTypeName(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetTypeMutation.mutate({
                                          id: type.id,
                                          data: { name: editedTypeName.trim(), description: editedTypeDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                ) : (
                                  type.name
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeDescription}
                                    onChange={(e) => setEditedTypeDescription(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetTypeMutation.mutate({
                                          id: type.id,
                                          data: { name: editedTypeName.trim(), description: editedTypeDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    placeholder="Description..."
                                  />
                                ) : (
                                  type.description
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {editingTypeId === type.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          updateAssetTypeMutation.mutate({
                                            id: type.id,
                                            data: { name: editedTypeName.trim(), description: editedTypeDescription.trim() }
                                          });
                                        }}
                                        className="h-7 w-7 p-0"
                                        disabled={updateAssetTypeMutation.isPending}
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingTypeId(null);
                                          setEditedTypeName('');
                                          setEditedTypeDescription('');
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3 text-red-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0"
                                        onClick={() => startEditAssetType(type)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-red-600"
                                        onClick={() => handleDeleteAssetType(type.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>


                {/* Asset Brands Tab */}
                <TabsContent value="brands" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={translations.searchBrands}
                        value={assetBrandSearch}
                        onChange={(e) => setAssetBrandSearch(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <Dialog open={isAssetBrandDialogOpen} onOpenChange={setIsAssetBrandDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                        {translations.addBrand}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{translations.addAssetBrand}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{translations.brandName}</Label>
                          <Input 
                            value={newBrandName} 
                            onChange={(e) => setNewBrandName(e.target.value)}
                            placeholder={translations.brandNamePlaceholder}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{translations.description}</Label>
                          <Input 
                            value={newBrandDescription} 
                            onChange={(e) => setNewBrandDescription(e.target.value)}
                            placeholder={translations.descriptionPlaceholder}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAssetBrandDialogOpen(false)}>
                            {translations.cancel}
                          </Button>
                          <Button 
                            onClick={() => {
                              if (newBrandName.trim()) {
                                createAssetBrandMutation.mutate({
                                  name: newBrandName.trim(),
                                  description: newBrandDescription.trim()
                                });
                              }
                            }}
                            disabled={createAssetBrandMutation.isPending || !newBrandName.trim()}
                          >
                            {createAssetBrandMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translations.adding}
                              </>
                            ) : (
                              translations.add
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                  
                  <div className="border rounded-lg">
                    {!filteredAssetBrands?.length ? (
                      <div className="p-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {translations.noAssetBrands}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {translations.addBrandsMessage}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{translations.brandName}</TableHead>
                            <TableHead>{translations.description}</TableHead>
                            <TableHead className="w-20">{translations.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssetBrands.map((brand: any) => (
                            <TableRow key={brand.id}>
                              <TableCell className="font-medium">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandName}
                                    onChange={(e) => setEditedBrandName(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetBrandMutation.mutate({
                                          id: brand.id,
                                          data: { name: editedBrandName.trim(), description: editedBrandDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                ) : (
                                  brand.name
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandDescription}
                                    onChange={(e) => setEditedBrandDescription(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetBrandMutation.mutate({
                                          id: brand.id,
                                          data: { name: editedBrandName.trim(), description: editedBrandDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    placeholder="Description..."
                                  />
                                ) : (
                                  brand.description
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {editingBrandId === brand.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          updateAssetBrandMutation.mutate({
                                            id: brand.id,
                                            data: { name: editedBrandName.trim(), description: editedBrandDescription.trim() }
                                          });
                                        }}
                                        className="h-7 w-7 p-0"
                                        disabled={updateAssetBrandMutation.isPending}
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingBrandId(null);
                                          setEditedBrandName('');
                                          setEditedBrandDescription('');
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3 text-red-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0"
                                        onClick={() => startEditAssetBrand(brand)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-red-600"
                                        onClick={() => handleDeleteAssetBrand(brand.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>

                {/* Asset Statuses Tab */}
                <TabsContent value="statuses" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={translations.searchStatuses}
                        value={assetStatusSearch}
                        onChange={(e) => setAssetStatusSearch(e.target.value)}
                        className="w-48"
                      />
                    </div>
                  <Dialog open={isAssetStatusDialogOpen} onOpenChange={setIsAssetStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {translations.addStatus}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{translations.addAssetStatus}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{translations.statusName}</Label>
                          <Input 
                            value={newStatusName} 
                            onChange={(e) => setNewStatusName(e.target.value)}
                            placeholder={translations.statusNamePlaceholder}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{translations.description}</Label>
                          <Input 
                            value={newStatusDescription} 
                            onChange={(e) => setNewStatusDescription(e.target.value)}
                            placeholder={translations.briefDescription}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{translations.color}</Label>
                          <Input 
                            type="color"
                            value={newStatusColor} 
                            onChange={(e) => setNewStatusColor(e.target.value)}
                            className="h-10 w-20"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAssetStatusDialogOpen(false)}>
                            {translations.cancel}
                          </Button>
                          <Button 
                            onClick={() => {
                              if (newStatusName.trim()) {
                                createAssetStatusMutation.mutate({
                                  name: newStatusName.trim(),
                                  description: newStatusDescription.trim(),
                                  color: newStatusColor
                                });
                              }
                            }}
                            disabled={createAssetStatusMutation.isPending || !newStatusName.trim()}
                          >
                            {createAssetStatusMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translations.adding}
                              </>
                            ) : (
                              translations.add
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                  
                  <div className="border rounded-lg">
                    {!filteredAssetStatuses?.length ? (
                      <div className="p-8 text-center">
                        <Settings className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {translations.noAssetStatuses}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {translations.addAssetStatusesMessage}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{translations.statusName}</TableHead>
                            <TableHead>{translations.description}</TableHead>
                            <TableHead>{translations.color}</TableHead>
                            <TableHead className="w-20">{translations.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssetStatuses.map((status: any) => (
                            <TableRow key={status.id}>
                              <TableCell className="font-medium">
                                {editingStatusId === status.id ? (
                                  <Input
                                    value={editedStatusName}
                                    onChange={(e) => setEditedStatusName(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetStatusMutation.mutate({
                                          id: status.id,
                                          data: { name: editedStatusName.trim(), description: editedStatusDescription.trim(), color: editedStatusColor }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                ) : (
                                  status.name
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {editingStatusId === status.id ? (
                                  <Input
                                    value={editedStatusDescription}
                                    onChange={(e) => setEditedStatusDescription(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetStatusMutation.mutate({
                                          id: status.id,
                                          data: { name: editedStatusName.trim(), description: editedStatusDescription.trim(), color: editedStatusColor }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    placeholder="Description..."
                                  />
                                ) : (
                                  status.description
                                )}
                              </TableCell>
                              <TableCell>
                                {editingStatusId === status.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="color"
                                      value={editedStatusColor}
                                      onChange={(e) => setEditedStatusColor(e.target.value)}
                                      className="h-8 w-16"
                                    />
                                    <span className="text-xs text-gray-500">{editedStatusColor}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded border" 
                                      style={{ backgroundColor: status.color }}
                                    ></div>
                                    <span className="text-xs text-gray-500">{status.color}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {editingStatusId === status.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          updateAssetStatusMutation.mutate({
                                            id: status.id,
                                            data: { name: editedStatusName.trim(), description: editedStatusDescription.trim(), color: editedStatusColor }
                                          });
                                        }}
                                        className="h-7 w-7 p-0"
                                        disabled={updateAssetStatusMutation.isPending}
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingStatusId(null);
                                          setEditedStatusName('');
                                          setEditedStatusDescription('');
                                          setEditedStatusColor('#3B82F6');
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3 text-red-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0"
                                        onClick={() => startEditAssetStatus(status)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-red-600"
                                        onClick={() => handleDeleteAssetStatus(status.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                {translations.ticketConfiguration}
              </CardTitle>
              <CardDescription>
                {translations.ticketConfigDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categories Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {translations.categories}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={translations.searchCategories}
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {translations.addCategory}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{translations.addCategory}</DialogTitle>
                          <DialogDescription>
                            {translations.createCategoryDescription}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{translations.categoryName}</Label>
                            <Input 
                              value={newCategoryName} 
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder={translations.categoryNamePlaceholder}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{translations.description}</Label>
                            <Input 
                              value={newCategoryDescription} 
                              onChange={(e) => setNewCategoryDescription(e.target.value)}
                              placeholder={translations.categoryDescriptionPlaceholder}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => {
                              setIsCategoryDialogOpen(false);
                              setNewCategoryName('');
                              setNewCategoryDescription('');
                            }}>
                              {translations.cancel}
                            </Button>
                            <Button 
                              onClick={() => {
                                if (newCategoryName.trim()) {
                                  createCategoryMutation.mutate({
                                    name: newCategoryName.trim(),
                                    description: newCategoryDescription.trim()
                                  });
                                }
                              }}
                              disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                            >
                              {createCategoryMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {translations.adding}
                                </>
                              ) : (
                                language === 'English' ? 'Add' : 'إضافة'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="border rounded-lg bg-white shadow-sm">
                  {!filteredCategories?.length ? (
                    <div className="p-8 text-center">
                      <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {translations.noCategories}
                      </h3>
                      <p className="text-gray-600">
                        {translations.addCategoriesMessage}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">{translations.category}</TableHead>
                          <TableHead className="font-semibold">{translations.description}</TableHead>
                          <TableHead className="font-semibold w-32">{translations.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.map((category: any) => (
                          <TableRow key={category.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {editingCategoryId === category.id ? (
                                <Input
                                  value={editedCategoryName}
                                  onChange={(e) => setEditedCategoryName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateCategoryMutation.mutate({
                                        id: category.id,
                                        data: {
                                          name: editedCategoryName.trim(),
                                          description: editedCategoryDescription.trim()
                                        }
                                      });
                                    }
                                  }}
                                  className="h-8"
                                  autoFocus
                                />
                              ) : (
                                category.name
                              )}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {editingCategoryId === category.id ? (
                                <Input
                                  value={editedCategoryDescription}
                                  onChange={(e) => setEditedCategoryDescription(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateCategoryMutation.mutate({
                                        id: category.id,
                                        data: {
                                          name: editedCategoryName.trim(),
                                          description: editedCategoryDescription.trim()
                                        }
                                      });
                                    }
                                  }}
                                  className="h-8"
                                  placeholder="Description..."
                                />
                              ) : (
                                category.description
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {editingCategoryId === category.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        updateCategoryMutation.mutate({
                                          id: category.id,
                                          data: {
                                            name: editedCategoryName.trim(),
                                            description: editedCategoryDescription.trim()
                                          }
                                        });
                                      }}
                                      className="h-8 w-8 p-0"
                                      disabled={updateCategoryMutation.isPending}
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCategoryId(null);
                                        setEditedCategoryName('');
                                        setEditedCategoryDescription('');
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => startEditCategory(category)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteCategory(category.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {translations.emailConfiguration}
              </CardTitle>
              <CardDescription>
                {translations.emailConfigDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'SMTP Server Settings' : 'إعدادات خادم SMTP'}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'SMTP Host' : 'خادم SMTP'}</Label>
                    <Input
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'SMTP server hostname' : 'اسم خادم SMTP'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'SMTP Port' : 'منفذ SMTP'}</Label>
                    <Input
                      type="number"
                      value={emailPort}
                      onChange={(e) => setEmailPort(e.target.value)}
                      placeholder="587"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)' : 'المنافذ الشائعة: 587 (TLS)، 465 (SSL)، 25 (غير آمن)'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Username' : 'اسم المستخدم'}</Label>
                    <Input
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'SMTP authentication username' : 'اسم مستخدم التحقق من SMTP'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Password' : 'كلمة المرور'}</Label>
                    <Input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="your-app-password"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'SMTP authentication password or app password' : 'كلمة مرور SMTP أو كلمة مرور التطبيق'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني'}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'From Email Address' : 'عنوان البريد المرسل'}</Label>
                    <Input
                      type="email"
                      value={emailFromAddress}
                      onChange={(e) => setEmailFromAddress(e.target.value)}
                      placeholder="noreply@yourcompany.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Email address that appears as sender' : 'عنوان البريد الذي يظهر كمرسل'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'From Name' : 'اسم المرسل'}</Label>
                    <Input
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                      placeholder="SimpleIT System"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Display name for sent emails' : 'الاسم المعروض للرسائل المرسلة'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Use Secure Connection (TLS/SSL)' : 'استخدام اتصال آمن (TLS/SSL)'}</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-secure"
                        checked={emailSecure}
                        onChange={(e) => setEmailSecure(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="email-secure" className="text-sm">
                        {language === 'English' ? 'Enable secure connection' : 'تفعيل الاتصال الآمن'}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Recommended for most SMTP providers' : 'موصى به لمعظم مقدمي خدمة SMTP'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  {language === 'English' ? 'Common SMTP Configurations:' : 'تكوينات SMTP الشائعة:'}
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>Gmail:</strong> smtp.gmail.com:587 (TLS)</div>
                  <div><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)</div>
                  <div><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</div>
                  <div><strong>SendGrid:</strong> smtp.sendgrid.net:587 (TLS)</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={testEmailMutation.isPending || !emailHost || !emailUser}
                  className="min-w-32"
                >
                  {testEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Testing...' : 'جارٍ الاختبار...'}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Test Email' : 'اختبار البريد'}
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleSaveEmailConfig}
                  disabled={updateEmailConfigMutation.isPending}
                  className="min-w-32"
                >
                  {updateEmailConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Save Email Settings' : 'حفظ إعدادات البريد'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SystemConfig;
