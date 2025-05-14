import RegisterForm from '../../components/auth/RegisterForm';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    // 注册成功后的操作，例如跳转到登录页或仪表盘
    console.log('Registration successful!');
    // 实际项目中可能会提示用户检查邮箱进行验证，或直接跳转
    alert('注册成功！请检查您的邮箱以完成验证（如果需要），然后尝试登录。');
    navigate('/auth/login'); // 跳转到登录页面
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img 
          className="mx-auto h-12 w-auto" 
          src="/logo.png" // 假设有一个logo在public/logo.png
          alt="逸刻新零售"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          创建您的账户
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          或{' '}
          <a href="/auth/login" className="font-medium text-primary hover:text-primary-dark">
            登录您的账户
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm onSuccess={handleRegisterSuccess} />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;