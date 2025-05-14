// /Users/hq/Documents/Coding/ego-franchise/ego-franchise/src/pages/admin/SystemConfigurationPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SystemConfiguration, SystemConfigurationItem } from '@/components/admin/SystemConfigurationItem';

const SystemConfigurationPage: React.FC = () => {
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigurations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('system_configurations')
        .select('*')
        .order('key', { ascending: true });

      if (fetchError) throw fetchError;
      setConfigurations(data || []);
    } catch (err: any) {
      console.error('Error fetching configurations:', err);
      setError('无法加载系统配置项。');
      toast.error('加载配置失败', { description: err.message });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const handleSave = async (config: SystemConfiguration) => {
    try {
      const { error: saveError } = await supabase
        .from('system_configurations')
        .update({
          value: config.value,
          description: config.description,
          is_active: config.is_active,
        })
        .eq('id', config.id);

      if (saveError) throw saveError;
      toast.success(`配置项 "${config.key}" 已更新。`);
      fetchConfigurations(); // Refresh the list
    } catch (err: any) {
      console.error('Error saving configuration:', err);
      toast.error('保存配置失败', { description: err.message });
    }
  };
  
  // TODO: Implement Add New Configuration functionality if needed in the future.
  // For now, we focus on editing existing configurations like 'application.screening.allowed_cities'.

  if (loading) {
    return <div className="p-4">正在加载配置项...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>系统配置管理</CardTitle>
          <CardDescription>
            管理系统级别的配置项，例如加盟申请的自动化初筛规则。
          </CardDescription>
        </CardHeader>
      </Card>

      {configurations.length === 0 && (
        <p className="text-center text-gray-500">未找到任何系统配置项。</p>
      )}

      <div className="space-y-6">
        {configurations.map((config) => (
          <SystemConfigurationItem
            key={config.id}
            configuration={config}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
};

export default SystemConfigurationPage;