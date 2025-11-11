import { Router } from 'express';
import { db } from '../db';
import { notificationPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
router.get('/preferences', async (req, res) => {
  try {
    const user = req.user as AuthUser;
    
    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, user.id)
    });

    // If no preferences exist, create default ones
    if (!prefs) {
      const [newPrefs] = await db.insert(notificationPreferences).values({
        userId: user.id,
        ticketAssignments: true,
        ticketStatusChanges: true,
        assetAssignments: true,
        maintenanceAlerts: true,
        upgradeRequests: true,
        systemAnnouncements: true,
        employeeChanges: true,
      }).returning();
      prefs = newPrefs;
    }

    res.json(prefs);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the current user
 */
router.put('/preferences', async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const {
      ticketAssignments,
      ticketStatusChanges,
      assetAssignments,
      maintenanceAlerts,
      upgradeRequests,
      systemAnnouncements,
      employeeChanges,
    } = req.body;

    // Check if preferences exist
    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, user.id)
    });

    if (existing) {
      // Update existing preferences
      const [updated] = await db.update(notificationPreferences)
        .set({
          ticketAssignments,
          ticketStatusChanges,
          assetAssignments,
          maintenanceAlerts,
          upgradeRequests,
          systemAnnouncements,
          employeeChanges,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, user.id))
        .returning();
      
      res.json(updated);
    } else {
      // Create new preferences
      const [newPrefs] = await db.insert(notificationPreferences).values({
        userId: user.id,
        ticketAssignments,
        ticketStatusChanges,
        assetAssignments,
        maintenanceAlerts,
        upgradeRequests,
        systemAnnouncements,
        employeeChanges,
      }).returning();
      
      res.json(newPrefs);
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

export default router;
