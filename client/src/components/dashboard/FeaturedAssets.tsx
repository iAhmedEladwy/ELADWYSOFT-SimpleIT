import { useLanguage } from '@/hooks/use-language';

export default function FeaturedAssets() {
  const { language } = useLanguage();

  // Translations
  const translations = {
    featuredEquipment: language === 'English' ? 'Featured IT Equipment' : 'معدات تكنولوجيا المعلومات المميزة',
    macbookPro: language === 'English' ? 'MacBook Pro (2023)' : 'ماك بوك برو (2023)',
    macbookDesc: language === 'English' ? 'Premium laptop for design and development teams' : 'جهاز محمول متميز لفرق التصميم والتطوير',
    dellXPS: language === 'English' ? 'Dell XPS 15' : 'ديل XPS 15',
    dellDesc: language === 'English' ? 'High-performance laptop for business operations' : 'جهاز محمول عالي الأداء للعمليات التجارية',
    surfacePro: language === 'English' ? 'Surface Pro 9' : 'سيرفس برو 9',
    surfaceDesc: language === 'English' ? 'Versatile 2-in-1 device for mobile workers' : 'جهاز متعدد الاستخدامات 2 في 1 للعاملين المتنقلين',
    inInventory: language === 'English' ? 'in inventory' : 'في المخزون',
    each: language === 'English' ? 'each' : 'للوحدة',
  };

  // Featured equipment data
  const featuredEquipment = [
    {
      id: 1,
      name: translations.macbookPro,
      description: translations.macbookDesc,
      count: 42,
      price: 2199,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500',
    },
    {
      id: 2,
      name: translations.dellXPS,
      description: translations.dellDesc,
      count: 38,
      price: 1749,
      imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500',
    },
    {
      id: 3,
      name: translations.surfacePro,
      description: translations.surfaceDesc,
      count: 26,
      price: 1299,
      imageUrl: 'https://images.unsplash.com/photo-1537498425277-c283d32ef9db?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900">{translations.featuredEquipment}</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEquipment.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-48 object-cover" 
              />
              <div className="p-4">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{item.count} {translations.inInventory}</span>
                  <span className="text-xs font-medium text-primary">${item.price} {translations.each}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
