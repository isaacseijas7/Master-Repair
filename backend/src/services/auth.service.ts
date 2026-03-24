import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async login(credentials: any): Promise<AuthResponse> {
    const user = await User.findOne({ email: credentials.email }).select('+password');
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(user);
    const userResponse = user.toObject() as Omit<IUser, 'password'>;
    delete (userResponse as any).password;

    return { user: userResponse, token };
  }

  async register(userData: any): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const user = new User(userData);
    await user.save();

    const token = this.generateToken(user);
    const userResponse = user.toObject() as Omit<IUser, 'password'>;
    delete (userResponse as any).password;

    return { user: userResponse, token };
  }

  async getCurrentUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  private generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  async createInitialAdmin(): Promise<void> {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await this.register({
        email: 'admin@masterrepair.com',
        password: 'Admin123!',
        firstName: 'Administrador',
        lastName: 'Sistema',
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Usuario admin creado: admin@masterrepair.com / Admin123!');
    }
  }
}

export const authService = new AuthService();
