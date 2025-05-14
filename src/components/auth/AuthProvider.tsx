import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, UserRole } from '../../lib/supabase';

// 定义认证上下文的类型
type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
};

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件属性类型
type AuthProviderProps = {
  children: React.ReactNode;
};

// 认证提供者组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查会话状态
  useEffect(() => {
    // 获取当前会话
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // 如果有用户，获取用户角色
        if (currentSession?.user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', currentSession.user.id)
            .single();
          
          if (data && !error) {
            setUserRole(data.role as UserRole);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // 如果有用户，获取用户角色
        if (newSession?.user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', newSession.user.id)
            .single();
          
          if (data && !error) {
            setUserRole(data.role as UserRole);
          }
        } else {
          setUserRole(null);
        }
      }
    );

    // 组件卸载时取消订阅
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 登录方法
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      return { error: error as Error, success: false };
    }
  };

  // 登出方法
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // 提供认证上下文值
  const value = {
    session,
    user,
    userRole,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义钩子，用于在组件中访问认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};