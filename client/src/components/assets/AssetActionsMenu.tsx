import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Wrench, TrendingUp, FileText, Settings, ArrowUp } from 'lucide-react';
import MaintenanceForm from './MaintenanceForm';
import { UpgradeForm } from './UpgradeForm';

interface AssetActionsMenuProps {
  asset: {
    id: number;
    assetId: string;
    type: string;
    brand: string;
    modelName?: string;
    serialNumber?: string;
    status?: string;
  };
}

export function AssetActionsMenu({ asset }: AssetActionsMenuProps) {
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);

  const handleMaintenance = () => {
    setShowMaintenanceForm(true);
  };

  const handleUpgrade = () => {
    setShowUpgradeForm(true);
  };

  const handleViewHistory = () => {
    // Navigate to asset history page
    window.location.href = `/assets/${asset.id}/history`;
  };

  const handleViewReports = () => {
    // Navigate to reports page for this asset
    console.log('View reports for asset:', asset.assetId);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleMaintenance}>
            <Wrench className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleUpgrade}>
            <ArrowUp className="mr-2 h-4 w-4" />
            Request ITIL Upgrade
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleViewHistory}>
            <FileText className="mr-2 h-4 w-4" />
            View Asset History
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleViewReports}>
            <TrendingUp className="mr-2 h-4 w-4" />
            View Reports
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Asset Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Maintenance Form Dialog */}
      <MaintenanceForm
        open={showMaintenanceForm}
        onOpenChange={setShowMaintenanceForm}
        assetId={asset.id}
        assetInfo={{
          assetId: asset.assetId,
          type: asset.type,
          brand: asset.brand,
          modelName: asset.modelName,
          serialNumber: asset.serialNumber
        }}
      />

      {/* ITIL Upgrade Form Dialog */}
      <UpgradeForm
        open={showUpgradeForm}
        onOpenChange={setShowUpgradeForm}
        assetId={asset.id}
        assetInfo={{
          assetId: asset.assetId,
          type: asset.type,
          brand: asset.brand,
          modelName: asset.modelName,
          serialNumber: asset.serialNumber
        }}
      />
    </>
  );
}