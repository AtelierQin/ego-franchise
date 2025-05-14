'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

const formSchema = z.object({
  fullName: z.string().min(2, { message: '姓名至少需要2个字符。' }),
  email: z.string().email({ message: '请输入有效的邮箱地址。' }),
  password: z.string().min(6, { message: '密码至少需要6个字符。' }),
});

type SignUpFormValues = z.infer<typeof formSchema>;

export function SignUpForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const handleSignUp = async (values: SignUpFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          // The role 'Applicant' and status 'pending_activation' will be set by the DB trigger
        },
      },
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      toast({
        title: '注册失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (data.user) {
      // data.user.user_metadata might not be immediately available or might be empty
      // The profile is created by a trigger, so we don't need to create it here.
      toast({
        title: '注册成功',
        description: '您的账户已创建，请等待管理员审核激活。',
      });
      // Optionally, redirect to a page indicating successful registration and pending approval
      // router.push('/signup-success'); 
      // For now, redirect to login or a generic success page
      router.push('/auth/pending-activation'); // A new page to inform user about activation
    } else if (data.session === null && data.user === null) {
        // This case can happen if email confirmation is required and user already exists but is unconfirmed
        // Or if auto-confirm is off and email confirmation is on.
        // Supabase signUp returns a user object even if email confirmation is pending.
        // If user is null AND session is null, it might indicate a specific scenario like user already exists but unconfirmed.
        // However, the `handle_new_user` trigger should still attempt to create a profile if the auth.users entry is new.
        // If the user *already* exists in auth.users (e.g. signed up but never confirmed, or is already active),
        // the trigger won't fire for an INSERT. Supabase handles this by not creating a new auth.user if one exists.
        // It might return an error if the user exists and is active, or a user object if exists and unconfirmed.

        // For this MVP, we assume the trigger handles new auth.users correctly.
        // If Supabase returns a user object (even if unconfirmed), our trigger creates a profile.
        // If Supabase returns an error (e.g. user already active), we show the error.
        setErrorMessage('注册请求已提交。如果您的邮箱已注册，请检查邮箱以完成确认，或联系管理员。');
        toast({
            title: '注册请求已处理',
            description: '请检查您的邮箱或等待管理员审核。',
            variant: 'default',
        });
        router.push('/auth/pending-activation');
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">加盟商注册</CardTitle>
        <CardDescription>
          请输入您的信息以创建账户，创建后需等待管理员审核激活。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入您的真实姓名" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '注册中...' : '创建账户'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}