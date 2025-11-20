import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { compare } from 'bcrypt';
import { getStorage } from './storage-factory';
import { logger } from './services/logger';
import { autoLinkEmployeeToUser } from './services/employeeLinkService';

const storage = getStorage();

// Configure Local Strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password'
  },
  async (usernameOrEmail: string, password: string, done) => {
    try {
      console.log(`[AUTH] Login attempt for username/email: ${usernameOrEmail}`);
      
      // Try to get user by username first, then by email
      let user = await storage.getUserByUsername(usernameOrEmail);
      
      // If not found by username, try email
      if (!user && storage.getUserByEmail) {
        user = await storage.getUserByEmail(usernameOrEmail);
      }
      
      if (!user) {
        console.log(`[AUTH] User not found: ${usernameOrEmail}`);
        logger.warn('auth', `Failed login attempt - user not found: ${usernameOrEmail}`, {
          metadata: { username: usernameOrEmail, reason: 'user_not_found' }
        });
        return done(null, false, { message: 'Incorrect username/email or password' });
      }
      
      console.log(`[AUTH] User found: ${user.username} (ID: ${user.id})`);
      
      // Check if user is active
      if (!user.isActive) {
        console.log(`[AUTH] User is inactive: ${user.username}`);
        logger.warn('auth', `Login attempt for inactive account: ${user.username}`, {
          userId: user.id,
          metadata: { username: user.username, reason: 'account_disabled' }
        });
        return done(null, false, { message: 'Account is disabled' });
      }
      
      // Verify password
      if (!password || !user.password) {
        console.log(`[AUTH] Missing password data for user: ${user.username}`);
        logger.error('auth', `Missing password data for user: ${user.username}`, {
          userId: user.id,
          metadata: { username: user.username }
        });
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      console.log(`[AUTH] Verifying password for user: ${user.username}`);
      console.log(`[AUTH] Password length: ${password.length}`);
      console.log(`[AUTH] Hash starts with: ${user.password.substring(0, 10)}...`);
      
      const isPasswordValid = await compare(password, user.password);
      console.log(`[AUTH] Password verification result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log(`[AUTH] Authentication failed for user: ${user.username}`);
        logger.warn('auth', `Failed login attempt - invalid password: ${user.username}`, {
          userId: user.id,
          metadata: { username: user.username, reason: 'invalid_password' }
        });
        return done(null, false, { message: 'Incorrect username/email or password' });
      }
      
      console.log(`[AUTH] Authentication successful for user: ${user.username}`);
      logger.info('auth', `Successful login: ${user.username}`, {
        userId: user.id,
        metadata: { username: user.username, role: user.role }
      });
      
      // Attempt auto-linking to employee record
      try {
        const linkResult = await autoLinkEmployeeToUser(user);
        if (linkResult.success) {
          console.log(`[AUTO-LINK] ${linkResult.message}`);
          logger.info('employee_link', `Auto-linked user to employee: ${user.username}`, {
            userId: user.id,
            metadata: { 
              employeeId: linkResult.employee?.id,
              employeeName: linkResult.employee?.englishName,
              method: linkResult.method
            }
          });
        } else {
          console.log(`[AUTO-LINK] ${linkResult.message}`);
        }
      } catch (linkError) {
        console.error('[AUTO-LINK] Error during auto-linking:', linkError);
        // Don't fail login if auto-linking fails
      }
      
      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
      
    } catch (error) {
      console.error('[AUTH] Authentication error:', error);
      logger.error('auth', `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        metadata: { username: usernameOrEmail },
        error: error instanceof Error ? error : new Error(String(error))
      });
      return done(error);
    }
  }
));

// Serialize user for session storage
passport.serializeUser((user: any, done) => {
  console.log(`[AUTH] Serializing user: ${user.id}`);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string | number, done) => {
  try {
    console.log(`[AUTH] Deserializing user: ${id}`);
    const user = await storage.getUser(Number(id));
    
    if (!user) {
      console.log(`[AUTH] User not found during deserialization: ${id}`);
      return done(null, false);
    }
    
    if (!user.isActive) {
      console.log(`[AUTH] Inactive user during deserialization: ${id}`);
      return done(null, false);
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    console.log(`[AUTH] User deserialized successfully: ${user.username}`);
    done(null, userWithoutPassword);
    
  } catch (error) {
    console.error('[AUTH] Deserialization error:', error);
    done(error);
  }
});

export default passport;