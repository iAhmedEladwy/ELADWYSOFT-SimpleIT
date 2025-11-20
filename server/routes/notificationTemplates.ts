/**
 * Notification Templates Routes
 * Admin-only CRUD operations for notification templates
 */

import { Router } from 'express';
import { db } from '../db';
import { notificationTemplates } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole, ROLES } from '../rbac';
import { logger } from '../services/logger';

const router = Router();

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

/**
 * GET /api/notification-templates
 * Get all notification templates (Admin only)
 * Query params:
 *   - activeOnly: boolean - Return only active templates
 *   - category: string - Filter by category
 */
router.get('/', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const category = req.query.category as string;

    let query = db.select().from(notificationTemplates);

    // Apply filters
    const conditions: any[] = [];
    if (activeOnly) {
      conditions.push(eq(notificationTemplates.isActive, true));
    }
    if (category) {
      conditions.push(eq(notificationTemplates.category, category as any));
    }

    let templates;
    if (conditions.length > 0) {
      const { and } = await import('drizzle-orm');
      templates = await query.where(and(...conditions)).orderBy(desc(notificationTemplates.createdAt));
    } else {
      templates = await query.orderBy(desc(notificationTemplates.createdAt));
    }

    res.json(templates);
  } catch (error) {
    logger.error('notification-templates', 'Failed to fetch notification templates', {
      userId: (req.user as AuthUser).id,
      metadata: {},
      error: error instanceof Error ? error : new Error(String(error))
    });
    res.status(500).json({ error: 'Failed to fetch notification templates' });
  }
});

/**
 * GET /api/notification-templates/:id
 * Get a specific notification template by ID (Admin only)
 */
router.get('/:id', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const template = await db.query.notificationTemplates.findFirst({
      where: eq(notificationTemplates.id, templateId)
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    logger.error('notification-templates', 'Failed to fetch notification template', {
      userId: (req.user as AuthUser).id,
      metadata: { templateId: req.params.id },
      error: error instanceof Error ? error : new Error(String(error))
    });
    res.status(500).json({ error: 'Failed to fetch notification template' });
  }
});

/**
 * POST /api/notification-templates
 * Create a new notification template (Admin only)
 */
router.post('/', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const {
      name,
      description,
      category,
      type,
      priority,
      titleTemplate,
      messageTemplate,
      variables,
      isActive
    } = req.body;

    // Validation
    if (!name || !category || !type || !titleTemplate || !messageTemplate) {
      return res.status(400).json({ 
        error: 'Required fields: name, category, type, titleTemplate, messageTemplate' 
      });
    }

    // Ensure variables is an array
    const variablesArray = Array.isArray(variables) ? variables : [];

    // Create template
    const [template] = await db.insert(notificationTemplates)
      .values({
        name,
        description: description || null,
        category,
        type,
        priority: priority || 'medium',
        titleTemplate,
        messageTemplate,
        variables: variablesArray,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: user.id,
      })
      .returning();

    logger.info('notification-templates', `Created notification template: ${name}`, {
      userId: user.id,
      metadata: { templateId: template.id, name, category, type }
    });

    res.status(201).json(template);
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return res.status(409).json({ error: 'Template name already exists' });
    }

    logger.error('notification-templates', 'Failed to create notification template', {
      userId: (req.user as AuthUser).id,
      metadata: { name: req.body.name },
      error: error instanceof Error ? error : new Error(String(error))
    });
    res.status(500).json({ error: 'Failed to create notification template' });
  }
});

/**
 * PUT /api/notification-templates/:id
 * Update an existing notification template (Admin only)
 */
router.put('/:id', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const templateId = parseInt(req.params.id);

    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const {
      name,
      description,
      category,
      type,
      priority,
      titleTemplate,
      messageTemplate,
      variables,
      isActive
    } = req.body;

    // Check if template exists
    const existing = await db.query.notificationTemplates.findFirst({
      where: eq(notificationTemplates.id, templateId)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (titleTemplate !== undefined) updateData.titleTemplate = titleTemplate;
    if (messageTemplate !== undefined) updateData.messageTemplate = messageTemplate;
    if (variables !== undefined) updateData.variables = Array.isArray(variables) ? variables : [];
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update template
    const [updated] = await db.update(notificationTemplates)
      .set(updateData)
      .where(eq(notificationTemplates.id, templateId))
      .returning();

    logger.info('notification-templates', `Updated notification template: ${updated.name}`, {
      userId: user.id,
      metadata: { templateId, name: updated.name }
    });

    res.json(updated);
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return res.status(409).json({ error: 'Template name already exists' });
    }

    logger.error('notification-templates', 'Failed to update notification template', {
      userId: (req.user as AuthUser).id,
      metadata: { templateId: req.params.id },
      error: error instanceof Error ? error : new Error(String(error))
    });
    res.status(500).json({ error: 'Failed to update notification template' });
  }
});

/**
 * DELETE /api/notification-templates/:id
 * Delete a notification template (Admin only)
 * Note: This is a soft delete - sets isActive to false
 */
router.delete('/:id', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const templateId = parseInt(req.params.id);

    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Check if template exists
    const existing = await db.query.notificationTemplates.findFirst({
      where: eq(notificationTemplates.id, templateId)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Soft delete: set isActive to false
    await db.update(notificationTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(notificationTemplates.id, templateId));

    logger.info('notification-templates', `Deactivated notification template: ${existing.name}`, {
      userId: user.id,
      metadata: { templateId, name: existing.name }
    });

    res.json({ message: 'Template deactivated successfully' });
  } catch (error) {
    logger.error('notification-templates', 'Failed to delete notification template', {
      userId: (req.user as AuthUser).id,
      metadata: { templateId: req.params.id },
      error: error instanceof Error ? error : new Error(String(error))
    });
    res.status(500).json({ error: 'Failed to delete notification template' });
  }
});

/**
 * POST /api/notification-templates/:id/activate
 * Reactivate a deactivated template (Admin only)
 */
router.post('/:id/activate', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const templateId = parseInt(req.params.id);

    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const [updated] = await db.update(notificationTemplates)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(notificationTemplates.id, templateId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Template not found' });
    }

    logger.info('notification-templates', `Activated notification template: ${updated.name}`, {
      userId: user.id,
      metadata: { templateId, name: updated.name }
    });

    res.json(updated);
  } catch (error) {
    logger.error('notification-templates', 'Failed to activate notification template', {
      userId: (req.user as AuthUser).id,
      metadata: { templateId: req.params.id },
      error: error instanceof Error ? error : new Error(String(error))
    });
    res.status(500).json({ error: 'Failed to activate notification template' });
  }
});

/**
 * POST /api/notification-templates/:id/test
 * Test a template with sample variables (Admin only)
 */
router.post('/:id/test', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const { variables: testVariables } = req.body;

    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const template = await db.query.notificationTemplates.findFirst({
      where: eq(notificationTemplates.id, templateId)
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Replace variables in template
    let testTitle = template.titleTemplate;
    let testMessage = template.messageTemplate;

    if (testVariables && typeof testVariables === 'object') {
      for (const [key, value] of Object.entries(testVariables)) {
        const placeholder = `{{${key}}}`;
        testTitle = testTitle.replace(new RegExp(placeholder, 'g'), String(value));
        testMessage = testMessage.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }

    res.json({
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        type: template.type,
        priority: template.priority,
      },
      preview: {
        title: testTitle,
        message: testMessage,
      },
      variables: template.variables,
    });
  } catch (error) {
    logger.error('notification-templates', 'Failed to test notification template', {
      userId: (req.user as AuthUser).id,
      metadata: { templateId: req.params.id },
      error: error instanceof Error ? error : new Error(String(error))
    });
    res.status(500).json({ error: 'Failed to test notification template' });
  }
});

export default router;
