import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// 定义用户角色类型
export type UserRole = 
  | 'applicant'      // 意向加盟商
  | 'franchisee'     // 已签约加盟商
  | 'hq_recruiter'   // 总部招商专员
  | 'hq_ops'         // 总部运营专员
  | 'hq_supervisor'  // 总部区域督导
  | 'hq_finance'     // 总部财务专员
  | 'admin';         // 系统管理员

// 定义用户配置文件类型
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  organization_name?: string;
  region?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// 定义认证上下文类型
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 获取当前会话
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('初始化认证状态时出错:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 获取用户配置文件
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('获取用户配置文件时出错:', error);
      setProfile(null);
    }
  };

  // 登录方法
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      return response;
    } catch (error) {
      console.error('登录时出错:', error);
      return { error: error as Error, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出方法
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('登出时出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新用户配置文件
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  // 检查用户是否拥有指定角色
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(profile.role);
    }
    
    return profile.role === roles;
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signOut,
    refreshProfile,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 使用认证上下文的钩子
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

// 受保护路由组件
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}> = ({ children, allowedRoles, redirectTo = '/login' }) => {
  const { user, profile, isLoading, hasRole } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // 检查用户是否已登录
      if (!user) {
        window.location.href = redirectTo;
        return;
      }

      // 如果指定了允许的角色，检查用户是否拥有这些角色
      if (allowedRoles && allowedRoles.length > 0) {
        if (!profile || !hasRole(allowedRoles)) {
          window.location.href = redirectTo;
          return;
        }
      }

      setIsAuthorized(true);
    }
  }, [user, profile, isLoading, allowedRoles, redirectTo, hasRole]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  return isAuthorized ? <>{children}</> : null;
};