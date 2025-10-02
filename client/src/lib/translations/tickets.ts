// Centralized Ticket Translations for v0.4.0
// This replaces all individual ticket translation objects across components

export interface TicketTranslations {
  // Page & Section Titles
  title: string;
  description: string;
  createTicket: string;
  editTicket: string;
  editTicketDescription: string;
  createNewTicketDescription: string;
  basicInformation: string;
  assignmentInformation: string;
  ticketDetails: string;
  updateResolution: string;
  addResolutionDetails: string;
  ticketLabel: string;
  reviewBeforeStatus: string;
  provideResolutionBeforeStatus: string;
  resolutionTip: string;
  
  // Ticket Fields
  ticketId: string;
  title_field: string; // renamed from summary
  description_field: string;
  type: string;
  category: string;
  priority: string;
  urgency: string;
  impact: string;
  status: string;
  submittedBy: string;
  assignedTo: string;
  relatedAsset: string;
  resolution: string;
  
  // Time Fields
  createdAt: string;
  updatedAt: string;
  completionTime: string;
  timeSpent: string;
  dueDate: string;
  slaTarget: string;
  
  // Status Values
  statusOpen: string;
  statusInProgress: string;
  statusResolved: string;
  statusClosed: string;
  
  // Type Values (Nature of Request)
  typeIncident: string;
  typeServiceRequest: string;
  typeProblem: string;
  typeChange: string;
  
  // Category Values
  categoryHardware: string;
  categorySoftware: string;
  categoryNetwork: string;
  categoryAccess: string;
  categoryOther: string;
  
  // Priority Values
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityCritical: string;
  
  // Urgency Values
  urgencyLow: string;
  urgencyMedium: string;
  urgencyHigh: string;
  urgencyCritical: string;
  
  // Impact Values
  impactLow: string;
  impactMedium: string;
  impactHigh: string;
  impactCritical: string;
  
  // Actions
  create: string;
  edit: string;
  save: string;
  cancel: string;
  delete: string;
  assign: string;
  resolve: string;
  close: string;
  deleteTicket: string;
  resolveTicket: string;
  deleteTicketConfirm: string;
  addResolution: string;
  resolutionNotes: string;
  saveResolution: string;
  reopen: string;
  refresh: string;
  search: string;
  filter: string;
  export: string;
  
  // Bulk Actions
  bulkActions: string;
  selectAll: string;
  deselectAll: string;
  changeStatus: string;
  assignTo: string;
  deleteSelected: string;
  
  // Messages
  ticketCreated: string;
  ticketUpdated: string;
  ticketDeleted: string;
  ticketAssigned: string;
  ticketResolved: string;
  ticketClosed: string;
    error: string;
    success: string;
    loading: string;
    noTickets: string;
    noTicketsSelected: string;
    errorUpdating: string;  // Filters
  allTickets: string;
  myTickets: string;
  openTickets: string;
  all: string;
  actions: string;
  viewDetails: string;
  assignToMe: string;
  unassignAction: string;
  selectedCount: string;

  assignmentClassification: string;
  timeManagement: string;
  minutesLabel: string;
  selectDueDate: string;
  selectSlaTarget: string;
  selectAssetDescription: string;
  noUserFound: string;
  addCommentPlaceholder: string;
  noHistoryEntries: string;
  systemUser: string;

  
  // Placeholders
  searchPlaceholder: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  resolutionPlaceholder: string;
  selectAssignee: string;
  selectAsset: string;
  selectType: string;
  selectCategory: string;
  selectPriority: string;
  selectUrgency: string;
  selectImpact: string;
  selectEmployee: string;
  selectUser: string;
  searchEmployee: string;
  noEmployeeFound: string;
  noDepartment: string;
  unassigned: string;
  noAsset: string;
  selectEmployeeFirst: string;
  selectAssetOptional: string;
  noAssetsForEmployee: string;
  selectStatus: string;
  
  // Validation Messages
  titleRequired: string;
  descriptionRequired: string;
  typeRequired: string;
  categoryRequired: string;
  
  // Comments & History
  comments: string;
  addComment: string;
  history: string;
  noComments: string;
  commentAdded: string;
  
  // SLA
  slaCompliant: string;
  slaAtRisk: string;
  slaBreached: string;
  
  // Responsive
  showing: string;
  to: string;
  of: string;
  results: string;
  page: string;
  previous: string;
  next: string;
  perPage: string;
  
  // Table display values  
  none: string;
}

export const ticketTranslations = {
  English: {
    // Page & Section Titles
    title: 'Support Tickets',
    description: 'Track and manage support requests',
    createTicket: 'Create Ticket',
    editTicket: 'Edit Ticket',
    editTicketDescription: 'Edit ticket details, status, and assignment information',
    createNewTicketDescription: 'Fill out the form below to create a new support ticket',
    basicInformation: 'Basic Information',
    assignmentInformation: 'Assignment & Classification',
    ticketDetails: 'Ticket Details',
    updateResolution: 'Update Resolution',
    addResolutionDetails: 'Add Resolution Details',
    ticketLabel: 'Ticket',
    reviewBeforeStatus: 'Review or update the resolution before marking this ticket as {status}',
    provideResolutionBeforeStatus: 'Please provide resolution details before marking this ticket as {status}',
    resolutionTip: 'Tip: You can update the resolution or leave it as is',
    
    // Ticket Fields
    ticketId: 'Ticket ID',
    title_field: 'Title',
    description_field: 'Description',
    type: 'Type',
    category: 'Category',
    priority: 'Priority',
    urgency: 'Urgency',
    impact: 'Impact',
    status: 'Status',
    submittedBy: 'Submitted By',
    assignedTo: 'Assigned To',
    relatedAsset: 'Related Asset',
    resolution: 'Resolution',
    
    // Time Fields
    createdAt: 'Created',
    updatedAt: 'Updated',
    completionTime: 'Completed',
    timeSpent: 'Time Spent',
    dueDate: 'Due Date',
    slaTarget: 'SLA Target',
    
    // Status Values
    statusOpen: 'Open',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    
    // Type Values (Nature of Request)
    typeIncident: 'Incident',
    typeServiceRequest: 'Service Request',
    typeProblem: 'Problem',
    typeChange: 'Change',
    
    // Category Values
    categoryHardware: 'Hardware',
    categorySoftware: 'Software',
    categoryNetwork: 'Network',
    categoryAccess: 'Access',
    categoryOther: 'Other',
    
    // Priority Values
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityCritical: 'Critical',
    
    // Urgency Values
    urgencyLow: 'Low',
    urgencyMedium: 'Medium',
    urgencyHigh: 'High',
    urgencyCritical: 'Critical',
    
    // Impact Values
    impactLow: 'Low',
    impactMedium: 'Medium',
    impactHigh: 'High',
    impactCritical: 'Critical',
    
    // Actions
    create: 'Create',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    assign: 'Assign',
    resolve: 'Resolve',
    close: 'Close',
    deleteTicket: 'Delete Ticket',
    resolveTicket: 'Resolve Ticket',
    deleteTicketConfirm: 'Are you sure you want to delete this ticket? This action cannot be undone.',
    addResolution: 'Add Resolution',
    resolutionNotes: 'Resolution Notes',
    saveResolution: 'Save Resolution',
    reopen: 'Reopen',
    refresh: 'Refresh',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Bulk Actions
    bulkActions: 'Bulk Actions',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    changeStatus: 'Change Status',
    assignTo: 'Assign To',
    deleteSelected: 'Delete Selected',
    
    // Messages
    ticketCreated: 'Ticket created successfully',
    ticketUpdated: 'Ticket updated successfully',
    ticketDeleted: 'Ticket deleted successfully',
    ticketAssigned: 'Ticket assigned successfully',
    ticketResolved: 'Ticket resolved successfully',
    ticketClosed: 'Ticket closed successfully',
    error: 'An error occurred',
    success: 'Success',
    loading: 'Loading...',
    noTickets: 'No tickets found',
    noTicketsSelected: 'No tickets selected',
    errorUpdating: 'Failed to update ticket',
    assignmentClassification: 'Assignment & Classification',
    timeManagement: 'Time Management',
    minutesLabel: 'minutes',
    selectDueDate: 'Select due date',
    selectSlaTarget: 'Select SLA target',
    selectAssetDescription: 'Optional: Select an asset related to this ticket',
    noUserFound: 'No user found.',
    addCommentPlaceholder: 'Add a comment...',
    noHistoryEntries: 'No history entries yet',
    systemUser: 'System',
    actions: 'Actions',
    viewDetails: 'View Details', 
    assignToMe: 'Assign to me',
    unassignAction: 'Unassign',
    selectedCount: 'selected',
  
    
    // Filters
    allTickets: 'All Tickets',
    myTickets: 'My Tickets',
    openTickets: 'Open Tickets',
    all: 'All',
    
    // Placeholders
    searchPlaceholder: 'Search tickets...',
    titlePlaceholder: 'Enter ticket title',
    descriptionPlaceholder: 'Describe the issue or request...',
    resolutionPlaceholder: 'Enter resolution details...',
    selectAssignee: 'Select assignee',
    selectAsset: 'Select related asset',
    selectEmployee: 'Select employee...',
    selectUser: 'Select user...',
    searchEmployee: 'Search employee...',
    noEmployeeFound: 'No employee found.',
    noDepartment: 'No department',
    unassigned: 'Unassigned',
    noAsset: 'No Asset',
    selectEmployeeFirst: 'Select employee first',
    selectAssetOptional: 'Select asset (optional)',
    noAssetsForEmployee: 'No assets assigned to this employee',
    selectType: 'Select type',
    selectCategory: 'Select category',
    selectPriority: 'Select priority',
    selectUrgency: 'Select urgency',
    selectImpact: 'Select impact',
    selectStatus: 'Select status',
    
    // Validation Messages
    titleRequired: 'Title is required',
    descriptionRequired: 'Description is required',
    typeRequired: 'Type is required',
    categoryRequired: 'Category is required',
    
    // Comments & History
    comments: 'Comments',
    addComment: 'Add Comment',
    history: 'History',
    noComments: 'No comments yet',
    commentAdded: 'Comment added successfully',
    
    // SLA
    slaCompliant: 'SLA Compliant',
    slaAtRisk: 'SLA At Risk',
    slaBreached: 'SLA Breached',
    
    // Responsive
    showing: 'Showing',
    to: 'to',
    of: 'of',
    results: 'results',
    page: 'Page',
    previous: 'Previous',
    next: 'Next',
    perPage: 'per page',
    
    // Table display values
    none: 'None',
  } as TicketTranslations,
  
  Arabic: {
    // Page & Section Titles
    title: 'تذاكر الدعم',
    description: 'تتبع وإدارة طلبات الدعم',
    createTicket: 'إنشاء تذكرة',
    editTicket: 'تعديل التذكرة',
    editTicketDescription: 'تعديل تفاصيل التذكرة والحالة والتعيين',
    createNewTicketDescription: 'املأ النموذج أدناه لإنشاء تذكرة دعم جديدة',
    basicInformation: 'المعلومات الأساسية',
    assignmentInformation: 'التعيين والتصنيف',
    ticketDetails: 'تفاصيل التذكرة',
    updateResolution: 'تحديث الحل',
    addResolutionDetails: 'إضافة تفاصيل الحل',
    ticketLabel: 'تذكرة',
    reviewBeforeStatus: 'راجع أو حدث الحل قبل تغيير حالة التذكرة إلى {status}',
    provideResolutionBeforeStatus: 'الرجاء تقديم تفاصيل الحل قبل تغيير حالة التذكرة إلى {status}',
    resolutionTip: 'نصيحة: يمكنك تحديث الحل أو تركه كما هو',
    
    // Ticket Fields
    ticketId: 'رقم التذكرة',
    title_field: 'العنوان',
    description_field: 'الوصف',
    type: 'النوع',
    category: 'الفئة',
    priority: 'الأولوية',
    urgency: 'الإلحاح',
    impact: 'التأثير',
    status: 'الحالة',
    submittedBy: 'مُقدم من',
    assignedTo: 'مُعين إلى',
    relatedAsset: 'الأصل المرتبط',
    resolution: 'الحل',
    
    // Time Fields
    createdAt: 'تاريخ الإنشاء',
    updatedAt: 'تاريخ التحديث',
    completionTime: 'تاريخ الإكمال',
    timeSpent: 'الوقت المُستغرق',
    dueDate: 'تاريخ الاستحقاق',
    slaTarget: 'هدف مستوى الخدمة',
    
    // Status Values
    statusOpen: 'مفتوح',
    statusInProgress: 'قيد التنفيذ',
    statusResolved: 'تم الحل',
    statusClosed: 'مغلق',
    
    // Type Values (Nature of Request)
    typeIncident: 'حادث',
    typeServiceRequest: 'طلب خدمة',
    typeProblem: 'مشكلة',
    typeChange: 'تغيير',
    
    // Category Values
    categoryHardware: 'الأجهزة',
    categorySoftware: 'البرمجيات',
    categoryNetwork: 'الشبكة',
    categoryAccess: 'الوصول',
    categoryOther: 'أخرى',
    
    // Priority Values
    priorityLow: 'منخفض',
    priorityMedium: 'متوسط',
    priorityHigh: 'عالي',
    priorityCritical: 'حرج',
    
    // Urgency Values
    urgencyLow: 'منخفض',
    urgencyMedium: 'متوسط',
    urgencyHigh: 'عالي',
    urgencyCritical: 'حرج',
    
    // Impact Values
    impactLow: 'منخفض',
    impactMedium: 'متوسط',
    impactHigh: 'عالي',
    impactCritical: 'حرج',
    
    // Actions
    create: 'إنشاء',
    edit: 'تعديل',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    assign: 'تعيين',
    resolve: 'حل',
    close: 'إغلاق',
    deleteTicket: 'حذف التذكرة',
    resolveTicket: 'حل التذكرة',
    deleteTicketConfirm: 'هل أنت متأكد من حذف هذه التذكرة؟ لا يمكن التراجع عن هذا الإجراء.',
    addResolution: 'إضافة حل',
    resolutionNotes: 'ملاحظات الحل',
    saveResolution: 'حفظ الحل',
    reopen: 'إعادة فتح',
    refresh: 'تحديث',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    
    // Bulk Actions
    bulkActions: 'إجراءات مجمعة',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء تحديد الكل',
    changeStatus: 'تغيير الحالة',
    assignTo: 'تعيين إلى',
    deleteSelected: 'حذف المحدد',
    
    // Messages
    ticketCreated: 'تم إنشاء التذكرة بنجاح',
    ticketUpdated: 'تم تحديث التذكرة بنجاح',
    ticketDeleted: 'تم حذف التذكرة بنجاح',
    ticketAssigned: 'تم تعيين التذكرة بنجاح',
    ticketResolved: 'تم حل التذكرة بنجاح',
    ticketClosed: 'تم إغلاق التذكرة بنجاح',
    error: 'حدث خطأ',
    success: 'نجح',
    loading: 'جاري التحميل...',
    noTickets: 'لا توجد تذاكر',
    noTicketsSelected: 'لم يتم تحديد تذاكر',
    errorUpdating: 'فشل في تحديث التذكرة',
    assignmentClassification: 'التخصيص والتصنيف',
    timeManagement: 'إدارة الوقت',
    minutesLabel: 'دقائق',
    selectDueDate: 'اختر تاريخ الاستحقاق',
    selectSlaTarget: 'اختر هدف مستوى الخدمة',
    selectAssetDescription: 'اختياري: اختر أصل متعلق بهذه التذكرة',
    noUserFound: 'لم يتم العثور على مستخدم.',
    addCommentPlaceholder: 'أضف تعليق...',
    noHistoryEntries: 'لا توجد إدخالات تاريخية بعد',
    systemUser: 'النظام',

    actions: 'الإجراءات',
    viewDetails: 'عرض التفاصيل',
    assignToMe: 'تعيين لي', 
    unassignAction: 'إلغاء التعيين',
    selectedCount: 'محدد',
      
    // Filters
    allTickets: 'جميع التذاكر',
    myTickets: 'تذاكري',
    openTickets: 'التذاكر المفتوحة',
    all: 'الكل',
    
    // Placeholders
    searchPlaceholder: 'البحث في التذاكر...',
    titlePlaceholder: 'أدخل عنوان التذكرة',
    descriptionPlaceholder: 'اوصف المشكلة أو الطلب...',
    resolutionPlaceholder: 'أدخل تفاصيل الحل...',
    selectAssignee: 'اختر المُعين',
    selectAsset: 'اختر الأصل المرتبط',
    selectEmployee: 'اختر الموظف...',
    selectUser: 'اختر المستخدم...',
    searchEmployee: 'البحث عن موظف...',
    noEmployeeFound: 'لم يتم العثور على موظف.',
    noDepartment: 'لا يوجد قسم',
    unassigned: 'غير مُعين',
    noAsset: 'بدون أصل',
    selectEmployeeFirst: 'اختر الموظف أولاً',
    selectAssetOptional: 'اختر الأصل (اختياري)',
    noAssetsForEmployee: 'لا توجد أصول مخصصة لهذا الموظف',
    selectType: 'اختر النوع',
    selectCategory: 'اختر الفئة',
    selectPriority: 'اختر الأولوية',
    selectUrgency: 'اختر الإلحاح',
    selectImpact: 'اختر التأثير',
    selectStatus: 'اختر الحالة',
    
    // Validation Messages
    titleRequired: 'العنوان مطلوب',
    descriptionRequired: 'الوصف مطلوب',
    typeRequired: 'النوع مطلوب',
    categoryRequired: 'الفئة مطلوبة',
    
    // Comments & History
    comments: 'التعليقات',
    addComment: 'إضافة تعليق',
    history: 'التاريخ',
    noComments: 'لا توجد تعليقات بعد',
    commentAdded: 'تم إضافة التعليق بنجاح',
    
    // SLA
    slaCompliant: 'متوافق مع مستوى الخدمة',
    slaAtRisk: 'مستوى الخدمة في خطر',
    slaBreached: 'تم انتهاك مستوى الخدمة',
    
    // Responsive
    showing: 'عرض',
    to: 'إلى',
    of: 'من',
    results: 'نتيجة',
    page: 'صفحة',
    previous: 'السابق',
    next: 'التالي',
    perPage: 'لكل صفحة',
    
    // Table display values
    none: 'لا يوجد',
  } as TicketTranslations,
};

// Hook to get ticket translations based on current language
export const useTicketTranslations = (language: 'English' | 'Arabic' = 'English'): TicketTranslations => {
  return ticketTranslations[language];
};