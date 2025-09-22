import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Bug, 
  Shield, 
  Zap, 
  AlertTriangle,
  ChevronDown, 
  ChevronUp,
  Calendar,
  Tag,
  ArrowRight,
  CheckCircle2,
  Info,
  Star
} from 'lucide-react';
import { CHANGELOG_DATA, getLatestVersion, type ChangelogEntry } from '@/data/changelog-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export default function UserChangelog() {
  const { language } = useLanguage();
  const [expandedVersions, setExpandedVersions] = useState<string[]>([CHANGELOG_DATA[0]?.version || '']);
  const [filter, setFilter] = useState<'all' | 'features' | 'bugfixes' | 'security'>('all');
  const [lastViewedVersion, setLastViewedVersion] = useState<string>('');

  // Load last viewed version from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lastViewedChangelog');
    if (stored) {
      setLastViewedVersion(stored);
    }
    // Update last viewed version
    localStorage.setItem('lastViewedChangelog', getLatestVersion());
  }, []);

  // Translations
  const translations = {
    title: language === 'English' ? "What's New" : 'ما الجديد',
    subtitle: language === 'English' ? 'Latest updates and improvements' : 'آخر التحديثات والتحسينات',
    features: language === 'English' ? 'Features' : 'المميزات',
    improvements: language === 'English' ? 'Improvements' : 'التحسينات',
    bugfixes: language === 'English' ? 'Bug Fixes' : 'إصلاح الأخطاء',
    security: language === 'English' ? 'Security' : 'الأمان',
    breaking: language === 'English' ? 'Breaking Changes' : 'تغييرات مهمة',
    all: language === 'English' ? 'All Changes' : 'جميع التغييرات',
    version: language === 'English' ? 'Version' : 'الإصدار',
    released: language === 'English' ? 'Released' : 'تاريخ الإصدار',
    new: language === 'English' ? 'NEW' : 'جديد',
    latest: language === 'English' ? 'LATEST' : 'الأحدث',
    major: language === 'English' ? 'Major Release' : 'إصدار رئيسي',
    minor: language === 'English' ? 'Minor Release' : 'إصدار ثانوي',
    patch: language === 'English' ? 'Patch Release' : 'إصدار تصحيحي',
  };

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev =>
      prev.includes(version)
        ? prev.filter(v => v !== version)
        : [...prev, version]
    );
  };

  const getIconForChangeType = (type: string) => {
    switch (type) {
      case 'features': return <Sparkles className="h-4 w-4" />;
      case 'improvements': return <Zap className="h-4 w-4" />;
      case 'bugfixes': return <Bug className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'breaking': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getVersionBadgeColor = (type: string) => {
    switch (type) {
      case 'major': return 'bg-red-100 text-red-800 border-red-200';
      case 'minor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patch': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // No longer need filtering logic since we use TabsContent

  const isNewVersion = (version: string) => {
    if (!lastViewedVersion) return false;
    const versionIndex = CHANGELOG_DATA.findIndex(entry => entry.version === version);
    const lastViewedIndex = CHANGELOG_DATA.findIndex(entry => entry.version === lastViewedVersion);
    return lastViewedIndex > versionIndex || lastViewedIndex === -1;
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {translations.title}
        </h1>
        <p className="text-muted-foreground text-lg">{translations.subtitle}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Badge variant="outline" className="text-sm">
            <Tag className="h-3 w-3 mr-1" />
            {translations.version} {getLatestVersion()}
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {translations.all}
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {translations.features}
              </TabsTrigger>
              <TabsTrigger value="bugfixes" className="flex items-center gap-1">
                <Bug className="h-3 w-3" />
                {translations.bugfixes}
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {translations.security}
              </TabsTrigger>
            </TabsList>

            {/* All Changes Tab Content */}
            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {CHANGELOG_DATA.map((entry, index) => (
                  <Card key={entry.version} className="overflow-hidden">
                    <Collapsible
                      open={expandedVersions.includes(entry.version)}
                      onOpenChange={() => toggleVersion(entry.version)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-xl">
                                    {entry.title}
                                  </CardTitle>
                                  {index === 0 && (
                                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                      {translations.latest}
                                    </Badge>
                                  )}
                                  {isNewVersion(entry.version) && (
                                    <Badge variant="destructive">
                                      {translations.new}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <Badge variant="outline" className={getVersionBadgeColor(entry.type)}>
                                    v{entry.version}
                                  </Badge>
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(entry.date).toLocaleDateString()}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {translations[entry.type]}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              {expandedVersions.includes(entry.version) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-0">
                          <Separator />
                          
                          {/* Breaking Changes - Show prominently */}
                          {entry.changes.breaking && entry.changes.breaking.length > 0 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
                              <div className="flex items-center gap-2 text-red-800 font-semibold">
                                <AlertTriangle className="h-4 w-4" />
                                {translations.breaking}
                              </div>
                              <ul className="space-y-1 text-sm text-red-700">
                                {entry.changes.breaking.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Features */}
                          {entry.changes.features && entry.changes.features.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                                <Sparkles className="h-4 w-4" />
                                {translations.features}
                              </div>
                              <ul className="space-y-1 text-sm ml-6">
                                {entry.changes.features.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-muted-foreground">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvements */}
                          {entry.changes.improvements && entry.changes.improvements.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <Zap className="h-4 w-4" />
                                {translations.improvements}
                              </div>
                              <ul className="space-y-1 text-sm ml-6">
                                {entry.changes.improvements.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-muted-foreground">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Bug Fixes */}
                          {entry.changes.bugfixes && entry.changes.bugfixes.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-orange-600 font-semibold">
                                <Bug className="h-4 w-4" />
                                {translations.bugfixes}
                              </div>
                              <ul className="space-y-1 text-sm ml-6">
                                {entry.changes.bugfixes.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-muted-foreground">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Security */}
                          {entry.changes.security && entry.changes.security.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-purple-600 font-semibold">
                                <Shield className="h-4 w-4" />
                                {translations.security}
                              </div>
                              <ul className="space-y-1 text-sm ml-6">
                                {entry.changes.security.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-muted-foreground">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Features Tab Content */}
            <TabsContent value="features" className="mt-6">
              <div className="space-y-4">
                {CHANGELOG_DATA.filter(entry => entry.changes.features && entry.changes.features.length > 0).map((entry, index) => (
                  <Card key={entry.version} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">
                              {entry.title}
                            </CardTitle>
                            {index === 0 && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {translations.latest}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Badge variant="outline" className={getVersionBadgeColor(entry.type)}>
                              v{entry.version}
                            </Badge>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {entry.changes.features && entry.changes.features.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-blue-600 font-semibold">
                            <Sparkles className="h-4 w-4" />
                            {translations.features}
                          </div>
                          <ul className="space-y-1 text-sm ml-6">
                            {entry.changes.features.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Bug Fixes Tab Content */}
            <TabsContent value="bugfixes" className="mt-6">
              <div className="space-y-4">
                {CHANGELOG_DATA.filter(entry => entry.changes.bugfixes && entry.changes.bugfixes.length > 0).map((entry, index) => (
                  <Card key={entry.version} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">
                              {entry.title}
                            </CardTitle>
                            {index === 0 && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {translations.latest}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Badge variant="outline" className={getVersionBadgeColor(entry.type)}>
                              v{entry.version}
                            </Badge>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {entry.changes.bugfixes && entry.changes.bugfixes.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-orange-600 font-semibold">
                            <Bug className="h-4 w-4" />
                            {translations.bugfixes}
                          </div>
                          <ul className="space-y-1 text-sm ml-6">
                            {entry.changes.bugfixes.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Security Tab Content */}
            <TabsContent value="security" className="mt-6">
              <div className="space-y-4">
                {CHANGELOG_DATA.filter(entry => entry.changes.security && entry.changes.security.length > 0).map((entry, index) => (
                  <Card key={entry.version} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">
                              {entry.title}
                            </CardTitle>
                            {index === 0 && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {translations.latest}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Badge variant="outline" className={getVersionBadgeColor(entry.type)}>
                              v{entry.version}
                            </Badge>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {entry.changes.security && entry.changes.security.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-purple-600 font-semibold">
                            <Shield className="h-4 w-4" />
                            {translations.security}
                          </div>
                          <ul className="space-y-1 text-sm ml-6">
                            {entry.changes.security.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
