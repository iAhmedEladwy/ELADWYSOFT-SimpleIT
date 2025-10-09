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
            message: 'User ID not found' 
          });
        }

        // Find the employee record for this user
        console.log(`[DEBUG my-assets] Looking for employee with userId: ${userId}`);
        const employees = await storage.getAllEmployees();
        console.log(`[DEBUG my-assets] Found ${employees.length} employees in database`);
        console.log(`[DEBUG my-assets] Employee userIds:`, employees.map(emp => emp.userId));
        
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          console.log(`[DEBUG my-assets] No employee found for userId: ${userId}`);
          return res.status(400).json({ 
            message: 'Employee record not found for user',
            debug: {
              userId,
              availableEmployees: employees.map(emp => ({ id: emp.id, userId: emp.userId, name: emp.englishName }))
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

        res.json(ticket);
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

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);
        if (!employee) {
          return res.status(400).json({ 
            message: 'Employee record not found for user' 
          });
        }
        const employeeId = employee.id;

        const ticketData = {
          ...req.body,
          submittedById: employeeId,
          status: 'Open',
          priority: req.body.priority || 'Medium'
        };

        const newTicket = await storage.createTicket(ticketData);
        res.status(201).json(newTicket);
      } catch (error) {
        console.error('Error creating employee ticket:', error);
        res.status(500).json({ 
          message: 'Failed to create ticket' 
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
      try {
        const userId = req.user?.id;
        const ticketId = parseInt(req.params.id);
        const { content } = req.body;

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

        if (!employeeId) {
          return res.status(400).json({ 
            message: 'Employee ID not found for user' 
          });
        }

        if (!content) {
          return res.status(400).json({ 
            message: 'Comment content is required' 
          });
        }

        // Verify ticket belongs to this employee
        const ticket = await storage.getTicket(ticketId);
        if (!ticket || ticket.submittedById !== employeeId) {
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

        // Note: Using addTicketComment method from storage layer
        const comment = await storage.addTicketComment(commentData);
        res.status(201).json(comment);
      } catch (error) {
        console.error('Error adding ticket comment:', error);
        res.status(500).json({ 
          message: 'Failed to add comment' 
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
            message: 'User ID not found' 
          });
        }

        // Find the employee record for this user
        const employees = await storage.getAllEmployees();
        const employee = employees.find(emp => emp.userId === userId);

        if (!employee) {
          return res.status(404).json({ 
            message: 'Employee profile not found' 
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
   * GET /api/portal/categories
   * Get all active ticket categories for ticket creation
   */
  app.get('/api/portal/categories',
    authenticateUser,
    requireRole(ROLES.EMPLOYEE),
    async (req: any, res: any) => {
      try {
        // This assumes a getTicketCategories method exists
        // If not, you may need to implement it or use a different approach
        const categories = await storage.getTicketCategories?.() || [
          { id: 1, name: 'Hardware Issue', nameAr: 'مشكلة في الأجهزة' },
          { id: 2, name: 'Software Issue', nameAr: 'مشكلة في البرامج' },
          { id: 3, name: 'Network Issue', nameAr: 'مشكلة في الشبكة' },
          { id: 4, name: 'Access Request', nameAr: 'طلب وصول' },
          { id: 5, name: 'Other', nameAr: 'أخرى' }
        ];

        res.json(categories);
      } catch (error) {
        console.error('Error fetching ticket categories:', error);
        res.status(500).json({ 
          message: 'Failed to fetch categories' 
        });
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
}