import React from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Filter, MoreHorizontal, Copy } from 'lucide-react';

interface AuditLogTableProps {
  logs: any[];
  isLoading: boolean;
}

const getActionBadgeColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 text-green-800';
    case 'READ':
      return 'bg-blue-100 text-blue-800';
    case 'UPDATE':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    case 'LOGIN':
      return 'bg-purple-100 text-purple-800';
    case 'LOGOUT':
      return 'bg-gray-100 text-gray-800';
    case 'EXPORT':
      return 'bg-indigo-100 text-indigo-800';
    case 'IMPORT':
      return 'bg-cyan-100 text-cyan-800';
    case 'ASSIGN':
    case 'UNASSIGN':
      return 'bg-amber-100 text-amber-800';
    case 'CONFIG_CHANGE':
      return 'bg-violet-100 text-violet-800';
    case 'STATUS_CHANGE':
      return 'bg-emerald-100 text-emerald-800';
    case 'ERROR':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getEntityBadgeColor = (entityType: string) => {
  switch (entityType) {
    case 'USER':
      return 'bg-blue-100 text-blue-800';
    case 'EMPLOYEE':
      return 'bg-green-100 text-green-800';
    case 'ASSET':
      return 'bg-amber-100 text-amber-800';
    case 'TICKET':
      return 'bg-purple-100 text-purple-800';
    case 'ASSET_MAINTENANCE':
      return 'bg-orange-100 text-orange-800';
    case 'SYSTEM_CONFIG':
      return 'bg-indigo-100 text-indigo-800';
    case 'SESSION':
      return 'bg-teal-100 text-teal-800';
    case 'REPORT':
      return 'bg-cyan-100 text-cyan-800';
    case 'SOFTWARE_ASSET':
      return 'bg-emerald-100 text-emerald-800';
    case 'SERVICE_PROVIDER':
      return 'bg-violet-100 text-violet-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDetails = (details: any) => {
    if (!details) return 'No details available';
    
    try {
      if (typeof details === 'string') {
        try {
          // Try to parse if it's a stringified JSON
          const parsed = JSON.parse(details);
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          // If it's not valid JSON, return as is
          return details;
        }
      }
      return JSON.stringify(details, null, 2);
    } catch (error) {
      return 'Unable to display details';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Loading Audit Logs</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-pulse h-96 w-full bg-gray-100 rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Security audit trail for all system activities</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">No audit log entries found</p>
          <p className="text-gray-400 text-sm text-center mt-2">Adjust your filter criteria or check back later</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>Security audit trail for all system activities</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell>
                  {log.user ? log.user.username : 'System'}
                </TableCell>
                <TableCell>
                  <Badge className={getActionBadgeColor(log.action)} variant="outline">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getEntityBadgeColor(log.entityType)} variant="outline">
                    {log.entityType}
                  </Badge>
                </TableCell>
                <TableCell>{log.entityId || '-'}</TableCell>
                <TableCell className="max-w-md truncate font-mono text-xs">
                  {log.details ? (
                    <div className="cursor-pointer group relative" title="Click to view details">
                      <div className="truncate max-w-xs">
                        {typeof log.details === 'object' 
                          ? JSON.stringify(log.details).substring(0, 50) + '...' 
                          : String(log.details).substring(0, 50) + (String(log.details).length > 50 ? '...' : '')}
                      </div>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white p-3 rounded text-xs z-50 -top-2 left-0 ml-4 sm:left-full sm:ml-2 max-w-xs sm:max-w-md max-h-96 overflow-auto whitespace-pre-wrap">
                        <pre className="text-left">{formatDetails(log.details)}</pre>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => copyToClipboard(formatDetails(log.details))}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => 
                          copyToClipboard(
                            `ID: ${log.id}\nUser: ${log.user ? log.user.username : 'System'}\nAction: ${log.action}\nEntity: ${log.entityType}\nEntity ID: ${log.entityId || '-'}\nTimestamp: ${format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}\nDetails: ${formatDetails(log.details)}`
                          )
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}