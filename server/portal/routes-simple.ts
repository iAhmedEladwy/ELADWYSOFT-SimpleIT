/**
 * Employee Portal API Routes
 * 
 * Context: SimpleIT v0.4.3 - Employee self-service portal endpoints
 * Tech Stack: Express 4.21.2, PostgreSQL, Drizzle ORM
 */

import { Router } from "express";
import { storage } from '../storage';
import { requireRole, ROLES } from '../rbac';
import type { AuthenticatedRequest } from '../rbac';

const router = Router();

/**
 * GET /api/portal/my-assets
 * Get all assets assigned to the authenticated employee
 */
router.get('/my-assets', 
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const employeeId = req.user?.employeeId;
      
      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const myAssets = await storage.getAssetsForEmployee(employeeId);
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
router.get('/my-tickets',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const employeeId = req.user?.employeeId;
      
      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const allTickets = await storage.getAllTickets();
      let myTickets = allTickets.filter(ticket => 
        ticket.submittedById === employeeId
      );

      // Optional filter by status
      const statusFilter = (req as any).query.status as string;
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
router.get('/my-tickets/:id',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const employeeId = req.user?.employeeId;
      const ticketId = parseInt((req as any).params.id);

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const ticket = await storage.getTicket(ticketId);

      if (!ticket) {
        return res.status(404).json({ 
          message: 'Ticket not found' 
        });
      }

      // Security: Verify ticket belongs to this employee
      if (ticket.submittedById !== employeeId) {
        return res.status(403).json({ 
          message: 'You do not have permission to view this ticket' 
        });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
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
router.post('/tickets',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const employeeId = req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const { 
        title, 
        description, 
        type, 
        categoryId,
        urgency, 
        impact,
        relatedAssetId 
      } = (req as any).body;

      // Validation
      if (!title || !description || !type || !categoryId) {
        return res.status(400).json({ 
          message: 'Missing required fields: title, description, type, categoryId' 
        });
      }

      // If relatedAssetId provided, verify it belongs to this employee
      if (relatedAssetId) {
        const asset = await storage.getAsset(relatedAssetId);
        if (!asset || asset.assignedEmployeeId !== employeeId) {
          return res.status(403).json({ 
            message: 'Asset not assigned to you' 
          });
        }
      }

      // Create ticket
      const ticketData = {
        title,
        description,
        type,
        categoryId,
        urgency: urgency || 'Medium',
        impact: impact || 'Medium',
        submittedById: employeeId,
        relatedAssetId: relatedAssetId || null,
        status: 'Open',
        assignedToId: null,
      };

      const newTicket = await storage.createTicket(ticketData);
      res.status(201).json(newTicket);
    } catch (error) {
      console.error('Error creating ticket:', error);
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
router.post('/my-tickets/:id/comments',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const employeeId = req.user?.employeeId;
      const userId = req.user?.id;
      const ticketId = parseInt((req as any).params.id);
      const { content } = (req as any).body;

      if (!employeeId || !userId) {
        return res.status(400).json({ 
          message: 'User information not found' 
        });
      }

      if (!content || content.trim() === '') {
        return res.status(400).json({ 
          message: 'Comment content is required' 
        });
      }

      // Verify ticket belongs to this employee
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ 
          message: 'Ticket not found' 
        });
      }

      if (ticket.submittedById !== employeeId) {
        return res.status(403).json({ 
          message: 'You do not have permission to comment on this ticket' 
        });
      }

      // Create comment using storage method
      const comment = await storage.addTicketComment({
        ticketId,
        userId,
        content: content.trim(),
        isPrivate: false
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ 
        message: 'Failed to create comment' 
      });
    }
  }
);

/**
 * GET /api/portal/my-profile
 * Get authenticated employee's profile information
 */
router.get('/my-profile',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const employeeId = req.user?.employeeId;

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const employee = await storage.getEmployee(employeeId);

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
 * GET /api/portal/my-assets/:assetId
 * Get details of a specific asset assigned to employee
 */
router.get('/my-assets/:assetId',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const employeeId = req.user?.employeeId;
      const assetId = parseInt((req as any).params.assetId);

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Employee ID not found for user' 
        });
      }

      const asset = await storage.getAsset(assetId);

      if (!asset) {
        return res.status(404).json({ 
          message: 'Asset not found' 
        });
      }

      // Security: Verify asset is assigned to this employee
      if (asset.assignedEmployeeId !== employeeId) {
        return res.status(403).json({ 
          message: 'This asset is not assigned to you' 
        });
      }

      res.json(asset);
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ 
        message: 'Failed to fetch asset' 
      });
    }
  }
);

/**
 * GET /api/portal/categories
 * Get all active ticket categories for ticket creation
 */
router.get('/categories',
  requireRole(ROLES.EMPLOYEE),
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const categories = await storage.getCategories();
      
      // Only return active categories
      const activeCategories = categories.filter((cat: any) => cat.isActive !== false);
      
      res.json(activeCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        message: 'Failed to fetch categories' 
      });
    }
  }
);

export default router;