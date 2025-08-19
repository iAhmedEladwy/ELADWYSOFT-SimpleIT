import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { compare } from 'bcrypt';
import { getStorage } from './storage-factory';

const storage = getStorage();

// Configure Local Strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password'
  },
  async (username: string, password: string, done) => {
    try {
      console.log(`[AUTH] Login attempt for username: ${username}`);
      
      // Get user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[AUTH] User not found: ${username}`);
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      console.log(`[AUTH] User found: ${username} (ID: ${user.id})`);
      
      // Check if user is active
      if (!user.isActive) {
        console.log(`[AUTH] User is inactive: ${username}`);
        return done(null, false, { message: 'Account is disabled' });
      }
      
      // Verify password
      if (!password || !user.password) {
        console.log(`[AUTH] Missing password data for user: ${username}`);
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      console.log(`[AUTH] Verifying password for user: ${username}`);
      console.log(`[AUTH] Password length: ${password.length}`);
      console.log(`[AUTH] Hash starts with: ${user.password.substring(0, 10)}...`);
      
      const isPasswordValid = await compare(password, user.password);
      console.log(`[AUTH] Password verification result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log(`[AUTH] Authentication failed for user: ${username}`);
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      console.log(`[AUTH] Authentication successful for user: ${username}`);
      
      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
      
    } catch (error) {
      console.error('[AUTH] Authentication error:', error);
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