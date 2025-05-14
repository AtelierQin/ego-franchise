import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog } from '@/components/ui/alert-dialog';

const LoginPage: React.FC = () => {
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message || '登录失败，请检查您的邮箱和密码');
        setShowErrorDialog(true);
        return;
      }
      
      // 登录成功，重定向到首页或仪表板
      navigate('/');
    } catch (err) {
      console.error('登录过程中发生错误:', err);
      setError('登录过程中发生错误，请稍后再试');
      setShowErrorDialog(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">逸刻新零售加盟商平台</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入您的邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入您的密码"
              />
            </div>
            <Button
            type="submit"
            className="w-full bg-[#00B0B9] hover:bg-[#009099]"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </Button>
          </form>
          
          <AlertDialog
            open={showErrorDialog}
            onClose={() => setShowErrorDialog(false)}
            title="登录失败"
            description={error || '登录过程中发生错误，请稍后再试'}
            confirmText="确定"
            variant="destructive"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;