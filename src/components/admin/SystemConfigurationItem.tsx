// /Users/hq/Documents/Coding/ego-franchise/ego-franchise/src/components/admin/SystemConfigurationItem.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export interface SystemConfiguration {
  id: string;
  key: string;
  value: any; // JSONB, so can be anything
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SystemConfigurationItemProps {
  configuration: SystemConfiguration;
  onSave: (config: SystemConfiguration) => Promise<void>;
}

export const SystemConfigurationItem: React.FC<SystemConfigurationItemProps> = ({ configuration, onSave }) => {
  const [currentValue, setCurrentValue] = useState<string>('');
  const [currentDescription, setCurrentDescription] = useState<string>(configuration.description || '');
  const [currentIsActive, setCurrentIsActive] = useState<boolean>(configuration.is_active);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    try {
      setCurrentValue(JSON.stringify(configuration.value, null, 2));
    } catch (e) {
      setCurrentValue(String(configuration.value)); // Fallback for non-JSON or malformed JSON
      console.warn(`Configuration key "${configuration.key}" has non-JSON stringifiable value:`, configuration.value);
    }
    setCurrentDescription(configuration.description || '');
    setCurrentIsActive(configuration.is_active);
  }, [configuration]);

  const handleSave = async () => {
    let parsedValue;
    try {
      parsedValue = JSON.parse(currentValue);
    } catch (e) {
      toast.error('配置值无效', { description: '配置值必须是有效的JSON格式。' });
      return;
    }

    const updatedConfig: SystemConfiguration = {
      ...configuration,
      value: parsedValue,
      description: currentDescription,
      is_active: currentIsActive,
    };
    await onSave(updatedConfig);
    setIsEditing(false);
  };

  const handleCancel = () => {
    try {
      setCurrentValue(JSON.stringify(configuration.value, null, 2));
    } catch (e) {
      setCurrentValue(String(configuration.value));
    }
    setCurrentDescription(configuration.description || '');
    setCurrentIsActive(configuration.is_active);
    setIsEditing(false);
  };

  // Determine input type based on key or value type for better UX
  const renderValueInput = () => {
    if (configuration.key === 'application.screening.allowed_cities' && typeof configuration.value === 'object' && configuration.value?.cities && Array.isArray(configuration.value.cities)) {
      // Special handling for allowed_cities: edit as a comma-separated string for simplicity
      const citiesString = configuration.value.cities.join(', ');
      const [editableCitiesString, setEditableCitiesString] = useState(citiesString);

      useEffect(() => {
        setEditableCitiesString(configuration.value.cities.join(', '));
      }, [configuration.value.cities]);

      const handleCitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableCitiesString(e.target.value);
        try {
          const citiesArray = e.target.value.split(',').map(city => city.trim()).filter(city => city.length > 0);
          setCurrentValue(JSON.stringify({ cities: citiesArray }, null, 2));
        } catch (err) {
          // If parsing fails, keep the raw string for JSON.parse in handleSave to catch
          setCurrentValue(e.target.value); 
        }
      };

      return (
        <Input
          id={`value-${configuration.id}`}
          value={editableCitiesString}
          onChange={handleCitiesChange}
          className="font-mono"
          placeholder='例如: 上海市, 北京市, 深圳市'
        />
      );
    }
    // Default to textarea for JSONB
    return (
      <Textarea
        id={`value-${configuration.id}`}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        rows={5}
        className="font-mono"
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{configuration.key}</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              最后更新: {new Date(configuration.updated_at).toLocaleString()}
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              编辑
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`description-${configuration.id}`} className="text-sm font-medium text-gray-700">
            描述
          </Label>
          {isEditing ? (
            <Textarea
              id={`description-${configuration.id}`}
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              placeholder="配置项的描述信息"
              rows={3}
            />
          ) : (
            <p className="text-sm text-gray-800 mt-1">
              {configuration.description || <span className="text-gray-400 italic">无描述</span>}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={`value-${configuration.id}`} className="text-sm font-medium text-gray-700">
            配置值 (JSON格式)
          </Label>
          {isEditing ? (
            renderValueInput()
          ) : (
            <pre className="text-sm bg-gray-50 p-3 rounded-md overflow-x-auto font-mono mt-1">
              {JSON.stringify(configuration.value, null, 2)}
            </pre>
          )}
        </div>

        <div className="flex items-center space-x-2 pt-2">
          {isEditing ? (
            <Switch
              id={`is_active-${configuration.id}`}
              checked={currentIsActive}
              onCheckedChange={setCurrentIsActive}
            />
          ) : (
            <Switch id={`is_active-${configuration.id}`} checked={configuration.is_active} disabled />
          )}
          <Label htmlFor={`is_active-${configuration.id}`} className="text-sm text-gray-700">
            {currentIsActive && isEditing ? '已激活' : !currentIsActive && isEditing ? '未激活' : configuration.is_active ? '已激活' : '未激活'}
          </Label>
        </div>
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>取消</Button>
          <Button onClick={handleSave}>保存更改</Button>
        </CardFooter>
      )}
    </Card>
  );
};