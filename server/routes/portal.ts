/**
 * Employee Portal API Routes
 * 
 * Context: SimpleIT v0.4.5 - Dedicated routes for employee self-service portal
 * 
 * All routes require EMPLOYEE role authentication and provide:
 * - Asset management (view assigned assets, report issues)
 * - Ticket management (view, create, update employee's tickets) 
 * - Profile management (view employee information)
 * - Support for bilingual system (English/Arabic)
 */

import { getStorage } from '../storage-factory';
import { ROLES } from '../rbac';
import { autoLinkEmployeeToUser } from '../services/employeeLinkService';

const storage = getStorage();

// Import middleware from main routes (these should ideally be in separate middleware files)
// For now, we'll assume these are available via import or passed as parameters

export function setupPortalRoutes(app: any, authenticateUser: any, requireRole: any) {
  // ==========================================
  // EMPLOYEE PORTAL API ROUTES
  // ==========================================
  
  /**
   * GET /api/portal/my-assets
   * Get all assets assigned to the authenticated employee
   */
  app.get('/api/portal/my-assets', 
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found',
            help: 'Please ensure you are logged in properly'
          });
        }

        // Attempt auto-linking if not already linked
        console.log(`[DEBUG my-assets] Checking employee link for userId: ${userId}`);
        await autoLinkEmployeeToUser(req.user);

        // Find the employee record for this user
        console.log(`[DEBUG my-assets] Looking for employee with userId: ${userId}`);
        const employees = await storage.getAllEmployees();
        console.log(`[DEBUG my-assets] Found ${employees.length} employees in database`);
        console.log(`[DEBUG my-assets] Employee userIds:`, employees.map(emp => emp.userId));
        
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          console.log(`[DEBUG my-assets] No employee found for userId: ${userId}`);
          return res.status(404).json({ 
            message: 'Employee record not found. You may need to be set up as an employee first.',
            help: 'Contact your administrator to link your user account to an employee record.',
            debug: {
              userId,
              userRole: req.user?.role,
              availableEmployees: employees.map(emp => ({ 
                id: emp.id, 
                userId: emp.userId, 
                name: emp.englishName,
                hasUser: !!emp.userId
              }))
            }
          });
        }
        
        console.log(`[DEBUG my-assets] Found employee:`, { id: employee.id, name: employee.englishName, userId: employee.userId });
        const myAssets = await storage.getAssetsForEmployee(employee.id);
        res.json(myAssets);
      } catch (error) {
        console.error('Error fetching employee assets:', error);
        res.status(500).json({ 
          message: 'Failed to fetch assets' 
        });
      }
    }
  );

  /**
   * GET /api/portal/my-tickets
   * Get all tickets submitted by the authenticated employee
   */
  app.get('/api/portal/my-tickets',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found',
            help: 'Please ensure you are logged in properly'
          });
        }

        // Attempt auto-linking if not already linked
        await autoLinkEmployeeToUser(req.user);

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          return res.status(404).json({ 
            message: 'Employee record not found. You may need to be set up as an employee first.',
            help: 'Contact your administrator to link your user account to an employee record.'
          });
        }

        const allTickets = await storage.getAllTickets();
        let myTickets = allTickets.filter(ticket => 
          ticket.submittedById === employee.id
        );

        // Optional filter by status
        const statusFilter = req.query.status as string;
        if (statusFilter) {
          myTickets = myTickets.filter(ticket => 
            ticket.status === statusFilter
          );
        }

        res.json(myTickets);
      } catch (error) {
        console.error('Error fetching employee tickets:', error);
        res.status(500).json({ 
          message: 'Failed to fetch tickets' 
        });
      }
    }
  );

  /**
   * GET /api/portal/my-tickets/:id
   * Get a specific ticket by ID (only if submitted by employee)
   */
  app.get('/api/portal/my-tickets/:id',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        const ticketId = parseInt(req.params.id);

        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found' 
          });
        }

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          return res.status(400).json({ 
            message: 'Employee record not found for user' 
          });
        }
        const employeeId = employee.id;

        const ticket = await storage.getTicket(ticketId);

        if (!ticket) {
          return res.status(404).json({ 
            message: 'Ticket not found' 
          });
        }

        // Security: Verify ticket belongs to this employee
        if (ticket.submittedById !== employeeId) {
          return res.status(403).json({ 
            message: 'Access denied: Ticket does not belong to you' 
          });
        }

        // Fetch comments for this ticket
        const comments = await storage.getTicketComments(ticketId);
        
        console.log('[DEBUG] Fetching ticket with comments - Ticket ID:', ticketId, 'Comments count:', comments?.length || 0);

        res.json({
          ...ticket,
          comments: comments || []
        });
      } catch (error) {
        console.error('Error fetching employee ticket:', error);
        res.status(500).json({ 
          message: 'Failed to fetch ticket' 
        });
      }
    }
  );

  /**
   * POST /api/portal/tickets
   * Create a new ticket for the authenticated employee
   */
  app.post('/api/portal/tickets',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found' 
          });
        }

        // Attempt auto-linking if not already linked
        await autoLinkEmployeeToUser(req.user);

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          return res.status(400).json({ 
            message: 'Employee record not found for user' 
          });
        }
        const employeeId = employee.id;

        // Validate required fields
        if (!req.body.title) {
          return res.status(400).json({ message: 'Title is required' });
        }
        if (!req.body.description) {
          return res.status(400).json({ message: 'Description is required' });
        }
        if (!req.body.type) {
          return res.status(400).json({ message: 'Type is required' });
        }

        // Parse and validate categoryId
        let categoryId = null;
        if (req.body.categoryId) {
          const parsedCategoryId = parseInt(req.body.categoryId);
          if (isNaN(parsedCategoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
          }
          categoryId = parsedCategoryId;
        }

        // Parse and validate relatedAssetId
        let relatedAssetId = null;
        if (req.body.relatedAssetId && req.body.relatedAssetId !== 'none') {
          const parsedAssetId = parseInt(req.body.relatedAssetId);
          if (!isNaN(parsedAssetId)) {
            relatedAssetId = parsedAssetId;
          }
        }

        const ticketData = {
          title: req.body.title,
          description: req.body.description,
          type: req.body.type,
          categoryId,
          urgency: req.body.urgency || 'Medium',
          impact: req.body.impact || 'Medium',
          priority: req.body.priority || 'Medium',
          relatedAssetId,
          submittedById: employeeId,
          status: 'Open'
        };

        const newTicket = await storage.createTicket(ticketData);
        res.status(201).json(newTicket);
      } catch (error: any) {
        console.error('Error creating employee ticket:', error);
        res.status(500).json({ 
          message: 'Failed to create ticket',
          error: error?.message || String(error)
        });
      }
    }
  );

  /**
   * POST /api/portal/my-tickets/:id/comments
   * Add a comment to employee's own ticket
   */
  app.post('/api/portal/my-tickets/:id/comments',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      console.log('=== PORTAL ADD COMMENT ENDPOINT HIT ===');
      try {
        console.log('[DEBUG add comment] Request params:', req.params);
        console.log('[DEBUG add comment] Request body:', req.body);
        
        const userId = req.user?.id;
        const ticketId = parseInt(req.params.id);
        const { content } = req.body;

        if (!userId) {
          console.log('[DEBUG add comment] No user ID found');
          return res.status(400).json({ 
            message: 'User ID not found' 
          });
        }

        console.log('[DEBUG add comment] User ID:', userId, 'Ticket ID:', ticketId);

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          console.log('[DEBUG add comment] No employee found for userId:', userId);
          return res.status(400).json({ 
            message: 'Employee record not found for user' 
          });
        }
        const employeeId = employee.id;
        console.log('[DEBUG add comment] Found employee:', employeeId);

        if (!employeeId) {
          return res.status(400).json({ 
            message: 'Employee ID not found for user' 
          });
        }

        if (!content) {
          console.log('[DEBUG add comment] No content provided');
          return res.status(400).json({ 
            message: 'Comment content is required' 
          });
        }

        // Verify ticket belongs to this employee
        const ticket = await storage.getTicket(ticketId);
        console.log('[DEBUG add comment] Ticket found:', ticket ? ticket.id : 'none', 'Submitted by:', ticket?.submittedById);
        
        if (!ticket || ticket.submittedById !== employeeId) {
          console.log('[DEBUG add comment] Access denied - ticket does not belong to employee');
          return res.status(403).json({ 
            message: 'Access denied: Ticket does not belong to you' 
          });
        }

        const commentData = {
          ticketId,
          userId,
          content,
          createdAt: new Date()
        };

        console.log('[DEBUG add comment] Comment data to create:', commentData);
        
        // Note: Using addTicketComment method from storage layer
        const comment = await storage.addTicketComment(commentData);
        console.log('[DEBUG add comment] Comment created successfully:', comment);
        
        res.status(201).json(comment);
      } catch (error: any) {
        console.error('[ERROR] Error adding ticket comment:', error);
        console.error('[ERROR] Error message:', error?.message);
        console.error('[ERROR] Error stack:', error?.stack);
        res.status(500).json({ 
          message: 'Failed to add comment',
          error: error?.message || String(error)
        });
      }
    }
  );

  /**
   * PATCH /api/portal/my-profile
   * Update employee contact information (personal email, personal mobile)
   */
  app.patch('/api/portal/my-profile',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        const { personalEmail, personalMobile } = req.body;
        
        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found',
            help: 'Please ensure you are logged in properly'
          });
        }

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find((emp: any) => emp.userId === userId);

        if (!employee) {
          return res.status(404).json({ 
            message: 'Employee record not found for this user',
            help: 'Please contact your system administrator to link your user account to an employee record'
          });
        }

        // Update employee record
        const updatedEmployee = {
          ...employee,
          personalEmail: personalEmail || employee.personalEmail,
          personalMobile: personalMobile || employee.personalMobile,
          updatedAt: new Date().toISOString()
        };

        await storage.updateEmployee(employee.id, updatedEmployee);
        
        res.json({ 
          message: 'Profile updated successfully',
          employee: updatedEmployee 
        });
      } catch (error) {
        console.error('Error updating employee profile:', error);
        res.status(500).json({ 
          message: 'Failed to update profile' 
        });
      }
    }
  );

  /**
   * PUT /api/portal/change-password  
   * Change user password
   */
  app.put('/api/portal/change-password',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found',
            help: 'Please ensure you are logged in properly'
          });
        }

        if (!currentPassword || !newPassword) {
          return res.status(400).json({ 
            message: 'Current password and new password are required' 
          });
        }

        // Get user record
        const users = await storage.getAllUsers();
        const user = users.find((u: any) => u.id === userId);

        if (!user) {
          return res.status(404).json({ 
            message: 'User not found' 
          });
        }

        // Verify current password (this depends on your password hashing implementation)
        // For now, assuming bcrypt is used
        const bcrypt = require('bcrypt');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ 
            message: 'Current password is incorrect' 
          });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        const updatedUser = {
          ...user,
          password: hashedNewPassword,
          updatedAt: new Date().toISOString()
        };

        await storage.updateUser(userId, updatedUser);
        
        res.json({ 
          message: 'Password updated successfully' 
        });
      } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
          message: 'Failed to change password' 
        });
      }
    }
  );

  /**
   * GET /api/portal/my-profile
   * Get authenticated employee's profile information
   */
  app.get('/api/portal/my-profile',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found',
            help: 'Please ensure you are logged in properly'
          });
        }

        // Attempt auto-linking if not already linked
        await autoLinkEmployeeToUser(req.user);

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);

        if (!employee) {
          return res.status(404).json({ 
            message: 'Employee profile not found. You may need to be set up as an employee first.',
            help: 'Contact your administrator to link your user account to an employee record.'
          });
        }

        res.json(employee);
      } catch (error) {
        console.error('Error fetching employee profile:', error);
        res.status(500).json({ 
          message: 'Failed to fetch profile' 
        });
      }
    }
  );

  /**
   * GET /api/portal/dashboard-stats
   * Get dashboard statistics for authenticated employee
   */
  app.get('/api/portal/dashboard-stats',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found',
            help: 'Please ensure you are logged in properly'
          });
        }

        // Attempt auto-linking if not already linked
        await autoLinkEmployeeToUser(req.user);

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find((emp: any) => emp.userId === userId);

        if (!employee) {
          return res.status(404).json({ 
            message: 'Employee record not found for this user',
            help: 'Please contact your system administrator to link your user account to an employee record'
          });
        }

        // Get employee's assets
        const myAssets = await storage.getAssetsForEmployee(employee.id);
        
        // Count assets by type
        const assetsByType: { [key: string]: number } = {};
        myAssets.forEach((asset: any) => {
          const type = asset.type || 'Other';
          assetsByType[type] = (assetsByType[type] || 0) + 1;
        });

        // Get employee's tickets
        const allTickets = await storage.getAllTickets();
        const myTickets = allTickets.filter((ticket: any) => ticket.submittedById === employee.id);

        // Count tickets by status
        const ticketsByStatus = {
          open: myTickets.filter((t: any) => t.status === 'Open').length,
          inProgress: myTickets.filter((t: any) => t.status === 'In Progress').length,
          resolved: myTickets.filter((t: any) => t.status === 'Resolved' || t.status === 'Closed').length,
          total: myTickets.length
        };

        // Get recent activity (last 5 tickets or asset assignments)
        const recentActivity = [];
        
        // Add recent tickets
        const recentTickets = myTickets
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
          
        recentTickets.forEach((ticket: any) => {
          recentActivity.push({
            type: 'ticket',
            description: `Created ticket: ${ticket.title}`,
            timestamp: ticket.createdAt
          });
        });

        // Add recent asset assignments
        const recentAssets = myAssets
          .filter((asset: any) => asset.assignedAt)
          .sort((a: any, b: any) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
          .slice(0, 2);
          
        recentAssets.forEach((asset: any) => {
          recentActivity.push({
            type: 'asset',
            description: `Asset assigned: ${asset.assetId} (${asset.type})`,
            timestamp: asset.assignedAt
          });
        });

        // Sort all activity by timestamp
        recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const dashboardStats = {
          assetsCount: {
            total: myAssets.length,
            byType: assetsByType
          },
          ticketsCount: ticketsByStatus,
          recentActivity: recentActivity.slice(0, 5)
        };

        res.json(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
          message: 'Failed to fetch dashboard statistics' 
        });
      }
    }
  );

  /**
   * GET /api/portal/categories
   * Get all active ticket categories for ticket creation
   */
  app.get('/api/portal/categories',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        console.log('[DEBUG categories] Fetching categories from storage...');
        // Fetch active categories from storage (getCategories already filters by isActive)
        let categories = await storage.getCategories();
        
        // If no categories exist, create default ones (same as main module)
        if (categories.length === 0) {
          console.log('[DEBUG categories] No categories found, creating defaults...');
          const defaultCategories = [
            { name: "Hardware", description: "Hardware-related issues and requests" },
            { name: "Software", description: "Software installation and application support" },
            { name: "Network", description: "Network connectivity and infrastructure issues" },
            { name: "Access Control", description: "User access and permission requests" },
            { name: "Security", description: "Security incidents and compliance issues" }
          ];
          
          for (const category of defaultCategories) {
            await storage.createCategory(category);
          }
          
          categories = await storage.getCategories();
          console.log('[DEBUG categories] Created default categories:', categories);
        }
        
        console.log('[DEBUG categories] Returning categories:', categories);
        res.json(categories);
      } catch (error) {
        console.error('Error fetching ticket categories:', error);
        // Fallback to default categories if database query fails
        const fallbackCategories = [
          { id: 1, name: 'Hardware', isActive: true },
          { id: 2, name: 'Software', isActive: true },
          { id: 3, name: 'Network', isActive: true },
          { id: 4, name: 'Access Control', isActive: true },
          { id: 5, name: 'Security', isActive: true }
        ];
        console.log('[DEBUG categories] Using fallback categories');
        res.json(fallbackCategories);
      }
    }
  );

  /**
   * PUT /api/portal/my-tickets/:id
   * Update employee's own ticket (limited fields)
   */
  app.put('/api/portal/my-tickets/:id',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        const ticketId = parseInt(req.params.id);

        if (!userId) {
          return res.status(400).json({ 
            message: 'User ID not found' 
          });
        }

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          return res.status(400).json({ 
            message: 'Employee record not found for user' 
          });
        }
        const employeeId = employee.id;

        // Verify ticket belongs to this employee
        const ticket = await storage.getTicket(ticketId);
        if (!ticket || ticket.submittedById !== employeeId) {
          return res.status(403).json({ 
            message: 'Access denied: Ticket does not belong to you' 
          });
        }

        // Only allow updating certain fields
        const allowedUpdates = {
          title: req.body.title,
          description: req.body.description,
          priority: req.body.priority
        };

        // Filter out undefined values
        const updateData = Object.fromEntries(
          Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
        );

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ 
            message: 'No valid fields to update' 
          });
        }

        const updatedTicket = await storage.updateTicket(ticketId, updateData);
        res.json(updatedTicket);
      } catch (error) {
        console.error('Error updating employee ticket:', error);
        res.status(500).json({ 
          message: 'Failed to update ticket' 
        });
      }
    }
  );

  // Debug endpoint for employee status checking
  app.get('/api/portal/debug/employee-status',
    authenticateUser,
    async (req: any, res: any) => {
      try {
        const user = req.user as any;
        if (!user) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === user.id);
        
        res.json({
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          },
          hasEmployeeRecord: !!employee,
          employee: employee || null,
          allEmployees: employees.map(emp => ({ 
            id: emp.id, 
            userId: emp.userId, 
            name: emp.englishName 
          }))
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to check employee status' });
      }
    }
  );

  // Helper endpoint to link current user to an employee record (for testing)
  app.post('/api/portal/debug/link-employee',
    authenticateUser,
    async (req: any, res: any) => {
      try {
        const user = req.user as any;
        if (!user) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        const { employeeId } = req.body;
        if (!employeeId) {
          return res.status(400).json({ message: "Employee ID required" });
        }

        // Update the employee record to link to this user
        const employee = await storage.getEmployee(employeeId);
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }

        // Update employee with userId
        await storage.updateEmployee(employeeId, { userId: user.id });
        
        res.json({ 
          message: 'Employee linked successfully',
          employee: { ...employee, userId: user.id }
        });
      } catch (error) {
        console.error('Error linking employee:', error);
        res.status(500).json({ error: 'Failed to link employee' });
      }
    }
  );

  /**
   * GET /api/portal/asset-details/:assetId
   * Get detailed asset information including history, maintenance, and related tickets
   */
  app.get('/api/portal/asset-details/:assetId',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        const userId = req.user?.id;
        const { assetId } = req.params;
        
        if (!userId) {
          return res.status(400).json({ message: 'User ID not found' });
        }

        // Verify employee access to this asset
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);
        
        if (!employee) {
          return res.status(404).json({ message: 'Employee record not found' });
        }

        // Get asset and verify it's assigned to this employee
        const asset = await storage.getAsset(assetId);
        if (!asset) {
          return res.status(404).json({ message: 'Asset not found' });
        }

        if (asset.assignedTo !== employee.id) {
          return res.status(403).json({ message: 'Asset not assigned to you' });
        }

        // Get asset assignment history - simplified for now
        const assignmentHistory = [
          {
            id: 1,
            assignedAt: asset.assignedAt || new Date().toISOString(),
            assignedByName: 'System Admin',
            notes: 'Initial assignment'
          }
        ];

        // Get maintenance records - simplified for now  
        const maintenanceRecords: any[] = [];

        // Get related tickets - get all tickets for this employee and filter by asset
        const allTickets = await storage.getAllTickets();
        const relatedTickets = allTickets.filter(ticket => 
          ticket.employeeId === employee.id && 
          ticket.description?.includes(asset.name)
        );

        const assetDetails = {
          assignmentHistory: assignmentHistory.map((record: any) => ({
            id: record.id,
            assignedAt: record.assignedAt,
            assignedBy: { name: record.assignedByName },
            notes: record.notes
          })),
          maintenanceRecords: maintenanceRecords.map((record: any) => ({
            id: record.id,
            type: record.type,
            description: record.description,
            performedAt: record.performedAt,
            performedBy: { name: record.performedByName },
            cost: record.cost
          })),
          relatedTickets: relatedTickets.map((ticket: any) => ({
            id: ticket.id,
            ticketId: ticket.ticketId,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt
          }))
        };

        res.json(assetDetails);
      } catch (error) {
        console.error('Error fetching asset details:', error);
        res.status(500).json({ error: 'Failed to fetch asset details' });
      }
    }
  );
}