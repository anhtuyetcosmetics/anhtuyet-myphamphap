import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { ten_nhan_vien: string; username: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (usernameOrEmail: string, password: string) => {
    try {
      console.log('=== Login Attempt ===');
      console.log('Input:', usernameOrEmail);
      
      // First, check if the input is a valid email
      const isEmail = usernameOrEmail.includes('@');
      
      if (isEmail) {
        console.log('Input is an email, trying direct sign in...');
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
          email: usernameOrEmail,
          password,
        });

        console.log('Direct sign in result:', { 
          success: !signInError,
          error: signInError?.message,
          data: signInData 
        });

        if (!signInError) {
          console.log('Direct sign in successful');
          toast({
            title: "Đăng nhập thành công",
            description: "Chào mừng bạn quay trở lại!",
          });
          return;
        }
      }

      // Now try to find the user by username
      console.log('Looking up username:', usernameOrEmail);
      
      // First, let's check if we can access the staff table at all
      const { data: allStaff, error: allStaffError } = await supabase
        .from('staff')
        .select('*')
        .limit(5);
      
      console.log('All staff data (first 5 rows):', {
        data: allStaff,
        error: allStaffError,
        query: 'select * from staff limit 5'
      });

      // Now try the username lookup
      const { data: staffData, error: staffError, count } = await supabase
        .from('staff')
        .select('email, username', { count: 'exact' })
        .ilike('username', usernameOrEmail);

      console.log('Raw staff lookup result:', { 
        data: staffData,
        error: staffError,
        count,
        query: `select email, username from staff where username ilike '${usernameOrEmail}'`
      });

      if (staffError) {
        console.error('Staff lookup error details:', {
          code: staffError.code,
          message: staffError.message,
          details: staffError.details,
          hint: staffError.hint
        });
        if (staffError.code === 'PGRST116') {
          console.log('No staff found with username:', usernameOrEmail);
          throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        }
        throw new Error('Lỗi hệ thống, vui lòng thử lại sau');
      }

      if (!staffData || staffData.length === 0) {
        // If no exact match, try to find all staff to see what usernames exist
        const { data: usernames, error: usernamesError } = await supabase
          .from('staff')
          .select('username')
          .limit(10);
        
        console.log('Available usernames:', {
          data: usernames?.map(s => s.username),
          error: usernamesError,
          query: 'select username from staff limit 10'
        });
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }

      const userData = staffData[0];
      console.log('Found user data:', userData);

      // Try to sign in with the found email
      console.log('Trying to sign in with email:', userData.email);
      const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      console.log('Final sign in result:', { 
        success: !signInError,
        error: signInError?.message,
        data: signInData 
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }

      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Lỗi đăng nhập",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: { ten_nhan_vien: string; username: string }) => {
    try {
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('staff')
        .select('username')
        .eq('username', userData.username)
        .single();

      if (existingUser) {
        throw new Error('Tên đăng nhập đã tồn tại');
      }

      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      if (signUpError) throw signUpError;

      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email để xác nhận tài khoản.",
      });
    } catch (error) {
      toast({
        title: "Lỗi đăng ký",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });
    } catch (error) {
      toast({
        title: "Lỗi đăng xuất",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 