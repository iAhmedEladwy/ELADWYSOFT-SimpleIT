import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

// Configure Local Strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password'
  },
  async (username: string, password: string, done) => {
    try {
      console.log(`Attempting authentication for username: ${username}`);
      
      // Get user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`User not found: ${username}`);
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      console.log(`User found: ${username}, verifying password`);
      
      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log(`Invalid password for user: ${username}`);
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      console.log(`Authentication successful for user: ${username}`);
      
      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
      
    } catch (error) {
      console.error('Authentication error:', error);
      return done(error);
    }
  }
));

// Serialize user for session storage
passport.serializeUser((user: any, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string | number, done) => {
  try {
    console.log('Deserializing user:', id);
    const user = await storage.getUser(id);
    if (!user) {
      console.log('User not found during deserialization:', id);
      return done(null, false);
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    console.log('User deserialized successfully:', user.username);
    done(null, userWithoutPassword);
  } catch (error) {
    console.error('Deserialization error:', error);
    done(error);
  }
});

export default passport;